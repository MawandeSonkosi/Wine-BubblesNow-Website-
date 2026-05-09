// Wine Farm Add/Edit JavaScript - Matches Flutter WineFarmAddEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const farmId = urlParams.get('id');

let farmData = null;

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
    return imageUrl;
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
                previewContainer.innerHTML = `<img src="${imgUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-landscape\'></i> Image Preview</div>'">`;
            } else {
                previewContainer.innerHTML = '<div class="image-placeholder"><i class="fas fa-landscape"></i> Image Preview</div>';
            }
        } else {
            previewContainer.innerHTML = '<div class="image-placeholder"><i class="fas fa-landscape"></i> Image Preview</div>';
        }
    }
    
    imageUrlInput.addEventListener('input', updatePreview);
    updatePreview();
}

// ========== LOAD WINE FARM DATA (if editing) ==========
async function loadWineFarmData() {
    if (!farmId) {
        document.getElementById('formTitle').textContent = 'Add New Wine Farm';
        document.getElementById('formSubtitle').textContent = 'Fill in the wine farm details below';
        document.getElementById('submitBtn').textContent = 'Add Wine Farm';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Wine Farm';
    document.getElementById('formSubtitle').textContent = 'Update wine farm information';
    document.getElementById('submitBtn').textContent = 'Update Wine Farm';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/winefarms/${farmId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load wine farm');
        
        const data = await response.json();
        farmData = data.data || data;
        
        // Populate form fields
        document.getElementById('name').value = farmData.name || '';
        document.getElementById('location').value = farmData.location || 'Cape Town';
        document.getElementById('description').value = farmData.description || '';
        document.getElementById('phoneNumber').value = farmData.phoneNumber || '';
        document.getElementById('email').value = farmData.email || '';
        document.getElementById('videoUrl').value = farmData.videoUrl || '';
        document.getElementById('imageUrl').value = farmData.imageUrl || '';
        document.getElementById('isActive').checked = farmData.isActive !== false;
        
        // Update image preview
        const previewContainer = document.getElementById('imagePreview');
        if (farmData.imageUrl) {
            const imgUrl = getImageUrlForPreview(farmData.imageUrl);
            if (imgUrl) {
                previewContainer.innerHTML = `<img src="${imgUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-landscape\'></i> Image Preview</div>'">`;
            }
        }
        
    } catch (error) {
        showError('Failed to load wine farm data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== VALIDATION ==========
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    
    if (!name) {
        showError('Wine farm name is required');
        return false;
    }
    if (!location) {
        showError('Location is required');
        return false;
    }
    if (!description) {
        showError('Description is required');
        return false;
    }
    if (!imageUrl) {
        showError('Image URL is required');
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

// ========== SAVE WINE FARM ==========
async function saveWineFarm(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const farmDataToSave = {
        name: document.getElementById('name').value.trim(),
        location: document.getElementById('location').value,
        description: document.getElementById('description').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim() || null,
        email: document.getElementById('email').value.trim().toLowerCase() || null,
        videoUrl: document.getElementById('videoUrl').value.trim() || null,
        isActive: document.getElementById('isActive').checked,
        featuredWines: []
    };
    
    console.log('📤 Saving wine farm:', farmDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = farmId ? `${API_BASE}/api/winefarms/${farmId}` : `${API_BASE}/api/winefarms`;
        const method = farmId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(farmDataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save wine farm');
        }
        
        showToast(farmId ? 'Wine farm updated successfully!' : 'Wine farm added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'wine_farm_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save wine farm: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
document.getElementById('wineFarmForm')?.addEventListener('submit', saveWineFarm);

if (checkAuth()) {
    setupImagePreview();
    loadWineFarmData();
}