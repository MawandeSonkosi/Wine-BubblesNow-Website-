// Advert Add/Edit JavaScript - Updated with wine linking and stock functionality

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const advertId = urlParams.get('id');

let advertData = null;
let wines = [];
let selectedWine = null;
let isLoadingWines = false;
let isSaving = false;

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required');
        window.location.href = '../../login/login.html';
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
            <div style="font-weight:bold; margin-bottom:4px;">${escapeHtml(user.fullName || user.email)} <span class="badge-admin" style="background:#6b0d2b; color:white; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:8px;">ADMIN</span></div>
            <div style="font-size:13px; color:#6d6d6d;">${escapeHtml(user.email)}</div>
        </div>
        <a href="../../user/profile.html" style="display:flex; align-items:center; gap:10px; padding:10px 0; color:#1b1b1b; text-decoration:none;"><i class="fas fa-user"></i> My Profile</a>
        <button id="logoutBtn" style="margin-top:12px; padding:10px; background:#6b0d2b; color:white; border:none; border-radius:8px; width:100%; cursor:pointer; font-weight:600;">Logout</button>
    `;
    document.body.appendChild(dropdown);
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
        window.location.href = '../../login/login.html';
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

// ========== LOAD WINES ==========
async function loadWines() {
    isLoadingWines = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines?all=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load wines');
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            wines = data.filter(w => w.isActive === true);
        } else if (data.data && Array.isArray(data.data)) {
            wines = data.data.filter(w => w.isActive === true);
        } else {
            wines = [];
        }
        
        console.log(`✅ Loaded ${wines.length} active wines`);
        populateWineSelect();
        
    } catch (error) {
        console.error('Error loading wines:', error);
        showError('Failed to load wines: ' + error.message);
    } finally {
        isLoadingWines = false;
    }
}

function populateWineSelect() {
    const select = document.getElementById('wineId');
    if (!select) return;
    
    const currentWineId = select.value;
    
    select.innerHTML = '<option value="">-- Select a Wine --</option>' +
        wines.map(wine => `<option value="${wine.id}" ${currentWineId == wine.id ? 'selected' : ''}>${escapeHtml(wine.name)} (${escapeHtml(wine.type)} - R${wine.price.toFixed(2)})</option>`).join('');
}

function onWineSelect() {
    const wineId = document.getElementById('wineId').value;
    if (!wineId) {
        selectedWine = null;
        // Clear auto-populated fields
        document.getElementById('title').value = '';
        document.getElementById('subtitle').value = '';
        document.getElementById('imageUrl').value = '';
        document.getElementById('price').value = '';
        document.getElementById('stockCount').value = '';
        updateImagePreview();
        return;
    }
    
    const selected = wines.find(w => w.id == wineId);
    if (!selected) return;
    
    selectedWine = selected;
    
    // Auto-populate fields from selected wine
    document.getElementById('title').value = selected.name;
    document.getElementById('subtitle').value = selected.type;
    document.getElementById('imageUrl').value = selected.bannerImageUrl || selected.imageUrl || '';
    document.getElementById('price').value = selected.price;
    document.getElementById('stockCount').value = selected.stockCount;
    
    // Update image preview
    updateImagePreview();
}

// ========== LOAD ADVERT DATA (if editing) ==========
async function loadAdvertData() {
    console.log('🔍 Advert ID from URL:', advertId);
    
    if (!advertId || advertId === 'null' || advertId === 'undefined') {
        // Create mode
        document.getElementById('formTitle').textContent = 'Add New Advert';
        document.getElementById('formSubtitle').textContent = 'Link an advert to a wine for display on the home screen';
        document.getElementById('submitBtn').textContent = 'Create Advert';
        return;
    }
    
    // Edit mode
    document.getElementById('formTitle').textContent = 'Edit Advert';
    document.getElementById('formSubtitle').textContent = 'Update advert information - linked to wine';
    document.getElementById('submitBtn').textContent = 'Update Advert';
    
    // Add delete button for edit mode
    addDeleteButton();
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = `${API_BASE}/api/adverts/${advertId}`;
        console.log('📡 Fetching advert from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Advert not found');
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        // Handle different response formats
        let advert = null;
        if (data.data && typeof data.data === 'object') {
            advert = data.data;
        } else if (data._id || data.id) {
            advert = data;
        } else {
            throw new Error('Invalid response format');
        }
        
        if (!advert) {
            throw new Error('No advert data received');
        }
        
        advertData = advert;
        
        // Populate form fields
        document.getElementById('title').value = advert.title || '';
        document.getElementById('subtitle').value = advert.subtitle || '';
        document.getElementById('imageUrl').value = advert.imageUrl || '';
        document.getElementById('targetUrl').value = advert.targetUrl || '';
        document.getElementById('price').value = advert.price || 0;
        document.getElementById('stockCount').value = advert.stockCount || 0;
        document.getElementById('position').value = advert.position || 0;
        document.getElementById('bannerPosition').value = advert.bannerPosition || 'top';
        document.getElementById('isActive').checked = advert.isActive === true;
        
        // Set wine selection if linked
        if (advert.wineId) {
            document.getElementById('wineId').value = advert.wineId;
            // Trigger wine selection to populate fields
            onWineSelect();
        }
        
        // Update image preview
        updateImagePreview();
        
        console.log('✅ Advert loaded:', advert.title);
        
    } catch (error) {
        console.error('Error loading advert:', error);
        showError('Failed to load advert data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== ADD DELETE BUTTON ==========
function addDeleteButton() {
    if (!advertId || advertId === 'null' || advertId === 'undefined') return;
    
    const formActions = document.querySelector('.form-actions');
    if (formActions && !document.querySelector('.btn-danger')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Advert';
        deleteBtn.onclick = deleteAdvert;
        formActions.appendChild(deleteBtn);
    }
}

// ========== DELETE ADVERT ==========
async function deleteAdvert() {
    if (!advertId) return;
    
    const advertTitle = document.getElementById('title').value || 'this advert';
    if (!confirm(`⚠️ Permanently delete "${advertTitle}"?\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/adverts/${advertId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete');
        }
        
        showToast('Advert deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'advert_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete advert: ' + error.message);
        showLoading(false);
    }
}

// ========== IMAGE PREVIEW ==========
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
    if (imageUrl.indexOf('assets/') === 0) return '../../' + imageUrl;
    return '../../assets/images/' + imageUrl;
}

// ========== VALIDATION ==========
function validateForm() {
    const title = document.getElementById('title').value.trim();
    const wineId = document.getElementById('wineId').value;
    
    if (!title) {
        showError('Title is required');
        return false;
    }
    
    // If no wine selected, require target URL or image
    if (!wineId) {
        const imageUrl = document.getElementById('imageUrl').value.trim();
        const targetUrl = document.getElementById('targetUrl').value.trim();
        if (!imageUrl && !targetUrl) {
            showError('Please either select a wine or provide an image URL');
            return false;
        }
    }
    
    const position = parseInt(document.getElementById('position').value);
    if (isNaN(position) || position < 0) {
        showError('Position must be a valid number');
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
        isSaving = true;
    } else {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (submitBtn) submitBtn.disabled = false;
        isSaving = false;
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

// ========== SAVE ADVERT ==========
async function saveAdvert(event) {
    event.preventDefault();
    
    if (isSaving) return;
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const wineId = document.getElementById('wineId').value;
    const selectedWine = wines.find(w => w.id == wineId);
    
    const advertDataToSave = {
        title: document.getElementById('title').value.trim(),
        subtitle: document.getElementById('subtitle').value.trim(),
        imageUrl: document.getElementById('imageUrl').value.trim(),
        targetUrl: document.getElementById('targetUrl').value.trim(),
        price: selectedWine ? selectedWine.price : parseFloat(document.getElementById('price').value) || 0,
        productType: selectedWine ? 'wine' : 'advert',
        category: selectedWine ? 'wine' : 'marketing',
        type: selectedWine ? 'wine' : 'homepage',
        isAvailableForPurchase: selectedWine ? selectedWine.stockCount > 0 : false,
        stockCount: selectedWine ? selectedWine.stockCount : parseInt(document.getElementById('stockCount').value) || 0,
        isActive: document.getElementById('isActive').checked,
        position: parseInt(document.getElementById('position').value) || 0,
        bannerPosition: document.getElementById('bannerPosition').value,
        wineId: selectedWine ? parseInt(wineId) : null,
    };
    
    // Preserve analytics if editing
    if (advertData) {
        advertDataToSave.impressions = advertData.impressions || 0;
        advertDataToSave.clicks = advertData.clicks || 0;
        advertDataToSave.purchases = advertData.purchases || 0;
        advertDataToSave.ctr = advertData.ctr || 0;
        advertDataToSave.conversionRate = advertData.conversionRate || 0;
    }
    
    console.log('📤 Saving advert:', advertDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const isEdit = advertId && advertId !== 'null' && advertId !== 'undefined';
        const url = isEdit ? `${API_BASE}/api/adverts/${advertId}` : `${API_BASE}/api/adverts`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`📡 ${method} request to:`, url);
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(advertDataToSave)
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            let errorMsg = 'Failed to save advert';
            try {
                const data = await response.json();
                errorMsg = data.message || data.error || errorMsg;
            } catch(e) {}
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        showToast(isEdit ? 'Advert updated successfully!' : 'Advert created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'advert_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save advert: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
const form = document.getElementById('advertForm');
if (form) {
    form.addEventListener('submit', saveAdvert);
}

setupImagePreview();

if (checkAuth()) {
    loadWines().then(() => {
        loadAdvertData();
    });
}