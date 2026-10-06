<?php
// Eid Charity API — single entry point. .htaccess routes /api/* here.
class HttpError extends Exception
{
    public $status;
    public function __construct($status, $message) { parent::__construct($message); $this->status = $status; }
}

require __DIR__ . '/db.php';
require __DIR__ . '/auth.php';

define('EID_UPLOAD_DIR', getenv('EID_UPLOAD_DIR') ?: dirname(__DIR__) . '/uploads');
define('EID_MAX_UPLOAD', 5 * 1024 * 1024);

// ── helpers ─────────────────────────────────────────────────────────────────
function str($v, $max = 500)
{
    if (is_array($v)) $v = '';
    $v = (string)($v ?? '');
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}
function slen($v) { return function_exists('mb_strlen') ? mb_strlen($v) : strlen($v); }
function boolv($v) { return $v === true || $v === 1 || $v === '1' || $v === 'true'; }
function intv($v)
{
    if (is_int($v)) return $v;
    if (is_string($v) && preg_match('/^-?\d+$/', $v)) return (int)$v;
    if (is_float($v) && floor($v) == $v) return (int)$v;
    throw new HttpError(400, 'رقم غير صالح');
}
function objv($v, $name = 'content')
{
    if ($v === null) return [];
    if (!is_array($v) || (array_keys($v) === range(0, count($v) - 1) && count($v) > 0)) throw new HttpError(400, "$name يجب أن يكون كائن JSON");
    if (strlen(json_encode($v)) > 512 * 1024) throw new HttpError(413, "$name كبير جدًا");
    return $v;
}
function idsv($v)
{
    if (!is_array($v) || count($v) > 500) throw new HttpError(400, 'قائمة الترتيب غير صالحة');
    return array_map('intv', array_values($v));
}
function has($body, $k) { return array_key_exists($k, $body); }

function menu_row($r)
{
    return ['id' => (int)$r['id'], 'parent_id' => $r['parent_id'] === null ? null : (int)$r['parent_id'],
        'label_ar' => $r['label_ar'], 'label_en' => $r['label_en'], 'url' => $r['url'],
        'sort_order' => (int)$r['sort_order'], 'is_visible' => (bool)(int)$r['is_visible'], 'extra' => (object)jparse($r['extra'])];
}
function section_row($r)
{
    return ['id' => (int)$r['id'], 'type' => $r['type'], 'name' => $r['name'], 'sort_order' => (int)$r['sort_order'],
        'is_visible' => (bool)(int)$r['is_visible'], 'content' => (object)jparse($r['content']),
        'page_id' => isset($r['page_id']) ? (int)$r['page_id'] : null];
}
function page_row($r)
{
    return ['id' => (int)$r['id'], 'slug' => $r['slug'], 'title_ar' => $r['title_ar'], 'title_en' => $r['title_en'],
        'sort_order' => (int)$r['sort_order'], 'is_visible' => (bool)(int)$r['is_visible'], 'content' => (object)jparse($r['content'])];
}
function slugv($v)
{
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', str($v, 120)), '-'));
    if ($slug === '') throw new HttpError(400, 'اكتب رابط الصفحة بحروف إنجليزية أو أرقام (مثال: about-us)');
    return $slug;
}
function slug_taken($slug, $exceptId = 0)
{
    return (bool)q('SELECT id FROM pages WHERE slug = ? AND id <> ?', [$slug, $exceptId]);
}
/** Page filter for section queries: NULL = home page. */
function page_scope($pageId)
{
    return $pageId === null ? ['page_id IS NULL', []] : ['page_id = ?', [$pageId]];
}
/** Visible sections (with visible items) of the home page (null) or of one sub-page. */
function public_sections($pageId)
{
    [$where, $params] = page_scope($pageId);
    $sections = array_map('section_row', q("SELECT * FROM sections WHERE is_visible = 1 AND $where ORDER BY sort_order, id", $params));
    if (!$sections) return [];
    $ids = implode(',', array_map(function ($s) { return $s['id']; }, $sections));
    $items = array_map('item_row', q("SELECT * FROM section_items WHERE is_visible = 1 AND section_id IN ($ids) ORDER BY sort_order, id"));
    foreach ($sections as &$s) {
        $s['items'] = array_values(array_filter($items, function ($i) use ($s) { return $i['section_id'] === $s['id']; }));
    }
    return $sections;
}
function delete_section($id)
{
    q('DELETE FROM section_items WHERE section_id = ?', [$id]);
    q('DELETE FROM sections WHERE id = ?', [$id]);
}
function item_row($r)
{
    return ['id' => (int)$r['id'], 'section_id' => (int)$r['section_id'], 'sort_order' => (int)$r['sort_order'],
        'is_visible' => (bool)(int)$r['is_visible'], 'content' => (object)jparse($r['content'])];
}
function must_find($table, $id, $label)
{
    $rows = q("SELECT * FROM $table WHERE id = ?", [$id]);
    if (!$rows) throw new HttpError(404, "$label غير موجود");
    return $rows[0];
}
function menu_depth($id)
{
    $depth = 0;
    while ($id !== null && $depth < 10) {
        $rows = q('SELECT parent_id FROM menu_items WHERE id = ?', [$id]);
        if (!$rows) break;
        $depth++;
        $id = $rows[0]['parent_id'] === null ? null : (int)$rows[0]['parent_id'];
    }
    return $depth;
}
function delete_menu_tree($id)
{
    foreach (q('SELECT id FROM menu_items WHERE parent_id = ?', [$id]) as $k) delete_menu_tree((int)$k['id']);
    q('DELETE FROM menu_items WHERE id = ?', [$id]);
}
function next_order($table, $where = '', $params = [])
{
    return (int)q("SELECT COALESCE(MAX(sort_order), 0) AS m FROM $table $where", $params)[0]['m'] + 1;
}
function apply_order($table, array $list, $scopeCol = null, $scopeVal = null, $scoped = false)
{
    foreach ($list as $i => $id) {
        if ($scoped) {
            if ($scopeVal === null) q("UPDATE $table SET sort_order = ? WHERE id = ? AND $scopeCol IS NULL", [$i + 1, $id]);
            else q("UPDATE $table SET sort_order = ? WHERE id = ? AND $scopeCol = ?", [$i + 1, $id, $scopeVal]);
        } else {
            q("UPDATE $table SET sort_order = ? WHERE id = ?", [$i + 1, $id]);
        }
    }
}
function build_tree(array $rows)
{
    $by = [];
    foreach ($rows as $r) $by[$r['parent_id'] ?? 0][] = $r;
    $walk = function ($pid) use (&$walk, &$by) {
        $list = $by[$pid] ?? [];
        usort($list, function ($a, $b) { return $a['sort_order'] - $b['sort_order'] ?: $a['id'] - $b['id']; });
        return array_map(function ($r) use ($walk) { $r['children'] = $walk($r['id']); return $r; }, $list);
    };
    return $walk(0);
}
function admin_count() { return (int)q('SELECT COUNT(*) AS n FROM admins')[0]['n']; }
function validate_credentials($username, $password)
{
    if (slen($username) < 3) throw new HttpError(400, 'اسم المستخدم 3 أحرف على الأقل');
    if (slen($password) < 8) throw new HttpError(400, 'كلمة المرور 8 أحرف على الأقل');
}
function create_admin($username, $password)
{
    $r = q('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
        [$username, password_hash($password, PASSWORD_DEFAULT), gmdate('c')]);
    return ['id' => $r['insertId'], 'username' => $username];
}

// ── routes ──────────────────────────────────────────────────────────────────
$routes = [];
function route($method, $pattern, $handler)
{
    global $routes;
    $keys = [];
    $re = '#^' . preg_replace_callback('/:(\w+)/', function ($m) use (&$keys) {
        $keys[] = $m[1];
        return $m[1] === 'slug' ? '([A-Za-z0-9-]+)' : '(\d+)';
    }, $pattern) . '$#';
    $routes[] = ['method' => $method, 're' => $re, 'keys' => $keys, 'handler' => $handler, 'auth' => strpos($pattern, '/api/admin') === 0];
}

// First-run installer: saves DB credentials, creates tables + content + first admin.
route('POST', '/api/install', function ($ctx) {
    if (eid_config()) throw new HttpError(403, 'الموقع مُجهَّز بالفعل');
    $b = $ctx['body'];
    $username = trim(str($b['username'] ?? '', 100));
    $password = str($b['password'] ?? '', 200);
    validate_credentials($username, $password);
    $cfg = [
        'driver' => 'mysql',
        'db_host' => trim(str($b['db_host'] ?? 'localhost', 200)) ?: 'localhost',
        'db_port' => 3306,
        'db_name' => trim(str($b['db_name'] ?? '', 200)),
        'db_user' => trim(str($b['db_user'] ?? '', 200)),
        'db_password' => str($b['db_password'] ?? '', 500),
        'app_secret' => bin2hex(random_bytes(32)),
    ];
    if (getenv('EID_TEST') === '1' && ($b['driver'] ?? '') === 'sqlite') {
        $cfg = ['driver' => 'sqlite', 'sqlite_file' => str($b['sqlite_file'] ?? '', 500), 'app_secret' => $cfg['app_secret']];
    } elseif ($cfg['db_name'] === '' || $cfg['db_user'] === '') {
        throw new HttpError(400, 'اكتب اسم قاعدة البيانات واسم المستخدم');
    }
    try {
        $pdo = eid_connect($cfg);
    } catch (PDOException $e) {
        throw new HttpError(400, 'تعذر الاتصال بقاعدة البيانات. راجع الاسم والمستخدم وكلمة المرور. (' . $e->getMessage() . ')');
    }
    eid_ensure_schema($pdo);
    if ((int)q('SELECT COUNT(*) AS n FROM admins', [], $pdo)[0]['n'] > 0) throw new HttpError(403, 'قاعدة البيانات فيها حساب مدير بالفعل');
    $php = "<?php\n// Generated by the installer. Keep this file private.\nreturn " . var_export($cfg, true) . ";\n";
    if (@file_put_contents(EID_CONFIG_FILE, $php) === false) throw new HttpError(500, 'تعذر حفظ ملف الإعدادات api/config.php — تأكد من صلاحيات الكتابة');
    @chmod(EID_CONFIG_FILE, 0600);
    $r = q('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)',
        [$username, password_hash($password, PASSWORD_DEFAULT), gmdate('c')], $pdo);
    return ['ok' => true, 'user' => ['id' => $r['insertId'], 'username' => $username]];
});

route('GET', '/api/site', function () {
    $settings = get_setting('site', []);
    $menu = array_map('menu_row', q('SELECT * FROM menu_items WHERE is_visible = 1'));
    return ['settings' => (object)$settings, 'menu' => build_tree($menu), 'sections' => public_sections(null)];
});

// A sub-page: same header/footer data as /api/site plus the page and its own sections.
route('GET', '/api/page/:slug', function ($ctx) {
    $rows = q('SELECT * FROM pages WHERE slug = ? AND is_visible = 1', [strtolower($ctx['params']['slug'])]);
    if (!$rows) throw new HttpError(404, 'الصفحة غير موجودة');
    $page = page_row($rows[0]);
    $menu = array_map('menu_row', q('SELECT * FROM menu_items WHERE is_visible = 1'));
    return ['settings' => (object)get_setting('site', []), 'menu' => build_tree($menu), 'page' => $page, 'sections' => public_sections($page['id'])];
});

route('GET', '/api/auth/status', function ($ctx) {
    return ['needsInstall' => false, 'needsSetup' => admin_count() === 0, 'user' => $ctx['user']];
});

route('POST', '/api/auth/setup', function ($ctx) {
    if (admin_count() > 0) throw new HttpError(403, 'تم إنشاء حساب المدير بالفعل');
    $username = trim(str($ctx['body']['username'] ?? '', 100));
    $password = str($ctx['body']['password'] ?? '', 200);
    validate_credentials($username, $password);
    $user = create_admin($username, $password);
    return ['token' => sign_token($user), 'user' => $user];
});

route('POST', '/api/auth/login', function ($ctx) {
    $ip = $ctx['ip'];
    if (too_many_attempts($ip)) throw new HttpError(429, 'محاولات كثيرة، حاول بعد 15 دقيقة');
    $rows = q('SELECT * FROM admins WHERE username = ?', [trim(str($ctx['body']['username'] ?? '', 100))]);
    if (!$rows || !password_verify(str($ctx['body']['password'] ?? '', 200), $rows[0]['password_hash'])) {
        record_failure($ip);
        throw new HttpError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
    clear_failures($ip);
    $user = ['id' => (int)$rows[0]['id'], 'username' => $rows[0]['username']];
    return ['token' => sign_token($user), 'user' => $user];
});

// Admin: menu
route('GET', '/api/admin/menu', function () {
    return array_map('menu_row', q('SELECT * FROM menu_items ORDER BY sort_order, id'));
});
route('POST', '/api/admin/menu', function ($ctx) {
    $b = $ctx['body'];
    $pid = (!isset($b['parent_id']) || $b['parent_id'] === '') ? null : intv($b['parent_id']);
    if ($pid !== null) {
        must_find('menu_items', $pid, 'العنصر الأب');
        if (menu_depth($pid) >= 3) throw new HttpError(400, 'المنيو يدعم 3 مستويات فقط');
    }
    $order = $pid === null ? next_order('menu_items', 'WHERE parent_id IS NULL') : next_order('menu_items', 'WHERE parent_id = ?', [$pid]);
    $r = q('INSERT INTO menu_items (parent_id, label_ar, label_en, url, sort_order, is_visible, extra) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$pid, str($b['label_ar'] ?? '', 255), str($b['label_en'] ?? '', 255), str($b['url'] ?? '', 500), $order,
            has($b, 'is_visible') ? boolv($b['is_visible']) : 1, jenc(objv($b['extra'] ?? null, 'extra'))]);
    return menu_row(must_find('menu_items', $r['insertId'], 'العنصر'));
});
route('PUT', '/api/admin/menu/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $b = $ctx['body'];
    $cur = menu_row(must_find('menu_items', $id, 'العنصر'));
    q('UPDATE menu_items SET label_ar = ?, label_en = ?, url = ?, is_visible = ?, extra = ? WHERE id = ?', [
        has($b, 'label_ar') ? str($b['label_ar'], 255) : $cur['label_ar'],
        has($b, 'label_en') ? str($b['label_en'], 255) : $cur['label_en'],
        has($b, 'url') ? str($b['url'], 500) : $cur['url'],
        has($b, 'is_visible') ? boolv($b['is_visible']) : $cur['is_visible'],
        has($b, 'extra') ? jenc(objv($b['extra'], 'extra')) : jenc((array)$cur['extra']), $id]);
    return menu_row(must_find('menu_items', $id, 'العنصر'));
});
route('DELETE', '/api/admin/menu/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    must_find('menu_items', $id, 'العنصر');
    delete_menu_tree($id);
    return ['ok' => true];
});
route('POST', '/api/admin/menu/reorder', function ($ctx) {
    $b = $ctx['body'];
    $pid = (!isset($b['parent_id']) || $b['parent_id'] === '') ? null : intv($b['parent_id']);
    apply_order('menu_items', idsv($b['ids'] ?? null), 'parent_id', $pid, true);
    return ['ok' => true];
});

// Admin: sub-pages
route('GET', '/api/admin/pages', function () {
    $pages = array_map('page_row', q('SELECT * FROM pages ORDER BY sort_order, id'));
    $counts = [];
    foreach (q('SELECT page_id, COUNT(*) AS n FROM sections WHERE page_id IS NOT NULL GROUP BY page_id') as $c) $counts[(int)$c['page_id']] = (int)$c['n'];
    foreach ($pages as &$p) $p['section_count'] = $counts[$p['id']] ?? 0;
    return $pages;
});
route('POST', '/api/admin/pages', function ($ctx) {
    $b = $ctx['body'];
    $slug = slugv($b['slug'] ?? '');
    if (slug_taken($slug)) throw new HttpError(409, 'فيه صفحة تانية بنفس الرابط، اختر رابطًا مختلفًا');
    $r = q('INSERT INTO pages (slug, title_ar, title_en, sort_order, is_visible, content) VALUES (?, ?, ?, ?, ?, ?)',
        [$slug, str($b['title_ar'] ?? '', 255), str($b['title_en'] ?? '', 255), next_order('pages'),
            has($b, 'is_visible') ? boolv($b['is_visible']) : 1, jenc(objv($b['content'] ?? null))]);
    return page_row(must_find('pages', $r['insertId'], 'الصفحة'));
});
route('GET', '/api/admin/pages/:id', function ($ctx) {
    return page_row(must_find('pages', intv($ctx['params']['id']), 'الصفحة'));
});
route('PUT', '/api/admin/pages/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $b = $ctx['body'];
    $cur = page_row(must_find('pages', $id, 'الصفحة'));
    $slug = has($b, 'slug') ? slugv($b['slug']) : $cur['slug'];
    if (slug_taken($slug, $id)) throw new HttpError(409, 'فيه صفحة تانية بنفس الرابط، اختر رابطًا مختلفًا');
    q('UPDATE pages SET slug = ?, title_ar = ?, title_en = ?, is_visible = ?, content = ? WHERE id = ?', [$slug,
        has($b, 'title_ar') ? str($b['title_ar'], 255) : $cur['title_ar'],
        has($b, 'title_en') ? str($b['title_en'], 255) : $cur['title_en'],
        has($b, 'is_visible') ? boolv($b['is_visible']) : $cur['is_visible'],
        has($b, 'content') ? jenc(objv($b['content'])) : jenc((array)$cur['content']), $id]);
    return page_row(must_find('pages', $id, 'الصفحة'));
});
route('DELETE', '/api/admin/pages/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    must_find('pages', $id, 'الصفحة');
    foreach (q('SELECT id FROM sections WHERE page_id = ?', [$id]) as $s) delete_section((int)$s['id']);
    q('DELETE FROM pages WHERE id = ?', [$id]);
    return ['ok' => true];
});
route('POST', '/api/admin/pages/reorder', function ($ctx) {
    apply_order('pages', idsv($ctx['body']['ids'] ?? null));
    return ['ok' => true];
});

// Copies images and PDF files that the imported pages still load from the old website (eidcharity.net)
// into uploads/, and points the pages at the copies. A few files per call; the admin repeats until none remain.
define('EID_OLD_SITE_FILE', '#https?://(?:www\.)?eidcharity\.net/[^\s"\'<>\\\\]+?\.(?:jpe?g|png|gif|webp|pdf)(?=["\s]|$)#i');
function old_site_rows()
{
    $rows = [];
    foreach (q('SELECT id, content FROM pages') as $r) $rows[] = ['pages', $r];
    foreach (q('SELECT id, content FROM sections WHERE page_id IS NOT NULL') as $r) $rows[] = ['sections', $r];
    foreach (q('SELECT i.id, i.content FROM section_items i JOIN sections s ON s.id = i.section_id WHERE s.page_id IS NOT NULL') as $r) $rows[] = ['section_items', $r];
    return $rows;
}
function download_file($url)
{
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 25, CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_USERAGENT => 'EidCharity-site-import', CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS]);
        $buf = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        return ($buf !== false && $code === 200) ? $buf : false;
    }
    $ctx = stream_context_create(['http' => ['timeout' => 25, 'follow_location' => 0, 'user_agent' => 'EidCharity-site-import']]);
    return @file_get_contents($url, false, $ctx);
}
route('POST', '/api/admin/pages/import-media', function ($ctx) {
    $failed = boolv($ctx['body']['retry'] ?? false) ? [] : get_setting('media_import_failed', []);
    $rows = old_site_rows();
    $urls = [];
    foreach ($rows as [$table, $r]) {
        if (preg_match_all(EID_OLD_SITE_FILE, (string)$r['content'], $m)) foreach ($m[0] as $u) $urls[$u] = true;
    }
    $todo = array_values(array_diff(array_keys($urls), $failed));
    $copied = 0;
    $map = [];
    foreach (array_slice($todo, 0, 8) as $url) {
        $mime = preg_match('/\.pdf$/i', $url) ? 'application/pdf' : (preg_match('/\.png$/i', $url) ? 'image/png'
            : (preg_match('/\.gif$/i', $url) ? 'image/gif' : (preg_match('/\.webp$/i', $url) ? 'image/webp' : 'image/jpeg')));
        try {
            $buf = download_file($url);
            if ($buf === false || $buf === '') throw new HttpError(502, 'download failed');
            if ($mime !== 'application/pdf' && function_exists('getimagesizefromstring')) {
                $info = @getimagesizefromstring($buf);
                if ($info && isset(EID_UPLOAD_TYPES[$info['mime']])) $mime = $info['mime'];
            }
            $map[$url] = save_upload($buf, $mime, basename(rawurldecode(parse_url($url, PHP_URL_PATH))), 25 * 1024 * 1024);
            $copied++;
        } catch (Throwable $e) {
            $failed[] = $url;
        }
    }
    if ($map) {
        foreach ($rows as [$table, $r]) {
            $new = strtr((string)$r['content'], $map);
            if ($new !== $r['content']) q("UPDATE $table SET content = ? WHERE id = ?", [$new, (int)$r['id']]);
        }
    }
    set_setting('media_import_failed', array_values(array_unique($failed)));
    $remaining = count($todo) - count(array_slice($todo, 0, 8));
    return ['copied' => $copied, 'remaining' => $remaining, 'failed' => count(array_intersect(array_keys($urls), $failed))];
});

// Admin: sections (?page=ID lists a sub-page's sections; without it, the home page's)
route('GET', '/api/admin/sections', function () {
    $pageId = isset($_GET['page']) && $_GET['page'] !== '' ? intv($_GET['page']) : null;
    [$where, $params] = page_scope($pageId);
    $sections = array_map('section_row', q("SELECT * FROM sections WHERE $where ORDER BY sort_order, id", $params));
    $counts = [];
    foreach (q('SELECT section_id, COUNT(*) AS n FROM section_items GROUP BY section_id') as $c) $counts[(int)$c['section_id']] = (int)$c['n'];
    foreach ($sections as &$s) $s['item_count'] = $counts[$s['id']] ?? 0;
    return $sections;
});
route('POST', '/api/admin/sections', function ($ctx) {
    $b = $ctx['body'];
    $type = str($b['type'] ?? '', 50);
    if (!preg_match('/^[a-z_]+$/', $type)) throw new HttpError(400, 'نوع القسم غير صالح');
    $pageId = (!isset($b['page_id']) || $b['page_id'] === '') ? null : intv($b['page_id']);
    if ($pageId !== null) must_find('pages', $pageId, 'الصفحة');
    [$where, $params] = page_scope($pageId);
    $r = q('INSERT INTO sections (type, name, sort_order, is_visible, content, page_id) VALUES (?, ?, ?, ?, ?, ?)',
        [$type, str($b['name'] ?? '', 255), next_order('sections', "WHERE $where", $params), has($b, 'is_visible') ? boolv($b['is_visible']) : 1,
            jenc(objv($b['content'] ?? null)), $pageId]);
    $items = is_array($b['items'] ?? null) ? array_slice(array_values($b['items']), 0, 50) : [];
    foreach ($items as $i => $it) {
        q('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, 1, ?)', [$r['insertId'], $i + 1, jenc(objv($it))]);
    }
    return section_row(must_find('sections', $r['insertId'], 'القسم'));
});
route('GET', '/api/admin/sections/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $s = section_row(must_find('sections', $id, 'القسم'));
    $s['items'] = array_map('item_row', q('SELECT * FROM section_items WHERE section_id = ? ORDER BY sort_order, id', [$id]));
    return $s;
});
route('PUT', '/api/admin/sections/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $b = $ctx['body'];
    $cur = section_row(must_find('sections', $id, 'القسم'));
    q('UPDATE sections SET name = ?, is_visible = ?, content = ? WHERE id = ?', [
        has($b, 'name') ? str($b['name'], 255) : $cur['name'],
        has($b, 'is_visible') ? boolv($b['is_visible']) : $cur['is_visible'],
        has($b, 'content') ? jenc(objv($b['content'])) : jenc((array)$cur['content']), $id]);
    return section_row(must_find('sections', $id, 'القسم'));
});
route('DELETE', '/api/admin/sections/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    must_find('sections', $id, 'القسم');
    delete_section($id);
    return ['ok' => true];
});
route('POST', '/api/admin/sections/reorder', function ($ctx) {
    apply_order('sections', idsv($ctx['body']['ids'] ?? null));
    return ['ok' => true];
});
route('POST', '/api/admin/sections/:id/duplicate', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $s = section_row(must_find('sections', $id, 'القسم'));
    $content = (array)$s['content'];
    $content['anchor'] = !empty($content['anchor']) ? $content['anchor'] . '-2' : '';
    [$where, $params] = page_scope($s['page_id']);
    $r = q('INSERT INTO sections (type, name, sort_order, is_visible, content, page_id) VALUES (?, ?, ?, 0, ?, ?)',
        [$s['type'], $s['name'] . ' (نسخة)', next_order('sections', "WHERE $where", $params), jenc($content), $s['page_id']]);
    foreach (q('SELECT * FROM section_items WHERE section_id = ? ORDER BY sort_order, id', [$id]) as $it) {
        q('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, ?, ?)',
            [$r['insertId'], (int)$it['sort_order'], (int)$it['is_visible'], $it['content']]);
    }
    return section_row(must_find('sections', $r['insertId'], 'القسم'));
});

// Admin: section items
route('POST', '/api/admin/sections/:id/items', function ($ctx) {
    $sid = intv($ctx['params']['id']);
    $b = $ctx['body'];
    must_find('sections', $sid, 'القسم');
    $r = q('INSERT INTO section_items (section_id, sort_order, is_visible, content) VALUES (?, ?, ?, ?)',
        [$sid, next_order('section_items', 'WHERE section_id = ?', [$sid]), has($b, 'is_visible') ? boolv($b['is_visible']) : 1, jenc(objv($b['content'] ?? null))]);
    return item_row(must_find('section_items', $r['insertId'], 'العنصر'));
});
route('POST', '/api/admin/sections/:id/items/reorder', function ($ctx) {
    apply_order('section_items', idsv($ctx['body']['ids'] ?? null), 'section_id', intv($ctx['params']['id']), true);
    return ['ok' => true];
});
route('PUT', '/api/admin/items/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    $b = $ctx['body'];
    $cur = item_row(must_find('section_items', $id, 'العنصر'));
    q('UPDATE section_items SET is_visible = ?, content = ? WHERE id = ?', [
        has($b, 'is_visible') ? boolv($b['is_visible']) : $cur['is_visible'],
        has($b, 'content') ? jenc(objv($b['content'])) : jenc((array)$cur['content']), $id]);
    return item_row(must_find('section_items', $id, 'العنصر'));
});
route('DELETE', '/api/admin/items/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    must_find('section_items', $id, 'العنصر');
    q('DELETE FROM section_items WHERE id = ?', [$id]);
    return ['ok' => true];
});

// Admin: settings
route('GET', '/api/admin/settings', function () { return (object)get_setting('site', []); });
route('PUT', '/api/admin/settings', function ($ctx) {
    set_setting('site', objv($ctx['body'], 'settings'));
    return (object)get_setting('site', []);
});

// Admin: uploads (images and PDF files sent as base64 data URLs)
define('EID_UPLOAD_TYPES', ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp', 'image/gif' => 'gif', 'application/pdf' => 'pdf']);
/** Checks an uploaded or downloaded file and saves it in uploads/; returns its public URL. */
function save_upload($buf, $mime, $filename, $max = EID_MAX_UPLOAD)
{
    if (strlen($buf) > $max) throw new HttpError(413, 'أقصى حجم للملف ' . round($max / 1048576) . ' ميجا');
    if ($mime === 'application/pdf') {
        if (strncmp($buf, '%PDF', 4) !== 0) throw new HttpError(400, 'الملف ليس PDF صالحًا');
    } elseif (function_exists('getimagesizefromstring') && @getimagesizefromstring($buf) === false) {
        throw new HttpError(400, 'الملف ليس صورة صالحة');
    }
    $base = preg_replace('/\.[^.]*$/', '', str($filename, 80));
    $base = strtolower(trim(preg_replace('/[^\w-]+/', '-', $base), '-')) ?: ($mime === 'application/pdf' ? 'file' : 'image');
    $name = time() . '-' . bin2hex(random_bytes(3)) . '-' . $base . '.' . EID_UPLOAD_TYPES[$mime];
    if (!is_dir(EID_UPLOAD_DIR)) @mkdir(EID_UPLOAD_DIR, 0755, true);
    if (@file_put_contents(EID_UPLOAD_DIR . '/' . $name, $buf) === false) throw new HttpError(500, 'تعذر حفظ الملف — تأكد من صلاحيات فولدر uploads');
    return '/uploads/' . $name;
}
route('POST', '/api/admin/upload', function ($ctx) {
    $b = $ctx['body'];
    if (!preg_match('#^data:(image/(?:png|jpeg|webp|gif)|application/pdf);base64,([A-Za-z0-9+/=\s]+)$#', (string)($b['data'] ?? ''), $m)) {
        throw new HttpError(400, 'الملف لازم يكون صورة PNG أو JPG أو WEBP أو GIF، أو ملف PDF');
    }
    $buf = base64_decode(preg_replace('/\s+/', '', $m[2]), true);
    if ($buf === false) throw new HttpError(400, 'بيانات الملف غير صالحة');
    return ['url' => save_upload($buf, $m[1], $b['filename'] ?? '')];
});
route('GET', '/api/admin/uploads', function () {
    if (!is_dir(EID_UPLOAD_DIR)) return [];
    $out = [];
    foreach (scandir(EID_UPLOAD_DIR) as $f) {
        if (preg_match('/\.(png|jpe?g|webp|gif)$/i', $f)) $out[] = ['url' => '/uploads/' . $f, 'mtime' => filemtime(EID_UPLOAD_DIR . '/' . $f)];
    }
    usort($out, function ($a, $b) { return $b['mtime'] - $a['mtime']; });
    return $out;
});

// Admin: accounts
route('GET', '/api/admin/admins', function () {
    return array_map(function ($r) { return ['id' => (int)$r['id'], 'username' => $r['username'], 'created_at' => $r['created_at']]; },
        q('SELECT id, username, created_at FROM admins ORDER BY id'));
});
route('POST', '/api/admin/admins', function ($ctx) {
    $username = trim(str($ctx['body']['username'] ?? '', 100));
    $password = str($ctx['body']['password'] ?? '', 200);
    validate_credentials($username, $password);
    if (q('SELECT id FROM admins WHERE username = ?', [$username])) throw new HttpError(409, 'اسم المستخدم موجود بالفعل');
    return create_admin($username, $password);
});
route('DELETE', '/api/admin/admins/:id', function ($ctx) {
    $id = intv($ctx['params']['id']);
    if ($id === $ctx['user']['id']) throw new HttpError(400, 'لا يمكنك حذف حسابك الحالي');
    must_find('admins', $id, 'الحساب');
    q('DELETE FROM admins WHERE id = ?', [$id]);
    return ['ok' => true];
});
route('PUT', '/api/admin/password', function ($ctx) {
    $row = q('SELECT * FROM admins WHERE id = ?', [$ctx['user']['id']])[0];
    if (!password_verify(str($ctx['body']['current'] ?? '', 200), $row['password_hash'])) throw new HttpError(400, 'كلمة المرور الحالية غير صحيحة');
    $pw = str($ctx['body']['password'] ?? '', 200);
    if (slen($pw) < 8) throw new HttpError(400, 'كلمة المرور الجديدة 8 أحرف على الأقل');
    q('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $ctx['user']['id']]);
    return ['ok' => true];
});

// ── dispatcher ──────────────────────────────────────────────────────────────
function send_json($status, $data)
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

function dispatch()
{
    global $routes;
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $pos = strpos($uri, '/api/');
    $path = $pos === false ? $uri : substr($uri, $pos);
    $path = rtrim($path, '/') ?: '/';
    try {
        $matches = array_filter($routes, function ($r) use ($path) { return preg_match($r['re'], $path); });
        if (!$matches) throw new HttpError(404, 'المسار غير موجود');
        $route = null;
        foreach ($matches as $r) if ($r['method'] === $method) { $route = $r; break; }
        if (!$route) throw new HttpError(405, 'Method not allowed');

        if (!eid_config()) {
            if ($path === '/api/auth/status') return send_json(200, ['needsInstall' => true, 'needsSetup' => false, 'user' => null]);
            if ($path !== '/api/install') throw new HttpError(503, 'الموقع لم يُجهَّز بعد');
        } elseif ($path === '/api/site' || $path === '/api/auth/status' || strpos($path, '/api/page/') === 0) {
            eid_ensure_schema(); // creates tables on first run if config.php was written by hand
        }

        preg_match($route['re'], $path, $m);
        $params = [];
        foreach ($route['keys'] as $i => $k) $params[$k] = $m[$i + 1];
        $user = ($path !== '/api/install' && eid_config()) ? verify_token(request_token()) : null;
        if ($route['auth'] && !$user) throw new HttpError(401, 'يجب تسجيل الدخول');

        $body = [];
        if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            $raw = file_get_contents('php://input');
            $limit = $path === '/api/admin/upload' ? 8 * 1024 * 1024 : 1024 * 1024;
            if (strlen($raw) > $limit) throw new HttpError(413, 'حجم الطلب كبير جدًا');
            if ($raw !== '' && $raw !== false) {
                $body = json_decode($raw, true);
                if (!is_array($body)) throw new HttpError(400, 'JSON غير صالح');
            }
        }
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        send_json(200, ($route['handler'])(['params' => $params, 'body' => $body, 'user' => $user, 'ip' => $ip]));
    } catch (HttpError $e) {
        send_json($e->status, ['error' => $e->getMessage()]);
    } catch (PDOException $e) {
        error_log('[eid] DB error: ' . $e->getMessage());
        send_json(500, ['error' => 'خطأ في قاعدة البيانات']);
    } catch (Throwable $e) {
        error_log('[eid] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        send_json(500, ['error' => 'خطأ في السيرفر']);
    }
}

dispatch();
