// Wine Add/Edit JavaScript - Matches Flutter WineAddEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const wineId = urlParams.get('id');

let wineData = null;
let selectedProperties = {
    isFeatured: false,
    isGifting: false,
    isEvent: false,
    isCase: false,
    isActive: true
};

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

// ========== PROPERTY CHIPS ==========
function initPropertyChips() {
    document.querySelectorAll('.property-chip').forEach(chip => {
        const propName = chip.dataset.prop;
        if (selectedProperties[propName]) {
            chip.classList.add('active');
        }
        
        chip.addEventListener('click', () => {
            const prop = chip.dataset.prop;
            selectedProperties[prop] = !selectedProperties[prop];
            if (selectedProperties[prop]) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    });
}

// ========== IMAGE PREVIEW ==========
function setupImagePreview() {
    const imageUrlInput = document.getElementById('imageUrl');
    const previewContainer = document.getElementById('imagePreview');
    
    function updatePreview() {
        const url = imageUrlInput.value.trim();
        if (url) {
            previewContainer.innerHTML = `<img src="${url}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-wine-bottle\'></i> Image Preview</div>'">`;
        } else {
            previewContainer.innerHTML = '<div class="image-placeholder"><i class="fas fa-wine-bottle"></i> Image Preview</div>';
        }
    }
    
    imageUrlInput.addEventListener('input', updatePreview);
    updatePreview();
}

// ========== LOAD WINE DATA (if editing) ==========
async function loadWineData() {
    if (!wineId) {
        document.getElementById('formTitle').textContent = 'Add New Wine';
        document.getElementById('formSubtitle').textContent = 'Fill in the wine details below';
        document.getElementById('submitBtn').textContent = 'Add Wine';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Wine';
    document.getElementById('formSubtitle').textContent = 'Update wine information';
    document.getElementById('submitBtn').textContent = 'Update Wine';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines/${wineId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load wine');
        
        const data = await response.json();
        wineData = data.data || data;
        
        // Populate form fields
        document.getElementById('name').value = wineData.name || '';
        document.getElementById('type').value = wineData.type || '';
        document.getElementById('description').value = wineData.description || '';
        document.getElementById('category').value = wineData.category || '';
        document.getElementById('stockCount').value = wineData.stockCount || 0;
        document.getElementById('price').value = wineData.price || 0;
        document.getElementById('imageUrl').value = wineData.imageUrl || '';
        
        // Update properties
        selectedProperties = {
            isFeatured: wineData.isFeatured || false,
            isGifting: wineData.isGifting || false,
            isEvent: wineData.isEvent || false,
            isCase: wineData.isCase || false,
            isActive: wineData.isActive !== false
        };
        
        // Update chip UI
        document.querySelectorAll('.property-chip').forEach(chip => {
            const propName = chip.dataset.prop;
            if (selectedProperties[propName]) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
        
        // Update image preview
        const previewContainer = document.getElementById('imagePreview');
        if (wineData.imageUrl) {
            previewContainer.innerHTML = `<img src="${wineData.imageUrl}" alt="Preview" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-wine-bottle\'></i> Image Preview</div>'">`;
        }
        
    } catch (error) {
        showError('Failed to load wine data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== VALIDATION ==========
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const type = document.getElementById('type').value;
    const description = document.getElementById('description').value.trim();
    const category = document.getElementById('category').value.trim();
    const stockCount = document.getElementById('stockCount').value;
    const price = document.getElementById('price').value;
    
    if (!name) {
        showError('Wine name is required');
        return false;
    }
    if (!type) {
        showError('Wine type is required');
        return false;
    }
    if (!description) {
        showError('Description is required');
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
    if (!price || price <= 0) {
        showError('Valid price is required');
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

// ========== SAVE WINE ==========
async function saveWine(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const wineDataToSave = {
        name: document.getElementById('name').value.trim(),
        type: document.getElementById('type').value,
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value.trim(),
        stockCount: parseInt(document.getElementById('stockCount').value),
        price: parseFloat(document.getElementById('price').value),
        imageUrl: document.getElementById('imageUrl').value.trim() || 'assets/images/default_wine.png',
        isFeatured: selectedProperties.isFeatured,
        isGifting: selectedProperties.isGifting,
        isEvent: selectedProperties.isEvent,
        isCase: selectedProperties.isCase,
        isActive: selectedProperties.isActive,
        isAddOn: false
    };
    
    // Generate numeric ID for new wines (use timestamp)
    if (!wineId) {
        wineDataToSave.id = Date.now();
    } else {
        wineDataToSave.id = parseInt(wineId);
    }
    
    console.log('📤 Saving wine:', wineDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = wineId ? `${API_BASE}/api/wines/${wineId}` : `${API_BASE}/api/wines`;
        const method = wineId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(wineDataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save wine');
        }
        
        showToast(wineId ? 'Wine updated successfully!' : 'Wine added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'wine_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save wine: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
document.getElementById('wineForm')?.addEventListener('submit', saveWine);

if (checkAuth()) {
    initPropertyChips();
    setupImagePreview();
    loadWineData();
}