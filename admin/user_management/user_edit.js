// User Edit JavaScript - Matches Flutter UserEditScreen functionality

const API_BASE = window.location.origin;
let userId = null;
let isLoading = false;

// Get user ID from URL
const urlParams = new URLSearchParams(window.location.search);
userId = urlParams.get('id');

// DOM Elements
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const submitBtn = document.getElementById('submitBtn');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phoneNumber');
const passwordInput = document.getElementById('password');
const isAdminCheckbox = document.getElementById('isAdmin');
const isVerifiedCheckbox = document.getElementById('isVerified');
const errorContainer = document.getElementById('errorContainer');
const passwordRequired = document.getElementById('passwordRequired');
const passwordHint = document.getElementById('passwordHint');

// Error elements
const fullNameError = document.getElementById('fullNameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// Password toggle
const togglePassword = document.getElementById('togglePassword');
let showPassword = false;

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

// ========== TOGGLE PASSWORD ==========
if (togglePassword) {
    togglePassword.addEventListener('click', () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        togglePassword.innerHTML = showPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
}

// ========== LOAD USER DATA (if editing) ==========
async function loadUserData() {
    if (!userId) {
        // Creating new user
        formTitle.textContent = 'Create New User';
        formSubtitle.textContent = 'Fill in the user details below';
        submitBtn.textContent = 'Create User';
        passwordRequired.textContent = '*';
        passwordHint.textContent = 'Password is required for new users (min. 6 characters)';
        return;
    }
    
    // Editing existing user
    formTitle.textContent = 'Edit User';
    formSubtitle.textContent = 'Update user information';
    submitBtn.textContent = 'Update User';
    passwordRequired.textContent = '(optional)';
    passwordHint.textContent = 'Leave blank to keep current password';
    
    try {
        showLoading(true);
        const token = localStorage.getItem('wineBubbles_token');
        console.log('📡 Fetching user:', `${API_BASE}/api/users/${userId}`);
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('User not found');
            }
            throw new Error(`Failed to load user: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 User data:', data);
        
        const user = data.data || data;
        
        fullNameInput.value = user.fullName || '';
        emailInput.value = user.email || '';
        phoneInput.value = user.phoneNumber || '';
        isAdminCheckbox.checked = user.isAdmin === true;
        isVerifiedCheckbox.checked = user.isVerified === true;
        passwordInput.value = '';
        
    } catch (error) {
        console.error('Load user error:', error);
        showError('Failed to load user data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== VALIDATION ==========
function validateForm() {
    let isValid = true;
    
    // Hide all errors
    document.querySelectorAll('.error-text').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
    
    // Validate Full Name
    const fullName = fullNameInput.value.trim();
    if (!fullName) {
        fullNameError.style.display = 'block';
        fullNameInput.classList.add('error');
        isValid = false;
    }
    
    // Validate Email
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        emailError.style.display = 'block';
        emailInput.classList.add('error');
        isValid = false;
    }
    
    // Validate Password
    const password = passwordInput.value;
    if (!userId && (!password || password.length < 6)) {
        passwordError.style.display = 'block';
        passwordInput.classList.add('error');
        isValid = false;
    } else if (userId && password && password.length < 6) {
        passwordError.style.display = 'block';
        passwordInput.classList.add('error');
        isValid = false;
    }
    
    return isValid;
}

// ========== SHOW ERROR ==========
function showError(message) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 5000);
}

// ========== LOADING STATE ==========
let loadingOverlay = null;

function showLoading(show) {
    if (show) {
        if (loadingOverlay) return;
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
        document.body.appendChild(loadingOverlay);
        if (submitBtn) submitBtn.disabled = true;
    } else {
        if (loadingOverlay) loadingOverlay.remove();
        loadingOverlay = null;
        if (submitBtn) submitBtn.disabled = false;
    }
}

// ========== SAVE USER ==========
async function saveUser(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const userData = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        phoneNumber: phoneInput.value.trim(),
        isAdmin: isAdminCheckbox.checked,
        isVerified: isVerifiedCheckbox.checked
    };
    
    // Only include password if provided
    const password = passwordInput.value;
    if (password) {
        userData.password = password;
    }
    
    console.log('📤 Saving user data:', { ...userData, password: password ? '***' : '(not set)' });
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        let response;
        
        if (userId) {
            // UPDATE existing user
            console.log('📡 PUT to:', `${API_BASE}/api/users/${userId}`);
            response = await fetch(`${API_BASE}/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        } else {
            // CREATE new user
            console.log('📡 POST to:', `${API_BASE}/api/users`);
            response = await fetch(`${API_BASE}/api/users`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
        }
        
        console.log('📡 Response status:', response.status);
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || 'Failed to save user');
        }
        
        showToast(userId ? 'User updated successfully!' : 'User created successfully!', 'success');
        
        // Redirect back to user management
        setTimeout(() => {
            window.location.href = 'user_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError(error.message);
        showLoading(false);
    }
}

// ========== DELETE USER (for edit mode) ==========
async function deleteUser() {
    if (!userId) return;
    
    if (!confirm(`⚠️ Permanently delete this user?\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        console.log('📡 DELETE to:', `${API_BASE}/api/users/${userId}`);
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete user');
        }
        
        showToast('User deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'user_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError(error.message);
        showLoading(false);
    }
}

// ========== ADD DELETE BUTTON FOR EDIT MODE ==========
function addDeleteButton() {
    if (!userId) return;
    
    const formActions = document.querySelector('.form-actions');
    if (formActions) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-secondary btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete User';
        deleteBtn.onclick = deleteUser;
        formActions.insertBefore(deleteBtn, formActions.children[1]);
    }
}

// ========== TOAST NOTIFICATION ==========
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== INITIALIZE ==========
document.getElementById('userForm')?.addEventListener('submit', saveUser);

if (checkAuth()) {
    loadUserData();
    addDeleteButton();
}