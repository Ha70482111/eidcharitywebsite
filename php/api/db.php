<?php
// Database layer (PDO). MySQL in production; SQLite only for automated tests.

define('EID_CONFIG_FILE', getenv('EID_CONFIG_FILE') ?: __DIR__ . '/config.php');

function eid_config()
{
    static $cfg = null;
    if ($cfg !== null) return $cfg;
    if (getenv('EID_DB_DRIVER') === 'sqlite') {
        $cfg = ['driver' => 'sqlite', 'sqlite_file' => getenv('EID_SQLITE_FILE') ?: ':memory:'];
    } elseif (is_file(EID_CONFIG_FILE)) {
        $cfg = require EID_CONFIG_FILE;
    } else {
        $cfg = false;
    }
    return $cfg;
}

function eid_connect(array $cfg)
{
    $opts = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    if (($cfg['driver'] ?? 'mysql') === 'sqlite') {
        return new PDO('sqlite:' . $cfg['sqlite_file'], null, null, $opts);
    }
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $cfg['db_host'] ?? 'localhost', (int)($cfg['db_port'] ?? 3306), $cfg['db_name']);
    return new PDO($dsn, $cfg['db_user'], $cfg['db_password'], $opts);
}

function db()
{
    static $pdo = null;
    if ($pdo === null) {
        $cfg = eid_config();
        if (!$cfg) throw new HttpError(503, 'الموقع لم يُجهَّز بعد');
        $pdo = eid_connect($cfg);
    }
    return $pdo;
}

function db_dialect(PDO $pdo = null)
{
    $pdo = $pdo ?: db();
    return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite' ? 'sqlite' : 'mysql';
}

/** Runs a query. SELECT returns rows; anything else returns ['insertId' => .., 'affectedRows' => ..]. */
function q($sql, array $params = [], PDO $pdo = null)
{
    $pdo = $pdo ?: db();
    $st = $pdo->prepare($sql);
    foreach (array_values($params) as $i => $v) {
        if (is_bool($v)) $v = $v ? 1 : 0;
        $type = $v === null ? PDO::PARAM_NULL : (is_int($v) ? PDO::PARAM_INT : PDO::PARAM_STR);
        $st->bindValue($i + 1, $v, $type);
    }
    $st->execute();
    if (preg_match('/^\s*select/i', $sql)) return $st->fetchAll();
    return ['insertId' => (int)$pdo->lastInsertId(), 'affectedRows' => $st->rowCount()];
}

function jparse($s, $fallback = [])
{
    if ($s === null || $s === '') return $fallback;
    $v = json_decode($s, true);
    return $v === null ? $fallback : $v;
}

function jenc($v)
{
    if (is_array($v) && empty($v)) return '{}';
    return json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function eid_ddl($dialect)
{
    $pk = $dialect === 'mysql' ? 'INT NOT NULL AUTO_INCREMENT PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    $tail = $dialect === 'mysql' ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci' : '';
    $tables = [
        'admins' => "id $pk, username VARCHAR(100) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at VARCHAR(30) NULL",
        'settings' => "k VARCHAR(100) NOT NULL PRIMARY KEY, v LONGTEXT NULL",
        'menu_items' => "id $pk, parent_id INT NULL, label_ar VARCHAR(255) NOT NULL DEFAULT '', label_en VARCHAR(255) NOT NULL DEFAULT '', url VARCHAR(500) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, is_visible TINYINT NOT NULL DEFAULT 1, extra LONGTEXT NULL",
        'sections' => "id $pk, type VARCHAR(50) NOT NULL, name VARCHAR(255) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, is_visible TINYINT NOT NULL DEFAULT 1, content LONGTEXT NULL",
        'pages' => "id $pk, slug VARCHAR(120) NOT NULL UNIQUE, title_ar VARCHAR(255) NOT NULL DEFAULT '', title_en VARCHAR(255) NOT NULL DEFAULT '', sort_order INT NOT NULL DEFAULT 0, is_visible TINYINT NOT NULL DEFAULT 1, content LONGTEXT NULL",
        'section_items' => "id $pk, section_id INT NOT NULL, sort_order INT NOT NULL DEFAULT 0, is_visible TINYINT NOT NULL DEFAULT 1, content LONGTEXT NULL",
        'login_attempts' => "id $pk, ip VARCHAR(64) NOT NULL, attempted_at INT NOT NULL",
    ];
    $out = [];
    foreach ($tables as $name => $cols) $out[] = "CREATE TABLE IF NOT EXISTS $name ($cols)$tail";
    return $out;
}

/** Creates tables if missing and fills a brand-new database with the starting content. */
function eid_ensure_schema(PDO $pdo = null)
{
    $pdo = $pdo ?: db();
    foreach (eid_ddl(db_dialect($pdo)) as $stmt) $pdo->exec($stmt);
    eid_add_column($pdo, 'sections', 'page_id', 'INT NULL');
    $n = (int)q('SELECT COUNT(*) AS n FROM sections', [], $pdo)[0]['n'];
    $m = (int)q("SELECT COUNT(*) AS m FROM settings WHERE k = 'site'", [], $pdo)[0]['m'];
    if ($n === 0 && $m === 0) eid_seed($pdo);
    eid_import_pages($pdo);
}

/** Adds a column to a table that already exists (databases created before the column was introduced). */
function eid_add_column(PDO $pdo, $table, $column, $def)
{
    try {
        $pdo->query("SELECT $column FROM $table LIMIT 1");
    } catch (PDOException $e) {
        $pdo->exec("ALTER TABLE $table ADD COLUMN $column $def");
    }
}

/**
 * One-time import of the sub-pages (content taken from the old website) into an existing database.
 * The 'pages_imported' setting is written first and acts as a lock, so the pages are added only once
 * and never come back after the owner edits or deletes them in /admin.
 */
function eid_import_pages(PDO $pdo)
{
    if (q("SELECT k FROM settings WHERE k = 'pages_imported'", [], $pdo)) return;
    try {
        q("INSERT INTO settings (k, v) VALUES ('pages_imported', ?)", [json_encode(gmdate('c'))], $pdo);
    } catch (PDOException $e) {
        return; // another request is importing right now
    }
    $data = json_decode(file_get_contents(__DIR__ . '/seed.json'), true);
    $pdo->beginTransaction();
    try {
        foreach (array_values($data['pages'] ?? []) as $i => $p) {
            if (q('SELECT id FROM pages WHERE slug = ?', [$p['slug']], $pdo)) continue;
            $r = q('INSERT INTO pages (slug, title_ar, title_en, sort_order, is_visible, content) VALUES (?, ?, ?, ?, ?, ?)',
                [$p['slug'], $p['title']['ar'], $p['title']['en'], $i + 1, ($p['visible'] ?? true) ? 1 : 0, jenc($p['content'] ?? [])], $pdo);
            foreach (array_values($p['sections']) as $j => $s) {
                $sr = q('INSERT INTO sections (type, name, sort_order, is_visible, content, page_id) VALUES (?, ?, ?, 1, ?, ?)',
                    [$s['type'], $s['name'], $j + 1, jenc($s['content']), $r['insertId']], $pdo);
                foreach (array_values($s['items'] ?? []) as $k => $item) {
                    q('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, 1, ?)',
                        [$sr['insertId'], $k + 1, jenc($item)], $pdo);
                }
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        q("DELETE FROM settings WHERE k = 'pages_imported'", [], $pdo);
        throw $e;
    }
}

function eid_seed(PDO $pdo)
{
    $data = json_decode(file_get_contents(__DIR__ . '/seed.json'), true);
    $pdo->beginTransaction();
    try {
        q('INSERT INTO settings (k, v) VALUES (?, ?)', ['site', jenc($data['settings'])], $pdo);
        $insertMenu = function ($items, $parentId) use (&$insertMenu, $pdo) {
            foreach (array_values($items) as $i => $it) {
                $r = q('INSERT INTO menu_items (parent_id, label_ar, label_en, url, sort_order, is_visible, extra) VALUES (?, ?, ?, ?, ?, 1, ?)',
                    [$parentId, $it['label']['ar'], $it['label']['en'], $it['url'] ?? '', $i + 1, jenc($it['extra'] ?? [])], $pdo);
                if (!empty($it['children'])) $insertMenu($it['children'], $r['insertId']);
            }
        };
        $insertMenu($data['menu'], null);
        foreach (array_values($data['sections']) as $i => $s) {
            $r = q('INSERT INTO sections (type, name, sort_order, is_visible, content) VALUES (?, ?, ?, 1, ?)',
                [$s['type'], $s['name'], $i + 1, jenc($s['content'])], $pdo);
            foreach (array_values($s['items']) as $j => $item) {
                q('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, 1, ?)',
                    [$r['insertId'], $j + 1, jenc($item)], $pdo);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function get_setting($k, $fallback = null)
{
    $rows = q('SELECT v FROM settings WHERE k = ?', [$k]);
    return $rows ? jparse($rows[0]['v'], $fallback) : $fallback;
}

function set_setting($k, $value)
{
    $v = is_string($value) ? json_encode($value) : jenc($value);
    if (q('SELECT k FROM settings WHERE k = ?', [$k])) q('UPDATE settings SET v = ? WHERE k = ?', [$v, $k]);
    else q('INSERT INTO settings (k, v) VALUES (?, ?)', [$k, $v]);
}
