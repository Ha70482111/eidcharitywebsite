<?php
// Roles in /admin: a manager can do everything; an editor edits only the content that the menu items
// assigned to them (and the items under them) link to.

function is_manager($user) { return ($user['role'] ?? 'manager') !== 'editor'; }

/** Where a menu link leads in /admin: ['page' => id] for a sub-page, ['sections' => [ids]] for home-page sections, or null. */
function menu_link_target($url, array $home)
{
    $url = trim((string)$url);
    if (preg_match('#^/page/([A-Za-z0-9-]+)#', $url, $m)) {
        $rows = q('SELECT id FROM pages WHERE slug = ?', [strtolower($m[1])]);
        return $rows ? ['page' => (int)$rows[0]['id']] : null;
    }
    $path = preg_replace('/[?#].*$/', '', $url);
    $hash = preg_match('/#([\w-]+)$/', $url, $m) ? $m[1] : '';
    $ids = [];
    foreach ($home as $s) {
        $c = jparse($s['content']);
        if (($hash !== '' && in_array($path, ['', '/'], true) && ($c['anchor'] ?? '') === $hash)
            || ($url === '/gift' && $s['type'] === 'gift') || ($url === '/donate' && $s['type'] === 'campaigns')) $ids[] = (int)$s['id'];
    }
    return $ids ? ['sections' => $ids] : null;
}

/** Menu rows with the content each one gives access to (shown when the manager picks an editor's menu items). */
function access_menu()
{
    $home = q('SELECT id, type, name, content FROM sections WHERE page_id IS NULL');
    $names = [];
    foreach ($home as $s) $names[(int)$s['id']] = $s['name'];
    $out = [];
    foreach (q('SELECT * FROM menu_items ORDER BY sort_order, id') as $r) {
        $row = menu_row($r);
        unset($row['extra']);
        $t = menu_link_target($r['url'], $home);
        if (isset($t['page'])) $row['target'] = 'صفحة «' . (q('SELECT title_ar FROM pages WHERE id = ?', [$t['page']])[0]['title_ar'] ?? '') . '»';
        elseif ($t) $row['target'] = 'الرئيسية: ' . implode('، ', array_map(function ($id) use ($names) { return '«' . $names[$id] . '»'; }, $t['sections']));
        else $row['target'] = null;
        $out[] = $row;
    }
    return $out;
}

/** What an editor may edit: whole sub-pages (with their sections) and single home-page sections. */
function editor_scope(array $user)
{
    static $cache = [];
    if (isset($cache[$user['id']])) return $cache[$user['id']];
    $rows = q('SELECT id, parent_id, url, extra FROM menu_items');
    $kids = [];
    foreach ($rows as $r) $kids[(int)($r['parent_id'] ?? 0)][] = $r;
    $byId = [];
    foreach ($rows as $r) $byId[(int)$r['id']] = $r;
    // the assigned items and everything under them
    $todo = array_values(array_filter($user['menu'] ?? [], function ($id) use ($byId) { return isset($byId[$id]); }));
    $seen = [];
    while ($todo) {
        $id = array_pop($todo);
        if (isset($seen[$id])) continue;
        $seen[$id] = true;
        foreach ($kids[$id] ?? [] as $k) $todo[] = (int)$k['id'];
    }
    $home = q('SELECT id, type, content FROM sections WHERE page_id IS NULL');
    $pages = [];
    $sections = [];
    foreach (array_keys($seen) as $id) {
        $urls = [$byId[$id]['url']];
        $featured = jparse($byId[$id]['extra'])['featured']['url'] ?? ''; // the mega menu's featured card
        if ($featured !== '') $urls[] = $featured;
        foreach ($urls as $u) {
            $t = menu_link_target($u, $home);
            if (isset($t['page'])) $pages[$t['page']] = true;
            elseif ($t) foreach ($t['sections'] as $s) $sections[$s] = true;
        }
    }
    return $cache[$user['id']] = ['pages' => array_keys($pages), 'sections' => array_keys($sections)];
}

/** The user as /admin sees it: an editor also gets the pages and home-page sections they may edit. */
function public_user($user)
{
    if (!$user) return null;
    $out = ['id' => $user['id'], 'username' => $user['username'], 'role' => $user['role'] ?? 'manager'];
    if (!is_manager($user)) $out['scope'] = editor_scope($user);
    return $out;
}

/** May the editor open this section? $whole: only if the whole page is theirs (add, delete, duplicate, reorder). */
function section_allowed(array $scope, $sectionId, $whole = false)
{
    $rows = q('SELECT page_id FROM sections WHERE id = ?', [$sectionId]);
    if (!$rows) return true; // the route answers 404
    if ($rows[0]['page_id'] !== null) return in_array((int)$rows[0]['page_id'], $scope['pages'], true);
    return !$whole && in_array((int)$sectionId, $scope['sections'], true);
}

/** Runs before every /api/admin route; managers pass, editors only reach their own content. */
function authorize(array $user, $method, $pattern, array $params, array $body)
{
    if (is_manager($user)) return;
    $scope = editor_scope($user);
    $id = isset($params['id']) ? (int)$params['id'] : 0;
    $ok = false;
    switch ("$method $pattern") {
        case 'PUT /api/admin/password':
        case 'POST /api/admin/upload':
        case 'GET /api/admin/uploads':
        case 'GET /api/admin/pages': // filtered by the route
            $ok = true;
            break;
        case 'GET /api/admin/sections': // without ?page the route lists only their home-page sections
            $ok = !isset($_GET['page']) || $_GET['page'] === '' || in_array(intv($_GET['page']), $scope['pages'], true);
            break;
        case 'GET /api/admin/pages/:id':
            $ok = in_array($id, $scope['pages'], true);
            break;
        case 'PUT /api/admin/pages/:id': // the link (slug) ties the page to the menu, so only a manager changes it
            $ok = in_array($id, $scope['pages'], true)
                && (!has($body, 'slug') || strtolower(trim((string)$body['slug'])) === (q('SELECT slug FROM pages WHERE id = ?', [$id])[0]['slug'] ?? ''));
            break;
        case 'POST /api/admin/sections':
            $ok = isset($body['page_id']) && $body['page_id'] !== '' && in_array(intv($body['page_id']), $scope['pages'], true);
            break;
        case 'GET /api/admin/sections/:id':
        case 'PUT /api/admin/sections/:id':
        case 'POST /api/admin/sections/:id/items':
        case 'POST /api/admin/sections/:id/items/reorder':
            $ok = section_allowed($scope, $id);
            break;
        case 'DELETE /api/admin/sections/:id':
        case 'POST /api/admin/sections/:id/duplicate':
            $ok = section_allowed($scope, $id, true);
            break;
        case 'POST /api/admin/sections/reorder':
            $ok = true;
            foreach (idsv($body['ids'] ?? null) as $sid) $ok = $ok && section_allowed($scope, $sid, true);
            break;
        case 'PUT /api/admin/items/:id':
        case 'DELETE /api/admin/items/:id':
            $rows = q('SELECT section_id FROM section_items WHERE id = ?', [$id]);
            $ok = !$rows || section_allowed($scope, (int)$rows[0]['section_id']);
            break;
    }
    if (!$ok) throw new HttpError(403, 'ليس لديك صلاحية على هذا الجزء. اطلب من مدير الموقع إضافته لصلاحياتك.');
}
