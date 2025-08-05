<?php
require_once 'config.php';

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

switch($action) {
    case 'login':
        login($input);
        break;
    
    case 'logout':
        logout();
        break;
    
    case 'check':
        checkAuth();
        break;
    
    default:
        echo json_encode(['error' => 'Geçersiz işlem']);
}

function login($data) {
    global $pdo;
    
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Kullanıcı adı ve şifre gerekli']);
        return;
    }
    
    // Gerçek sistemde hash kullanın
    // $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
    // $stmt->execute([$username]);
    // $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Demo için basit kontrol
    if ($username === 'admin' && $password === 'admin123') {
        $_SESSION['admin_id'] = 1;
        $_SESSION['admin_username'] = $username;
        echo json_encode(['success' => true, 'message' => 'Giriş başarılı']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Geçersiz kullanıcı adı veya şifre']);
    }
}

function logout() {
    session_destroy();
    echo json_encode(['success' => true]);
}

function checkAuth() {
    if (isset($_SESSION['admin_id'])) {
        echo json_encode(['authenticated' => true, 'username' => $_SESSION['admin_username']]);
    } else {
        echo json_encode(['authenticated' => false]);
    }
}
?>