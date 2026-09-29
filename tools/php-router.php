<?php
// Local development router for PHP's built-in server (mimics the .htaccess rules):
//   php -S localhost:8000 -t public tools/php-router.php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$root = $_SERVER['DOCUMENT_ROOT'];

if (strpos($path, '/api/') === 0) {
    require $root . '/api/index.php';
    return true;
}
$file = realpath($root . $path);
if ($path !== '/' && $file && strpos($file, realpath($root)) === 0 && is_file($file)) {
    if (preg_match('#^/(api|uploads)/.*\.(php|json)$#', $path)) { http_response_code(403); return true; }
    return false; // let the built-in server send the file
}
header('Content-Type: text/html; charset=utf-8');
readfile($root . '/index.html');
return true;
