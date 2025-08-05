<?php
session_start();

// Veritabanı ayarları
define('DB_HOST', 'localhost');
define('DB_NAME', 'hwid_login_db1');
define('DB_USER', 'juve');
define('DB_PASS', 'juve123');

// Bağlantı
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['error' => 'Veritabanı bağlantı hatası']));
}

// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, PUT');
header('Access-Control-Allow-Headers: Content-Type');

// Auth kontrolü
function requireAuth() {
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        die(json_encode(['error' => 'Yetkisiz erişim']));
    }
}
?>
