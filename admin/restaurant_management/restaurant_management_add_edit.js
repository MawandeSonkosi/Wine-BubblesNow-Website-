// Restaurant Add/Edit JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('id');

let restaurantData = null;

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required');
        window.location.href = '/login/login.html';
        return false;
    }
    
    const userData = localStorage.getItem('wineBubbles_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userIcon = document.getElementById('userIcon');
            if (userIcon) {
                userIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleUserDropdown(user);
                });
            }
        } catch(e) {}
    }
    return true;
}

function toggleUserDropdown(user) {
    const existing = document.querySelector('.user-dropdown');
    if (existing) { existing.remove(); return; }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = 'position:absolute; top:100px; right:20px; background:white; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12); padding:16px; min-width:220px; z-index:1000; border:1px solid #eae3da;';
    dropdown.innerHTML = `
        <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #eee;">
            <div style="font-weight:bold; margin-bottom:4px;">${escapeHtml(user.fullName || user.email)} <span class="badge badge-admin">ADMIN</span></div>
            <div style="font-size:13px; color:#6d6d6d;">${escapeHtml(user.email)}</div>
        </div>
        <a href="/user/profile.html" style="display:flex; align-items:center; gap:10px; padding:10px 0; color:#1b1b1b; text-decoration:none;"><i class="fas fa-user"></i> My Profile</a>
        <button id="logoutBtn" style="margin-top:12px; padding:10px; background:#6b0d2b; color:white; border:none; border-radius:8px; width:100%; cursor:pointer; font-weight:600;">Logout</button>
    `;
    document.body.appendChild(dropdown);
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
        window.location.href = '/login/login.html';
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !document.getElementById('userIcon')?.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// ========== LOAD RESTAURANT DATA ==========
async function loadRestaurantData() {
    console.log('🔍 Restaurant ID from URL:', restaurantId);
    
    if (!restaurantId || restaurantId === 'null' || restaurantId === 'undefined') {
        document.getElementById('formTitle').textContent = 'Add New Restaurant';
        document.getElementById('formSubtitle').textContent = 'Create a new restaurant for the Dine With Me feature.';
        document.getElementById('submitBtn').textContent = 'Create Restaurant';
        document.getElementById('passwordSection').style.display = 'block';
        document.getElementById('passwordRequired').textContent = '*';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Restaurant';
    document.getElementById('formSubtitle').textContent = 'Update restaurant information and settings.';
    document.getElementById('submitBtn').textContent = 'Update Restaurant';
    document.getElementById('passwordSection').style.display = 'none';
    
    addDeleteButton();
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Restaurant data:', data);
        
        let restaurant = null;
        if (data.id || data._id) {
            restaurant = data;
        } else if (data.data) {
            restaurant = data.data;
        } else {
            throw new Error('Invalid response format');
        }
        
        restaurantData = restaurant;
        
        // Populate form fields
        document.getElementById('name').value = restaurant.name || '';
        document.getElementById('description').value = restaurant.description || '';
        document.getElementById('imageUrl').value = restaurant.imageUrl || '';
        document.getElementById('bannerImageUrl').value = restaurant.bannerImageUrl || '';
        document.getElementById('address').value = restaurant.address || '';
        document.getElementById('phone').value = restaurant.phone || '';
        document.getElementById('email').value = restaurant.email || '';
        document.getElementById('cuisineType').value = restaurant.cuisineType || '';
        document.getElementById('openingHours').value = restaurant.openingHours || '09:00';
        document.getElementById('closingHours').value = restaurant.closingHours || '22:00';
        document.getElementById('isActive').checked = restaurant.isActive === true;
        
        updateImagePreview();
        
        console.log('✅ Restaurant loaded:', restaurant.name);
        
    } catch (error) {
        console.error('Error loading restaurant:', error);
        showError('Failed to load restaurant data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function addDeleteButton() {
    if (!restaurantId || restaurantId === 'null' || restaurantId === 'undefined') return;
    
    const formActions = document.querySelector('.form-actions');
    if (formActions && !document.querySelector('.btn-danger')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Restaurant';
        deleteBtn.onclick = deleteRestaurant;
        formActions.appendChild(deleteBtn);
    }
}

async function deleteRestaurant() {
    if (!restaurantId) return;
    
    const restaurantName = document.getElementById('name').value || 'this restaurant';
    if (!confirm(`⚠️ Permanently delete "${restaurantName}"?\n\nThis action cannot be undone.\nThis will also remove all menu items for this restaurant.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete');
        }
        
        showToast('Restaurant deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'restaurant_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete restaurant: ' + error.message);
        showLoading(false);
    }
}

function setupImagePreview() {
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', updateImagePreview);
        imageUrlInput.addEventListener('change', updateImagePreview);
    }
}

function updateImagePreview() {
    const imageUrl = document.getElementById('imageUrl').value;
    const previewArea = document.getElementById('imagePreviewArea');
    const previewImg = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');
    
    if (imageUrl && imageUrl.trim() !== '') {
        previewArea.style.display = 'block';
        const fullUrl = getImageUrl(imageUrl);
        previewImg.src = fullUrl;
        previewImg.onload = () => {
            previewImg.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        };
        previewImg.onerror = () => {
            previewImg.style.display = 'none';
            if (placeholder) {
                placeholder.style.display = 'block';
                placeholder.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#d32f2f;"></i><p style="margin-top:8px;">Failed to load image. Check URL.</p>';
            }
        };
    } else {
        previewArea.style.display = 'none';
    }
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    return '/assets/dine_with_me/' + imageUrl;
}

function validateForm() {
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const address = document.getElementById('address').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const cuisineType = document.getElementById('cuisineType').value.trim();
    const password = document.getElementById('password')?.value;
    
    if (!name) {
        showError('Restaurant name is required');
        return false;
    }
    if (!description) {
        showError('Description is required');
        return false;
    }
    if (!address) {
        showError('Address is required');
        return false;
    }
    if (!phone) {
        showError('Phone number is required');
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
    if (!cuisineType) {
        showError('Cuisine type is required');
        return false;
    }
    if (!restaurantId && (!password || password.length < 6)) {
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
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

async function saveRestaurant(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    // Generate a unique ID if creating new
    let restaurantIdValue = restaurantId;
    if (!restaurantIdValue && restaurantIdValue !== 'null') {
        restaurantIdValue = Date.now();
    }
    
    const restaurantDataToSave = {
        id: restaurantIdValue ? parseInt(restaurantIdValue) : Date.now(),
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim() || '/assets/dine_with_me/placeholder.png',
        bannerImageUrl: document.getElementById('bannerImageUrl').value.trim() || '/assets/dine_with_me/banner_placeholder.png',
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        cuisineType: document.getElementById('cuisineType').value.trim(),
        openingHours: document.getElementById('openingHours').value,
        closingHours: document.getElementById('closingHours').value,
        isActive: document.getElementById('isActive').checked,
        menuItems: restaurantData?.menuItems || [],
        images: restaurantData?.images || [],
        location: restaurantData?.location || { lat: -26.2041, lng: 28.0473 }
    };
    
    if (!restaurantId || restaurantId === 'null' || restaurantId === 'undefined') {
        restaurantDataToSave.password = document.getElementById('password').value;
    } else {
        // Keep existing password if not changing
        restaurantDataToSave.password = restaurantData?.password || 'restaurant123';
    }
    
    console.log('📤 Saving restaurant:', restaurantDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const isEdit = restaurantId && restaurantId !== 'null' && restaurantId !== 'undefined';
        const url = isEdit ? `${API_BASE}/api/dine-with-me/${restaurantId}` : `${API_BASE}/api/dine-with-me`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`📡 ${method} request to:`, url);
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(restaurantDataToSave)
        });
        
        if (!response.ok) {
            let errorMsg = 'Failed to save restaurant';
            try {
                const data = await response.json();
                errorMsg = data.message || data.error || errorMsg;
            } catch(e) {}
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        showToast(isEdit ? 'Restaurant updated successfully!' : 'Restaurant created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'restaurant_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save restaurant: ' + error.message);
        showLoading(false);
    }
}

// Password toggle
const toggleBtn = document.querySelector('.password-toggle');
const passwordInput = document.getElementById('password');
if (toggleBtn && passwordInput) {
    let showPassword = false;
    toggleBtn.addEventListener('click', () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        toggleBtn.innerHTML = showPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
}

const form = document.getElementById('restaurantForm');
if (form) {
    form.addEventListener('submit', saveRestaurant);
}

setupImagePreview();

if (checkAuth()) {
    loadRestaurantData();
}