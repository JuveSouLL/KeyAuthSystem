// API endpoints
const API_BASE = 'api/';
const AUTH_API = API_BASE + 'auth.php';
const KEYS_API = API_BASE + 'keys.php';

// Global state
let currentPage = 'dashboard';
let allKeys = [];

// DOM elements
const pageContent = document.getElementById('pageContent');
const pageTitle = document.getElementById('pageTitle');
const username = document.getElementById('username');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initializeNavigation();
    loadPage('dashboard');
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${AUTH_API}?action=check`);
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'index.html';
        } else {
            username.textContent = data.username;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
    }
}

// Initialize navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Load page
            const page = item.dataset.page;
            loadPage(page);
        });
    });
}

// Load page content
function loadPage(page) {
    currentPage = page;
    
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'licenses':
            loadLicenses();
            break;
        case 'create':
            loadCreateLicense();
            break;
        case 'validate':
            loadValidate();
            break;
        case 'logs':
            loadLogs();
            break;
        default:
            loadDashboard();
    }
}

// Dashboard page
async function loadDashboard() {
    pageTitle.textContent = 'Dashboard';
    
    // Show loading
    pageContent.innerHTML = `
        <div class="stats-grid">
            ${[1,2,3,4].map(() => `
                <div class="stat-card skeleton" style="height: 150px;"></div>
            `).join('')}
        </div>
    `;
    
    // Load keys data
    await loadKeysData();
    
    // Calculate stats
    const now = new Date();
    const stats = {
        total: allKeys.length,
        active: allKeys.filter(k => k.is_active).length,
        used: allKeys.filter(k => k.hwid !== null).length,
        expired: allKeys.filter(k => k.expires_at && new Date(k.expires_at) < now).length
    };
    
    // Render dashboard
    pageContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🔑</div>
                <div class="stat-value">${stats.total}</div>
                <div class="stat-label">Toplam Lisans</div>
                <div class="stat-change">+12%</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">${stats.active}</div>
                <div class="stat-label">Aktif Lisans</div>
                <div class="stat-change">+5%</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">${stats.used}</div>
                <div class="stat-label">Kullanılmış</div>
                <div class="stat-change negative">-3%</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏰</div>
                <div class="stat-value">${stats.expired}</div>
                <div class="stat-label">Süresi Dolmuş</div>
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h2 class="card-title">Son Eklenen Lisanslar</h2>
                <button class="btn btn-sm" onclick="loadPage('licenses')">Tümünü Gör</button>
            </div>
            <div class="table-container">
                ${renderRecentKeysTable()}
            </div>
        </div>
        
        <div class="content-card">
            <div class="card-header">
                <h2 class="card-title">Hızlı İşlemler</h2>
            </div>
            <div class="quick-actions">
                <button class="btn btn-success" onclick="loadPage('create')">
                    <span>➕</span> Yeni Lisans Oluştur
                </button>
                <button class="btn btn-warning" onclick="loadPage('validate')">
                    <span>✓</span> Lisans Doğrula
                </button>
                <button class="btn btn-secondary" onclick="exportKeys()">
                    <span>📥</span> Dışa Aktar
                </button>
            </div>
        </div>
    `;
}

// Licenses page
async function loadLicenses() {
    pageTitle.textContent = 'Lisans Yönetimi';
    
    // Show loading
    pageContent.innerHTML = `
        <div class="content-card">
            <div class="loading"></div>
        </div>
    `;
    
    // Load keys data
    await loadKeysData();
    
    // Render licenses page
    pageContent.innerHTML = `
        <div class="content-card">
            <div class="card-header">
                <h2 class="card-title">Tüm Lisanslar</h2>
                <div style="display: flex; gap: 1rem;">
                    <div class="search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" class="search-input" placeholder="Lisans ara..." onkeyup="searchKeys(this.value)">
                    </div>
                    <button class="btn btn-success" onclick="loadPage('create')">
                        <span>➕</span> Yeni Lisans
                    </button>
                </div>
            </div>
            
            <div class="filters">
                <button class="filter-btn active" onclick="filterKeys('all')">Tümü</button>
                <button class="filter-btn" onclick="filterKeys('active')">Aktif</button>
                <button class="filter-btn" onclick="filterKeys('inactive')">Pasif</button>
                <button class="filter-btn" onclick="filterKeys('used')">Kullanılmış</button>
                <button class="filter-btn" onclick="filterKeys('expired')">Süresi Dolmuş</button>
            </div>
            
            <div class="table-container">
                <table class="table" id="keysTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Lisans Anahtarı</th>
                            <th>HWID</th>
                            <th>Oluşturulma</th>
                            <th>Bitiş</th>
                            <th>Kullanım</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="keysTableBody">
                        ${renderKeysTable(allKeys)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// Create license page
function loadCreateLicense() {
    pageTitle.textContent = 'Lisans Oluştur';
    
    pageContent.innerHTML = `
        <div class="content-card" style="max-width: 800px; margin: 0 auto;">
            <div class="card-header">
                <h2 class="card-title">Yeni Lisans Oluştur</h2>
            </div>
            
            <form id="createLicenseForm" onsubmit="createLicense(event)">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Geçerlilik Süresi (Gün)</label>
                        <input type="number" class="form-control" id="expiry_days" value="30" min="0" required>
                        <small style="color: var(--text-secondary); margin-top: 0.25rem;">0 = Süresiz</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Maksimum Kullanım</label>
                        <input type="number" class="form-control" id="max_uses" value="1" min="1" required>
                    </div>
                    
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Notlar (Opsiyonel)</label>
                        <textarea class="form-control" id="notes" rows="3" placeholder="Bu lisans hakkında notlar..."></textarea>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                    <button type="submit" class="btn btn-success btn-lg">
                        <span>➕</span> Lisans Oluştur
                    </button>
                    <button type="button" class="btn btn-secondary btn-lg" onclick="loadPage('licenses')">
                        İptal
                    </button>
                </div>
            </form>
            
            <div id="createResult" style="margin-top: 2rem;"></div>
        </div>
    `;
}

// Validate page
function loadValidate() {
    pageTitle.textContent = 'Lisans Doğrula';
    
    pageContent.innerHTML = `
        <div class="content-card" style="max-width: 600px; margin: 0 auto;">
            <div class="card-header">
                <h2 class="card-title">Lisans Doğrulama</h2>
            </div>
            
            <form id="validateForm" onsubmit="validateLicense(event)">
                <div class="form-group">
                    <label class="form-label">Lisans Anahtarı</label>
                    <input type="text" class="form-control" id="validate_key" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">HWID (Donanım ID)</label>
                    <input type="text" class="form-control" id="validate_hwid" placeholder="Opsiyonel">
                </div>
                
                <button type="submit" class="btn btn-primary btn-lg btn-block">
                    <span>🔍</span> Doğrula
                </button>
            </form>
            
            <div id="validateResult" style="margin-top: 2rem;"></div>
        </div>
    `;
}

// Logs page
function loadLogs() {
    pageTitle.textContent = 'Sistem Logları';
    
    pageContent.innerHTML = `
        <div class="content-card">
            <div class="card-header">
                <h2 class="card-title">HWID Logları</h2>
            </div>
            
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">Log sistemi yakında eklenecek</div>
                <div class="empty-state-message">HWID doğrulama logları burada görüntülenecek</div>
            </div>
        </div>
    `;
}

// Load keys data
async function loadKeysData() {
    try {
        const response = await fetch(`${KEYS_API}?action=list`);
        const data = await response.json();
        
        if (data.success) {
            allKeys = data.keys;
        }
    } catch (error) {
        console.error('Error loading keys:', error);
        showToast('Lisanslar yüklenirken hata oluştu', 'error');
    }
}

// Create license
async function createLicense(event) {
    event.preventDefault();
    
    const data = {
        duration: document.getElementById('expiry_days').value,
        max_uses: document.getElementById('max_uses').value,
        notes: document.getElementById('notes').value
    };
    
    try {
        const response = await fetch(`${KEYS_API}?action=create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('createResult').innerHTML = `
                <div class="key-display">
                    ${result.key}
                    <button class="copy-btn" onclick="copyToClipboard('${result.key}')">Kopyala</button>
                </div>
            `;
            
            showToast('Lisans başarıyla oluşturuldu', 'success');
            event.target.reset();
            
            // Reload keys data
            loadKeysData();
        } else {
            showToast(result.error || 'Lisans oluşturulamadı', 'error');
        }
    } catch (error) {
        console.error('Error creating license:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

// Validate license
async function validateLicense(event) {
    event.preventDefault();
    
    const data = {
        key: document.getElementById('validate_key').value,
        hwid: document.getElementById('validate_hwid').value
    };
    
    try {
        const response = await fetch(`${KEYS_API}?action=validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        const resultDiv = document.getElementById('validateResult');
        if (result.success) {
            resultDiv.innerHTML = `
                <div style="padding: 1.5rem; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 12px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--success);">${result.message}</div>
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div style="padding: 1.5rem; background: rgba(239, 68, 68, 0.1); border: 1px solid var(--error); border-radius: 12px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                    <div style="font-size: 1.25rem; font-weight: 600; color: var(--error);">${result.message}</div>
                </div>
            `;
        }
        
        // Reload keys data
        loadKeysData();
    } catch (error) {
        console.error('Error validating license:', error);
        showToast('Doğrulama sırasında hata oluştu', 'error');
    }
}

// Key actions
async function toggleKeyStatus(id) {
    if (!confirm('Lisans durumunu değiştirmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${KEYS_API}?action=toggle_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Lisans durumu güncellendi', 'success');
            loadKeysData().then(() => loadPage(currentPage));
        } else {
            showToast(result.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

async function resetHWID(id) {
    if (!confirm('HWID\'yi sıfırlamak istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${KEYS_API}?action=reset_hwid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('HWID sıfırlandı', 'success');
            loadKeysData().then(() => loadPage(currentPage));
        } else {
            showToast(result.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

async function deleteKey(id) {
    if (!confirm('Bu lisansı silmek istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${KEYS_API}?action=delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Lisans silindi', 'success');
            loadKeysData().then(() => loadPage(currentPage));
        } else {
            showToast(result.error || 'İşlem başarısız', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Bir hata oluştu', 'error');
    }
}

// Render functions
function renderRecentKeysTable() {
    const recentKeys = allKeys.slice(0, 5);
    
    if (recentKeys.length === 0) {
        return `
            <div class="empty-state">
                <p>Henüz lisans eklenmemiş</p>
            </div>
        `;
    }
    
    return `
        <table class="table">
            <thead>
                <tr>
                    <th>Lisans Anahtarı</th>
                    <th>Oluşturulma</th>
                    <th>Durum</th>
                </tr>
            </thead>
            <tbody>
                ${recentKeys.map(key => `
                    <tr>
                        <td style="font-family: monospace;">${key.license_key}</td>
                        <td>${formatDate(key.created_at)}</td>
                        <td>
                            <span class="badge ${key.is_active ? 'badge-success' : 'badge-danger'}">
                                ${key.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderKeysTable(keys) {
    if (keys.length === 0) {
        return `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-state-icon">🔑</div>
                    <div class="empty-state-title">Lisans bulunamadı</div>
                </td>
            </tr>
        `;
    }
    
    return keys.map(key => `
        <tr>
            <td>${key.id}</td>
            <td style="font-family: monospace; font-size: 0.875rem;">${key.license_key}</td>
            <td>${key.hwid ? `<span title="${key.hwid}">${key.hwid.substring(0, 8)}...</span>` : '-'}</td>
            <td>${formatDate(key.created_at)}</td>
            <td>${key.expires_at ? formatDate(key.expires_at) : 'Süresiz'}</td>
            <td>${key.used_count} / ${key.max_uses}</td>
            <td>
                <span class="badge ${key.is_active ? 'badge-success' : 'badge-danger'}">
                    ${key.is_active ? 'Aktif' : 'Pasif'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-warning" onclick="toggleKeyStatus(${key.id})" title="Aktif/Pasif">
                        ${key.is_active ? '⏸️' : '▶️'}
                    </button>
                    <button class="btn btn-sm btn-success" onclick="resetHWID(${key.id})" title="HWID Sıfırla">
                        🔄
                    </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteKey(${key.id})" title="Sil">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Filter and search functions
function filterKeys(filter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    let filteredKeys = [];
    const now = new Date();
    
    switch(filter) {
        case 'all':
            filteredKeys = allKeys;
            break;
        case 'active':
            filteredKeys = allKeys.filter(k => k.is_active);
            break;
        case 'inactive':
            filteredKeys = allKeys.filter(k => !k.is_active);
            break;
        case 'used':
            filteredKeys = allKeys.filter(k => k.hwid !== null);
            break;
        case 'expired':
            filteredKeys = allKeys.filter(k => k.expires_at && new Date(k.expires_at) < now);
            break;
    }
    
    document.getElementById('keysTableBody').innerHTML = renderKeysTable(filteredKeys);
}

function searchKeys(query) {
    const filtered = allKeys.filter(key => 
        key.license_key.toLowerCase().includes(query.toLowerCase()) ||
        (key.hwid && key.hwid.toLowerCase().includes(query.toLowerCase())) ||
        (key.notes && key.notes.toLowerCase().includes(query.toLowerCase()))
    );
    
    document.getElementById('keysTableBody').innerHTML = renderKeysTable(filtered);
}

// Export function
function exportKeys() {
    const csv = [
        ['ID', 'Lisans Anahtarı', 'HWID', 'Oluşturulma', 'Bitiş', 'Kullanım', 'Durum', 'Notlar'],
        ...allKeys.map(key => [
            key.id,
            key.license_key,
            key.hwid || '',
            key.created_at,
            key.expires_at || 'Süresiz',
            `${key.used_count}/${key.max_uses}`,
            key.is_active ? 'Aktif' : 'Pasif',
            key.notes || ''
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Lisanslar dışa aktarıldı', 'success');
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Kopyalandı!', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Kopyalandı!', 'success');
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Logout function
async function logout() {
    if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    
    try {
        const response = await fetch(`${AUTH_API}?action=logout`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Add toast styles dynamically
const toastStyles = `
    .toast {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        opacity: 0;
        transform: translateY(1rem);
        transition: all 0.3s ease;
        z-index: 1000;
        max-width: 300px;
    }
    
    .toast.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .toast-success {
        background: var(--success);
    }
    
    .toast-error {
        background: var(--error);
    }
    
    .toast-info {
        background: var(--primary);
    }
    
    .toast-warning {
        background: var(--warning);
    }
    
    .key-display {
        background: var(--bg-secondary);
        border: 2px dashed var(--border);
        border-radius: 8px;
        padding: 1.5rem;
        font-family: monospace;
        font-size: 1.125rem;
        text-align: center;
        position: relative;
        word-break: break-all;
    }
    
    .copy-btn {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.5rem 1rem;
        background: var(--primary);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.3s ease;
    }
    
    .copy-btn:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }
    
    .skeleton {
        background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--bg-primary) 50%, var(--bg-secondary) 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
    
    .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }
    
    .quick-actions .btn {
        padding: 1rem;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    
    .quick-actions .btn span {
        font-size: 1.25rem;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// Auto refresh data every 30 seconds
setInterval(() => {
    if (currentPage === 'dashboard' || currentPage === 'licenses') {
        loadKeysData().then(() => {
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
        });
    }
}, 30000);

// Handle window resize for responsive design
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Adjust table for mobile
        if (window.innerWidth < 768) {
            document.querySelectorAll('.table').forEach(table => {
                table.classList.add('table-mobile');
            });
        } else {
            document.querySelectorAll('.table').forEach(table => {
                table.classList.remove('table-mobile');
            });
        }
    }, 250);
});

// Initialize on load
window.addEventListener('load', () => {
    // Check for mobile
    if (window.innerWidth < 768) {
        document.querySelectorAll('.table').forEach(table => {
            table.classList.add('table-mobile');
        });
    }
});
