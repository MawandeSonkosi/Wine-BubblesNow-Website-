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
        // Create mode
        document.getElementById('formTitle').textContent = 'Add New Marketing Company';
        document.getElementById('formSubtitle').textContent = 'Fill in the marketing company details below';
        document.getElementById('submitBtn').textContent = 'Add Marketing Company';
        document.getElementById('passwordSection').style.display = 'block';
        return;
    }
    
    // Edit mode
    document.getElementById('formTitle').textContent = 'Edit Marketing Company';
    document.getElementById('formSubtitle').textContent = 'Update marketing company information';
    document.getElementById('submitBtn').textContent = 'Update Marketing Company';
    document.getElementById('passwordSection').style.display = 'none';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = `${API_BASE}/api/marketing/${marketingId}`;
        console.log('📡 Fetching marketing company from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Marketing company not found');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        // Handle different response formats
        // Possible formats: { success: true, data: {...} } or direct object
        let company = null;
        if (data.success === true && data.data) {
            company = data.data;
        } else if (data.data && typeof data.data === 'object') {
            company = data.data;
        } else if (data._id || data.id) {
            company = data;
        } else {
            throw new Error('Invalid response format');
        }
        
        if (!company) {
            throw new Error('No company data received');
        }
        
        marketingData = company;
        
        // Populate form fields
        document.getElementById('companyName').value = marketingData.companyName || '';
        document.getElementById('email').value = marketingData.email || '';
        document.getElementById('phoneNumber').value = marketingData.phoneNumber || '';
        document.getElementById('contactPerson').value = marketingData.contactPerson || '';
        document.getElementById('address').value = marketingData.address || '';
        document.getElementById('isActive').checked = marketingData.isActive === true;
        
        console.log('✅ Marketing company loaded:', marketingData.companyName);
        
    } catch (error) {
        console.error('Error loading marketing company:', error);
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
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
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
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => {
        if (toast && toast.parentNode) toast.remove();
    }, 3000);
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
        
        console.log(`📡 ${method} request to:`, url);
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(marketingDataToSave)
        });
        
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (!response.ok) {
            const errorMsg = data.message || data.error || 'Failed to save marketing company';
            throw new Error(errorMsg);
        }
        
        showToast(marketingId ? 'Marketing company updated successfully!' : 'Marketing company added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'marketing_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save marketing company: ' + error.message);
        showLoading(false);
    }
}

// ========== DELETE MARKETING (for edit mode) ==========
async function deleteMarketing() {
    if (!marketingId) return;
    
    if (!confirm(`⚠️ Permanently delete "${document.getElementById('companyName').value}"?\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${marketingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete');
        }
        
        showToast('Marketing company deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'marketing_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete marketing company: ' + error.message);
        showLoading(false);
    }
}

// ========== ADD DELETE BUTTON FOR EDIT MODE ==========
function addDeleteButton() {
    if (!marketingId) return;
    
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
        // Check if delete button already exists
        if (document.querySelector('.btn-danger')) return;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-secondary btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Company';
        deleteBtn.style.marginTop = '12px';
        deleteBtn.style.width = '100%';
        deleteBtn.style.background = 'transparent';
        deleteBtn.style.border = '1px solid #d32f2f';
        deleteBtn.style.color = '#d32f2f';
        deleteBtn.style.padding = '14px 24px';
        deleteBtn.style.borderRadius = '40px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontWeight = '500';
        deleteBtn.onclick = deleteMarketing;
        
        // Add hover effect
        deleteBtn.onmouseover = function() {
            this.style.background = 'rgba(211,47,47,0.1)';
        };
        deleteBtn.onmouseout = function() {
            this.style.background = 'transparent';
        };
        
        formActions.appendChild(deleteBtn);
    }
}

// ========== INITIALIZE ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
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

// Form submission
const form = document.getElementById('marketingForm');
if (form) {
    form.addEventListener('submit', saveMarketing);
}

// Initialize
if (checkAuth()) {
    loadMarketingData();
    addDeleteButton();
}