# 🔐 KeyAuth HWID Lisans Yönetim Sistemi

PHP, MySQL ve vanilla JavaScript ile geliştirilmiş modern, güvenli ve kullanıcı dostu donanım ID (HWID) tabanlı lisans yönetim sistemi.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.0%2B-blue.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7%2B-orange.svg)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow.svg)

## 🌟 Özellikler

### 🎯 Temel Özellikler
- **HWID Tabanlı Lisans Yönetimi** - Lisansları belirli donanım konfigürasyonlarına bağlama
- **Zamana Dayalı Lisans Kontrolü** - Otomatik geri sayım ile son kullanma tarihleri belirleme
- **Modern Admin Paneli** - Temiz, responsive web arayüzü
- **REST API** - Lisans doğrulama ve yönetim için eksiksiz API
- **Gerçek Zamanlı İstatistikler** - Lisans kullanımı ve analitik takibi
- **Aktivite Loglama** - Tüm lisans işlemlerini ve doğrulamalarını kaydetme

### 🛡️ Güvenlik Özellikleri
- **Donanım ID Bağlama** - Cihazlar arası lisans paylaşımını engelleme
- **Oturum Yönetimi** - Güvenli admin kimlik doğrulaması
- **SQL Injection Koruması** - Her yerde prepared statement kullanımı
- **CORS Desteği** - Yapılandırılabilir cross-origin istekleri

### ⚡ Gelişmiş Özellikler
- **Otomatik Süre Dolumu** - MySQL eventleri ile otomatik süre azaltma
- **Toplu İşlemler** - Çoklu lisans oluşturma, yönetme ve silme
- **Arama ve Filtreleme** - Gelişmiş filtrelerle hızlı lisans bulma
- **Dışa Aktarma** - Lisans verilerini CSV formatında dışa aktarma
- **Responsive Tasarım** - Masaüstü, tablet ve mobilde çalışma

## 📷 Ekran Görüntüleri

*Yayınlarken ekran görüntülerinizi buraya ekleyin*

```
[Giriş Ekranı] [Dashboard] [Lisans Yönetimi] [Lisans Oluşturma]
```

## 🚀 Hızlı Başlangıç

### Gereksinimler
- **XAMPP/WAMP/LAMP** - Yerel sunucu ortamı
- **PHP 8.0+** - Sunucu tarafı script dili
- **MySQL 5.7+** - Veritabanı yönetimi
- **Modern Web Tarayıcısı** - Chrome, Firefox, Safari, Edge

### Kurulum

1. **Repository'yi klonlayın**
   ```bash
   git clone https://github.com/kullaniciadi/keyauth-system.git
   cd keyauth-system
   ```

2. **Veritabanını Kurun**
   ```bash
   # Veritabanı yapısını içe aktarın
   mysql -u root -p < setup.sql
   
   # Veya önceden doldurulmuş veritabanını kullanın
   mysql -u root -p < hwid_login_db1.sql
   ```

3. **Veritabanı Bağlantısını Yapılandırın**
   ```php
   # api/config.php dosyasını düzenleyin
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'hwid_login_db1');
   define('DB_USER', 'kullanici_adiniz');
   define('DB_PASS', 'sifreniz');
   ```

4. **MySQL Events Ayarlayın (İsteğe Bağlı)**
   ```sql
   # Otomatik lisans süre azaltmayı etkinleştirin
   SET GLOBAL event_scheduler = ON;
   ```

5. **Sisteme Erişin**
   ```
   URL: http://localhost/keyauth-system
   Kullanıcı Adı: admin
   Şifre: admin123
   ```

## 📊 Veritabanı Yapısı

### Ana Tablolar

#### `sn` - Lisans Anahtarları
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | INT | Birincil anahtar |
| `key` | VARCHAR(255) | Benzersiz lisans anahtarı |
| `hwid` | VARCHAR(255) | Donanım ID bağlantısı |
| `remaining_time` | INT | Dakika cinsinden kalan süre |

#### `kontrol` - Aktivite Logları
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | INT | Birincil anahtar |
| `kullaniciadi` | VARCHAR(255) | Kullanıcı adı/HWID |
| `log` | TEXT | Aktivite açıklaması |
| `tarih_saat` | DATETIME | Zaman damgası |

### MySQL Events
```sql
# Her 60 dakikada otomatik süre azaltma
CREATE EVENT decrease_remaining_time_every_hour
ON SCHEDULE EVERY 60 MINUTE
DO UPDATE sn SET remaining_time = remaining_time - 1
WHERE remaining_time > 0 AND hwid != '';
```

## 🔌 API Dokümantasyonu

### Kimlik Doğrulama
Tüm admin endpoint'leri oturum kimlik doğrulaması gerektirir.

### Endpoint'ler

#### Lisans Yönetimi

##### Lisans Oluştur
```http
POST /api/keys.php?action=create
Content-Type: application/json

{
    "duration": 30,     // Gün (0 = sınırsız)
    "notes": "İsteğe bağlı açıklama"
}

Yanıt:
{
    "success": true,
    "key": "AB12-CD34-EF56-GH78",
    "message": "Lisans başarıyla oluşturuldu"
}
```

##### Lisansları Listele
```http
GET /api/keys.php?action=list

Yanıt:
{
    "success": true,
    "keys": [
        {
            "id": 1,
            "license_key": "AB12-CD34-EF56-GH78",
            "hwid": "HWID-12345",
            "remaining_time": 43200,
            "status": "valid"
        }
    ]
}
```

##### Lisans Doğrula (İstemci)
```http
POST /api/keys.php?action=validate
Content-Type: application/json

{
    "key": "AB12-CD34-EF56-GH78",
    "hwid": "BENZERSIZ-DONANIM-ID"
}

Yanıt:
{
    "success": true,
    "message": "Lisans doğrulandı",
    "remaining_time": 43200
}
```

##### Lisans Sil
```http
POST /api/keys.php?action=delete
Content-Type: application/json

{
    "id": 1
}

Yanıt:
{
    "success": true,
    "message": "Lisans silindi"
}
```

##### HWID Sıfırla
```http
POST /api/keys.php?action=reset_hwid
Content-Type: application/json

{
    "id": 1
}

Yanıt:
{
    "success": true,
    "message": "HWID başarıyla sıfırlandı"
}
```

#### İstatistikler
```http
GET /api/keys.php?action=stats

Yanıt:
{
    "success": true,
    "stats": {
        "total_keys": 10,
        "active_keys": 8,
        "used_keys": 5,
        "expired_keys": 2
    }
}
```

#### Kimlik Doğrulama
```http
POST /api/auth.php?action=login
Content-Type: application/json

{
    "username": "admin",
    "password": "admin123"
}

Yanıt:
{
    "success": true,
    "message": "Giriş başarılı"
}
```

## 🛠️ Geliştirme

### Dosya Yapısı
```
keyauth-system/
├── 📁 api/                 # Backend API
│   ├── auth.php           # Kimlik doğrulama endpoint'leri
│   ├── config.php         # Veritabanı yapılandırması
│   └── keys.php           # Lisans yönetimi API'si
├── 📁 css/                # Stil dosyaları
│   ├── dashboard.css      # Admin panel stilleri
│   └── login.css          # Giriş sayfası stilleri
├── 📁 js/                 # JavaScript dosyaları
│   ├── auth.js           # Kimlik doğrulama mantığı
│   └── dashboard.js      # Dashboard fonksiyonalitesi
├── dashboard.html        # Admin paneli
├── index.html           # Giriş sayfası
├── setup.sql            # Veritabanı yapısı
├── hwid_login_db1.sql   # Örnek veritabanı
└── README.md           # Bu dosya
```

### Ana Bileşenler

#### Frontend (Vanilla JavaScript)
- **Responsive Tasarım** - CSS Grid & Flexbox
- **Modern UI/UX** - Temiz, sezgisel arayüz
- **Gerçek Zamanlı Güncellemeler** - Her 30 saniyede otomatik yenileme
- **Mobil Uyumlu** - Tüm cihazlar için optimize edilmiş

#### Backend (PHP)
- **RESTful API** - Temiz, tutarlı endpoint'ler
- **PDO Veritabanı** - Güvenlik için prepared statement'lar
- **Oturum Yönetimi** - Güvenli kimlik doğrulaması
- **Hata Yönetimi** - Kapsamlı hata yanıtları

#### Veritabanı (MySQL)
- **Optimize Edilmiş Şema** - Verimli tablo yapısı
- **Otomatik Görevler** - Bakım için MySQL eventleri
- **İndeksleme** - Hızlı sorgu performansı
- **Loglama** - Eksiksiz denetim izi

## 🔧 Yapılandırma

### Ortam Kurulumu
```php
// api/config.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'hwid_login_db1');
define('DB_USER', 'kullanici_adiniz');
define('DB_PASS', 'sifreniz');
```

### Admin Kimlik Bilgileri
Varsayılan giriş bilgileri (production'da değiştirin):
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

### MySQL Events
Otomatik lisans süre dolumunu etkinleştirin:
```sql
SET GLOBAL event_scheduler = ON;
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

#### Veritabanı Bağlantı Hatası
```bash
# MySQL servisini kontrol edin
sudo systemctl status mysql

# api/config.php'deki kimlik bilgilerini doğrulayın
# Veritabanının var olduğundan emin olun
```

#### Oturum Sorunları
```bash
# PHP oturum yapılandırmasını kontrol edin
# Oturum dizininde yazma izinlerini doğrulayın
```

#### MySQL Events Çalışmıyor
```sql
-- Eventlerin etkin olup olmadığını kontrol edin
SHOW VARIABLES LIKE 'event_scheduler';

-- Eventleri etkinleştirin
SET GLOBAL event_scheduler = ON;

-- Eventlerin var olduğunu doğrulayın
SHOW EVENTS;
```

## 🔒 Güvenlik Konuları

### Production Dağıtımı
1. **Varsayılan admin kimlik bilgilerini değiştirin**
2. **Güçlü veritabanı şifreleri kullanın**
3. **HTTPS/SSL etkinleştirin**
4. **Uygun dosya izinlerini yapılandırın**
5. **Düzenli güvenlik güncellemeleri**
6. **Veritabanı yedekleme stratejisi**

### Önerilen Güvenlik Başlıkları
```php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
```

## 🤝 Katkıda Bulunma

1. Repository'yi fork edin
2. Özellik branch'i oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'Harika özellik ekle'`)
4. Branch'e push edin (`git push origin feature/harika-ozellik`)
5. Pull Request açın

### Geliştirme Yönergeleri
- PHP için PSR-12 kodlama standartlarını takip edin
- Anlamlı commit mesajları kullanın
- Karmaşık mantık için yorum ekleyin
- Göndermeden önce iyice test edin

## 📋 Yapılacaklar / Yol Haritası

- [ ] 2FA Kimlik Doğrulama
- [ ] API Oran Sınırlama
- [ ] Lisans Şablonları
- [ ] Toplu İçe/Dışa Aktarma
- [ ] E-posta Bildirimleri
- [ ] Gelişmiş Analitik
- [ ] Docker Desteği
- [ ] CLI Araçları

## 📄 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🙏 Teşekkürler

- Modern web teknolojileri ile geliştirilmiştir
- Profesyonel lisans yönetim sistemlerinden ilham alınmıştır
- Topluluk geri bildirimleri ve katkıları

## 📞 Destek

Herhangi bir sorunla karşılaşırsanız veya sorularınız varsa:

1. [Issues](../../issues) sayfasını kontrol edin
2. Gerekirse yeni bir issue oluşturun
3. Sorununuz hakkında detaylı bilgi sağlayın

---

**⭐ Bu repository size yardımcı olduysa yıldızlamayı unutmayın!**

Geliştirici topluluğu için ❤️ ile yapılmıştır
