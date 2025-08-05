// API endpoint
const API_URL = 'api/auth.php';

// DOM elements
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.querySelector('.login-btn');

// Check if already logged in
checkAuth();

// Form submit handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show loading state
    loginBtn.classList.add('loading');
    errorMessage.classList.remove('show');
    
    try {
        const response = await fetch(`${API_URL}?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Başarılı giriş
            window.location.href = 'dashboard.html';
        } else {
            // Hata mesajını göster
            showError(data.message || 'Giriş başarısız');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Bağlantı hatası oluştu');
    } finally {
        loginBtn.classList.remove('loading');
    }
});

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}?action=check`);
        const data = await response.json();
        
        if (data.authenticated) {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Enter key focus management
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('password').focus();
    }
});