<?php
session_start();
header('Content-Type: application/json');

// Veritabanı bağlantısı
$host = 'localhost';
$dbname = 'hwid_login_db1';
$username = 'juve';
$password = 'juve123';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(['success' => false, 'message' => 'Veritabanı bağlantı hatası']));
}

// Admin kontrolü
function checkAdmin() {
    if (!isset($_SESSION['admin_id'])) {
        http_response_code(401);
        die(json_encode(['success' => false, 'message' => 'Yetkisiz erişim']));
    }
}

// Request method ve action kontrolü
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Admin gerektiren işlemler
$adminActions = ['create', 'update', 'delete', 'list', 'stats'];
if (in_array($action, $adminActions)) {
    checkAdmin();
}

switch ($action) {
    case 'create':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        createKey();
        break;
        
    case 'list':
        if ($method !== 'GET') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        listKeys();
        break;
        
    case 'update':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        updateKey();
        break;
        
    case 'delete':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        deleteKey();
        break;
        
    case 'validate':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        validateKey();
        break;
        
    case 'stats':
        if ($method !== 'GET') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        getStats();
        break;
        
    case 'toggle_status':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        toggleKeyStatus();
        break;
        
    case 'reset_hwid':
        if ($method !== 'POST') {
            http_response_code(405);
            die(json_encode(['success' => false, 'message' => 'Method not allowed']));
        }
        resetHWID();
        break;
        
    default:
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Invalid action']));
}

// Lisans anahtarı oluştur
function createKey() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $duration = $data['duration'] ?? 30;
    
    // Benzersiz anahtar oluştur
    $key = generateUniqueKey();
    
    // Remaining time hesapla (gün * 24 * 60 = dakika)
    $remainingTime = $duration * 24 * 60;
    if ($duration == 0) {
        $remainingTime = 999999; // Süresiz için çok büyük değer
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO sn (`key`, hwid, remaining_time) 
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([$key, '', $remainingTime]);
        
        // Log kaydı ekle
        logActivity('system', "Yeni lisans oluşturuldu: $key");
        
        echo json_encode([
            'success' => true,
            'key' => $key,
            'message' => 'Lisans anahtarı oluşturuldu'
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Anahtar oluşturulamadı']);
    }
}

// Lisans anahtarlarını listele
function listKeys() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT id, `key` as license_key, hwid, remaining_time,
                   CASE 
                       WHEN remaining_time <= 0 THEN 'expired'
                       ELSE 'valid'
                   END as status,
                   CASE 
                       WHEN remaining_time > 10000 THEN NULL
                       ELSE NOW() + INTERVAL remaining_time MINUTE
                   END as expires_at,
                   NOW() as created_at,
                   1 as is_active,
                   1 as used_count,
                   1 as max_uses,
                   '' as notes
            FROM sn 
            ORDER BY id DESC
        ");
        
        $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'keys' => $keys
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Anahtarlar listelenemedi']);
    }
}

// Lisans anahtarını güncelle
function updateKey() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    $isActive = $data['is_active'] ?? null;
    $maxUses = $data['max_uses'] ?? null;
    $notes = $data['notes'] ?? null;
    $expiresAt = $data['expires_at'] ?? null;
    
    if (!$id) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Geçersiz ID']));
    }
    
    $updates = [];
    $params = [];
    
    if ($isActive !== null) {
        $updates[] = "is_active = ?";
        $params[] = $isActive ? 1 : 0;
    }
    
    if ($maxUses !== null) {
        $updates[] = "max_uses = ?";
        $params[] = $maxUses;
    }
    
    if ($notes !== null) {
        $updates[] = "notes = ?";
        $params[] = $notes;
    }
    
    if ($expiresAt !== null) {
        $updates[] = "expires_at = ?";
        $params[] = $expiresAt;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Güncellenecek alan yok']));
    }
    
    $params[] = $id;
    
    try {
        $sql = "UPDATE license_keys SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        echo json_encode([
            'success' => true,
            'message' => 'Lisans anahtarı güncellendi'
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Anahtar güncellenemedi']);
    }
}

// Lisans anahtarını sil
function deleteKey() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Geçersiz ID']));
    }
    
    try {
        // Silinen anahtarın kaydını tut
        $stmt = $pdo->prepare("SELECT `key` FROM sn WHERE id = ?");
        $stmt->execute([$id]);
        $keyInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("DELETE FROM sn WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            if ($keyInfo) {
                logActivity('system', "Lisans silindi: " . $keyInfo['key']);
            }
            echo json_encode([
                'success' => true,
                'message' => 'Lisans anahtarı silindi'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Anahtar bulunamadı']);
        }
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Anahtar silinemedi']);
    }
}

// Lisans anahtarını doğrula (Client tarafından kullanılır)
function validateKey() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data['key'] ?? '';
    $hwid = $data['hwid'] ?? '';
    
    if (!$key || !$hwid) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Eksik parametreler']));
    }
    
    try {
        // Anahtarı kontrol et
        $stmt = $pdo->prepare("
            SELECT * FROM sn 
            WHERE `key` = ?
        ");
        $stmt->execute([$key]);
        $license = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$license) {
            logActivity($hwid, "Geçersiz lisans anahtarı: $key");
            echo json_encode(['success' => false, 'message' => 'Geçersiz lisans anahtarı']);
            return;
        }
        
        // Süre kontrolü (remaining_time <= 0)
        if ($license['remaining_time'] <= 0) {
            logActivity($hwid, "Süresi dolmuş lisans: $key");
            echo json_encode(['success' => false, 'message' => 'Lisans süresi dolmuş']);
            return;
        }
        
        // HWID kontrolü
        if ($license['hwid'] && $license['hwid'] !== '') {
            if ($license['hwid'] !== $hwid) {
                logActivity($hwid, "Farklı HWID ile erişim denemesi: $key");
                echo json_encode(['success' => false, 'message' => 'Bu lisans başka bir cihaza kayıtlı']);
                return;
            }
        } else {
            // İlk kullanım, HWID'yi kaydet
            $stmt = $pdo->prepare("
                UPDATE sn 
                SET hwid = ? 
                WHERE id = ?
            ");
            $stmt->execute([$hwid, $license['id']]);
            logActivity($hwid, "HWID kaydedildi: $key");
        }
        
        // Başarılı doğrulama
        logActivity($hwid, "Başarılı doğrulama: $key");
        echo json_encode([
            'success' => true,
            'message' => 'Lisans doğrulandı',
            'remaining_time' => $license['remaining_time']
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Doğrulama hatası']);
    }
}

// Log aktivite fonksiyonu
function logActivity($kullaniciadi, $log) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO kontrol (kullaniciadi, log, tarih_saat) 
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$kullaniciadi, $log]);
    } catch(PDOException $e) {
        // Log hatası sessizce geç
    }
}

// İstatistikleri getir
function getStats() {
    global $pdo;
    
    try {
        $stats = [];
        
        // Toplam anahtar sayısı
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM sn");
        $stats['total_keys'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Aktif anahtar sayısı (süre > 0 olan)
        $stmt = $pdo->query("SELECT COUNT(*) as active FROM sn WHERE remaining_time > 0");
        $stats['active_keys'] = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
        
        // Kullanılmış anahtar sayısı
        $stmt = $pdo->query("SELECT COUNT(*) as used FROM sn WHERE hwid IS NOT NULL");
        $stats['used_keys'] = $stmt->fetch(PDO::FETCH_ASSOC)['used'];
        
        // Süresi dolmuş anahtar sayısı
        $stmt = $pdo->query("SELECT COUNT(*) as expired FROM sn WHERE remaining_time <= 0");
        $stats['expired_keys'] = $stmt->fetch(PDO::FETCH_ASSOC)['expired'];
        
        // Son 7 günlük kullanım (kontrol tablosundan)
        $stmt = $pdo->query("
            SELECT DATE(tarih_saat) as date, COUNT(*) as count 
            FROM kontrol 
            WHERE tarih_saat >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND log LIKE '%Başarılı doğrulama%'
            GROUP BY DATE(tarih_saat)
            ORDER BY date ASC
        ");
        $stats['daily_usage'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'İstatistikler alınamadı']);
    }
}

// Benzersiz anahtar oluştur
function generateUniqueKey() {
    global $pdo;
    
    do {
        $key = generateKey();
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM sn WHERE `key` = ?");
        $stmt->execute([$key]);
        $exists = $stmt->fetchColumn() > 0;
    } while ($exists);
    
    return $key;
}

// Rastgele anahtar oluştur
function generateKey() {
    $segments = [];
    for ($i = 0; $i < 4; $i++) {
        $segments[] = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4));
    }
    return implode('-', $segments);
}

// Lisans durumunu değiştir
function toggleKeyStatus() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Geçersiz ID']));
    }
    
    try {
        // Mevcut durumu al
        $stmt = $pdo->prepare("SELECT is_active, `key` FROM sn WHERE id = ?");
        $stmt->execute([$id]);
        $current = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$current) {
            http_response_code(404);
            die(json_encode(['success' => false, 'message' => 'Anahtar bulunamadı']));
        }
        
        // Durumu tersine çevir
        $newStatus = $current['is_active'] ? 0 : 1;
        $stmt = $pdo->prepare("UPDATE sn SET is_active = ? WHERE id = ?");
        $stmt->execute([$newStatus, $id]);
        
        $statusText = $newStatus ? 'aktif' : 'pasif';
        logActivity('system', "Lisans durumu $statusText yapıldı: " . $current['key']);
        
        echo json_encode([
            'success' => true,
            'message' => 'Lisans durumu güncellendi'
        ]);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Durum güncellenemedi']);
    }
}

// HWID sıfırla
function resetHWID() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        http_response_code(400);
        die(json_encode(['success' => false, 'message' => 'Geçersiz ID']));
    }
    
    try {
        // Anahtar bilgisini al
        $stmt = $pdo->prepare("SELECT `key` FROM sn WHERE id = ?");
        $stmt->execute([$id]);
        $keyInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("UPDATE sn SET hwid = NULL WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            if ($keyInfo) {
                logActivity('system', "HWID sıfırlandı: " . $keyInfo['key']);
            }
            echo json_encode([
                'success' => true,
                'message' => 'HWID sıfırlandı'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Anahtar bulunamadı']);
        }
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'HWID sıfırlanamadı']);
    }
}
?>
