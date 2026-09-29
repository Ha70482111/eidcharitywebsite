<?php
// Passwords, signed login tokens and brute-force protection.

const EID_TOKEN_TTL = 43200; // 12 hours

function b64url($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64url_decode($s) { return base64_decode(strtr($s, '-_', '+/')); }

function app_secret()
{
    static $secret = null;
    if ($secret !== null) return $secret;
    $cfg = eid_config();
    if (!empty($cfg['app_secret'])) return $secret = $cfg['app_secret'];
    $s = get_setting('_secret', null);
    if (!$s) {
        $s = bin2hex(random_bytes(32));
        set_setting('_secret', $s);
    }
    return $secret = $s;
}

function sign_token(array $user)
{
    $payload = b64url(json_encode(['uid' => (int)$user['id'], 'u' => $user['username'], 'exp' => time() + EID_TOKEN_TTL]));
    return $payload . '.' . b64url(hash_hmac('sha256', $payload, app_secret(), true));
}

function verify_token($token)
{
    if (!$token || strpos($token, '.') === false) return null;
    list($payload, $sig) = explode('.', $token, 2);
    $expected = b64url(hash_hmac('sha256', $payload, app_secret(), true));
    if (!hash_equals($expected, $sig)) return null;
    $data = json_decode(b64url_decode($payload), true);
    if (!$data || empty($data['exp']) || $data['exp'] < time()) return null;
    $rows = q('SELECT id, username FROM admins WHERE id = ?', [(int)$data['uid']]);
    if (!$rows) return null;
    return ['id' => (int)$rows[0]['id'], 'username' => $rows[0]['username']];
}

function request_token()
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!$h && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strtolower($k) === 'authorization') $h = $v;
    }
    if ($h && preg_match('/^Bearer\s+(.+)$/i', $h, $m)) return trim($m[1]);
    // Some shared hosts strip the Authorization header, so the client also sends this one.
    return $_SERVER['HTTP_X_AUTH_TOKEN'] ?? '';
}

function too_many_attempts($ip)
{
    q('DELETE FROM login_attempts WHERE attempted_at < ?', [time() - 900]);
    $n = (int)q('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ?', [$ip])[0]['n'];
    return $n >= 10;
}
function record_failure($ip) { q('INSERT INTO login_attempts (ip, attempted_at) VALUES (?, ?)', [$ip, time()]); }
function clear_failures($ip) { q('DELETE FROM login_attempts WHERE ip = ?', [$ip]); }
