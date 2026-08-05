// Add-On Add/Edit JavaScript - Matches Flutter AddOnAddEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const addonId = urlParams.get('id');

let addonData = null;

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

// Helper function to get correct image URL for preview
function getImageUrlForPreview(imageUrl) {
    if (!imageUrl) {
        return null;
    }
    if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
        return imageUrl;
    }
    if (imageUrl.startsWith('assets/')) {
        return '../../' + imageUrl;
    }
    return '../../assets/images/' + imageUrl;
}

// ========== IMAGE PREVIEW ==========
function setupImagePreview() {
    const imageUrlInput = document.getElementById('imageUrl');
    const previewContainer = document.getElementById('imagePreview');
    
    function updatePreview() {
        const url = imageUrlInput.value.trim();
        if (url) {
            const imgUrl = getImageUrlForPreview(url);
            if (imgUrl) {
                previewContainer.innerHTML = `<img src="${imgUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-gift\'></i> Image Preview</div>'">`;
            } else {
                previewContainer.innerHTML = '<div class="image-placeholder"><i class="fas fa-gift"></i> Image Preview</div>';
            }
        } else {
            previewContainer.innerHTML = '<div class="image-placeholder"><i class="fas fa-gift"></i> Image Preview</div>';
        }
    }
    
    imageUrlInput.addEventListener('input', updatePreview);
    updatePreview();
}

// ========== LOAD ADD-ON DATA (if editing) ==========
async function loadAddOnData() {
    if (!addonId) {
        document.getElementById('formTitle').textContent = 'Add New Add-On';
        document.getElementById('formSubtitle').textContent = 'Fill in the add-on details below';
        document.getElementById('submitBtn').textContent = 'Add Add-On';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Add-On';
    document.getElementById('formSubtitle').textContent = 'Update add-on information';
    document.getElementById('submitBtn').textContent = 'Update Add-On';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/addons/${addonId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load add-on');
        
        const data = await response.json();
        addonData = data.data || data;
        
        // Populate form fields
        document.getElementById('name').value = addonData.name || '';
        document.getElementById('price').value = addonData.price || 0;
        document.getElementById('category').value = addonData.category || 'Biltong';
        document.getElementById('description').value = addonData.description || '';
        document.getElementById('imageUrl').value = addonData.imageUrl || '';
        document.getElementById('stockCount').value = addonData.stockCount || 0;
        
        // Set active status toggle
        const isActive = addonData.isActive !== undefined ? addonData.isActive : true;
        const toggle = document.getElementById('activeToggle');
        const statusText = document.getElementById('statusText');
        if (toggle) {
            toggle.checked = isActive;
            updateActiveStatus(isActive);
        }
        
        // Update image preview
        const previewContainer = document.getElementById('imagePreview');
        if (addonData.imageUrl) {
            const imgUrl = getImageUrlForPreview(addonData.imageUrl);
            if (imgUrl) {
                previewContainer.innerHTML = `<img src="${imgUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-gift\'></i> Image Preview</div>'">`;
            }
        }
        
    } catch (error) {
        showError('Failed to load add-on data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== ACTIVE STATUS TOGGLE ==========
function updateActiveStatus(isActive) {
    const statusText = document.getElementById('statusText');
    const statusIcon = document.getElementById('statusIcon');
    if (statusText) {
        statusText.textContent = isActive ? 'Active' : 'Inactive';
        statusText.style.color = isActive ? '#2e7d32' : '#6d6d6d';
    }
    if (statusIcon) {
        statusIcon.className = isActive ? 'fas fa-check-circle' : 'fas fa-times-circle';
        statusIcon.style.color = isActive ? '#2e7d32' : '#6d6d6d';
    }
}

function setupActiveToggle() {
    const toggle = document.getElementById('activeToggle');
    if (toggle) {
        toggle.addEventListener('change', function() {
            updateActiveStatus(this.checked);
        });
    }
}

// ========== VALIDATION ==========
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const price = document.getElementById('price').value;
    const category = document.getElementById('category').value;
    const stockCount = document.getElementById('stockCount').value;
    
    if (!name) {
        showError('Add-on name is required');
        return false;
    }
    if (!price || price <= 0) {
        showError('Valid price is required');
        return false;
    }
    if (!category) {
        showError('Category is required');
        return false;
    }
    if (!stockCount || stockCount < 0) {
        showError('Valid stock count is required');
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

// ========== SAVE ADD-ON ==========
async function saveAddOn(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const isActive = document.getElementById('activeToggle').checked;
    
    const addonDataToSave = {
        name: document.getElementById('name').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value.trim() || null,
        imageUrl: document.getElementById('imageUrl').value.trim() || 'assets/images/default_addon.png',
        stockCount: parseInt(document.getElementById('stockCount').value) || 0,
        isActive: isActive
    };
    
    // Generate numeric ID for new add-ons (use timestamp)
    if (!addonId) {
        addonDataToSave.id = Date.now();
    } else {
        addonDataToSave.id = parseInt(addonId);
    }
    
    console.log('📤 Saving add-on:', addonDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = addonId ? `${API_BASE}/api/addons/${addonId}` : `${API_BASE}/api/addons`;
        const method = addonId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(addonDataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save add-on');
        }
        
        showToast(addonId ? 'Add-on updated successfully!' : 'Add-on added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'addon_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save add-on: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
document.getElementById('addonForm')?.addEventListener('submit', saveAddOn);

if (checkAuth()) {
    setupImagePreview();
    setupActiveToggle();
    loadAddOnData();
}