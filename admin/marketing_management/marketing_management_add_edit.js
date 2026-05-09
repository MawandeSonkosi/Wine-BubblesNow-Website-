// Marketing Add/Edit JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const marketingId = urlParams.get('id');

let marketingData = null;

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required');
        window.location.href = '../../login/login.html';
        return false;
    }
    return true;
}

// ========== LOAD MARKETING DATA (if editing) ==========
async function loadMarketingData() {
    if (!marketingId) {
        document.getElementById('formTitle').textContent = 'Add New Marketing Company';
        document.getElementById('formSubtitle').textContent = 'Fill in the marketing company details below';
        document.getElementById('submitBtn').textContent = 'Add Marketing Company';
        document.getElementById('passwordSection').style.display = 'block';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Marketing Company';
    document.getElementById('formSubtitle').textContent = 'Update marketing company information';
    document.getElementById('submitBtn').textContent = 'Update Marketing Company';
    document.getElementById('passwordSection').style.display = 'none';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${marketingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load marketing company');
        
        const data = await response.json();
        marketingData = data.data || data;
        
        document.getElementById('companyName').value = marketingData.companyName || '';
        document.getElementById('email').value = marketingData.email || '';
        document.getElementById('phoneNumber').value = marketingData.phoneNumber || '';
        document.getElementById('contactPerson').value = marketingData.contactPerson || '';
        document.getElementById('address').value = marketingData.address || '';
        document.getElementById('isActive').checked = marketingData.isActive === true;
        
    } catch (error) {
        showError('Failed to load marketing company data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== VALIDATION ==========
function validateForm() {
    const companyName = document.getElementById('companyName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password')?.value;
    
    if (!companyName) {
        showError('Company name is required');
        return false;
    }
    if (!email) {
        showError('Email is required');
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Enter a valid email address');
        return false;
    }
    if (!marketingId && (!password || password.length < 6)) {
        showError('Password must be at least 6 characters');
        return false;
    }
    
    return true;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingContainer');
    const submitBtn = document.getElementById('submitBtn');
    if (show) {
        if (loadingDiv) loadingDiv.style.display = 'block';
        if (submitBtn) submitBtn.disabled = true;
    } else {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== SAVE MARKETING ==========
async function saveMarketing(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const marketingDataToSave = {
        companyName: document.getElementById('companyName').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phoneNumber: document.getElementById('phoneNumber').value.trim() || null,
        contactPerson: document.getElementById('contactPerson').value.trim() || null,
        address: document.getElementById('address').value.trim() || null,
        isActive: document.getElementById('isActive').checked,
        advertIds: []
    };
    
    if (!marketingId) {
        marketingDataToSave.password = document.getElementById('password').value;
    }
    
    console.log('📤 Saving marketing company:', marketingDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = marketingId ? `${API_BASE}/api/marketing/${marketingId}` : `${API_BASE}/api/marketing`;
        const method = marketingId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(marketingDataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save marketing company');
        }
        
        showToast(marketingId ? 'Marketing company updated successfully!' : 'Marketing company added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'marketing_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save marketing company: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

// Password toggle
const toggleBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
if (toggleBtn && passwordInput) {
    let showPassword = false;
    toggleBtn.addEventListener('click', () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        toggleBtn.innerHTML = showPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
}

document.getElementById('marketingForm')?.addEventListener('submit', saveMarketing);

if (checkAuth()) {
    loadMarketingData();
}