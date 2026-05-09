// Supplier Add/Edit JavaScript - Matches Flutter AddEditSupplierScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const supplierId = urlParams.get('id');

let supplierData = null;
let allWines = [];
let selectedWineIds = [];
let wineSearchQuery = '';

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

// ========== FETCH WINES ==========
async function fetchWines() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines?all=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                allWines = data;
            } else if (data.wines && Array.isArray(data.wines)) {
                allWines = data.wines;
            } else if (data.data && Array.isArray(data.data)) {
                allWines = data.data;
            }
            console.log(`✅ Loaded ${allWines.length} wines`);
            renderWineList();
        }
    } catch (error) {
        console.error('Error fetching wines:', error);
        document.getElementById('wineListContainer').innerHTML = '<div style="padding:20px; text-align:center; color:#d32f2f;">Failed to load wines</div>';
    }
}

// ========== RENDER WINE LIST ==========
function renderWineList() {
    const container = document.getElementById('wineListContainer');
    if (!container) return;
    
    let filtered = allWines.filter(wine => {
        if (wineSearchQuery) {
            const q = wineSearchQuery.toLowerCase();
            return wine.name.toLowerCase().includes(q) || wine.type.toLowerCase().includes(q);
        }
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#6d6d6d;">No wines found</div>';
        return;
    }
    
    container.innerHTML = filtered.map(wine => `
        <div class="wine-item ${selectedWineIds.includes(wine.id) ? 'selected' : ''}" onclick="toggleWineSelection(${wine.id})">
            <input type="checkbox" ${selectedWineIds.includes(wine.id) ? 'checked' : ''} onclick="event.stopPropagation(); toggleWineSelection(${wine.id})">
            <div class="wine-item-info">
                <div class="wine-item-name">${escapeHtml(wine.name)}</div>
                <div class="wine-item-details">${escapeHtml(wine.type)} • ${escapeHtml(wine.category)}</div>
            </div>
            <div class="wine-item-price">R${(wine.price || 0).toFixed(2)}</div>
        </div>
    `).join('');
}

function updateSelectedWinesDisplay() {
    const container = document.getElementById('selectedWinesContainer');
    const listContainer = document.getElementById('selectedWinesList');
    
    if (selectedWineIds.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    const selectedWines = allWines.filter(w => selectedWineIds.includes(w.id));
    
    listContainer.innerHTML = selectedWines.map(wine => `
        <span class="wine-chip">
            ${escapeHtml(wine.name)}
            <i class="fas fa-times" onclick="event.stopPropagation(); toggleWineSelection(${wine.id})"></i>
        </span>
    `).join('');
}

window.toggleWineSelection = function(wineId) {
    const index = selectedWineIds.indexOf(wineId);
    if (index === -1) {
        selectedWineIds.push(wineId);
    } else {
        selectedWineIds.splice(index, 1);
    }
    renderWineList();
    updateSelectedWinesDisplay();
};

// ========== LOAD SUPPLIER DATA (if editing) ==========
async function loadSupplierData() {
    if (!supplierId) {
        document.getElementById('formTitle').textContent = 'Add New Supplier';
        document.getElementById('formSubtitle').textContent = 'Fill in the supplier details below';
        document.getElementById('submitBtn').textContent = 'Add Supplier';
        document.getElementById('passwordSection').style.display = 'block';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Supplier';
    document.getElementById('formSubtitle').textContent = 'Update supplier information';
    document.getElementById('submitBtn').textContent = 'Update Supplier';
    document.getElementById('passwordSection').style.display = 'none';
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load supplier');
        
        const data = await response.json();
        supplierData = data.data || data;
        
        document.getElementById('name').value = supplierData.name || '';
        document.getElementById('email').value = supplierData.email || '';
        document.getElementById('phone').value = supplierData.phone || '';
        document.getElementById('status').value = supplierData.status || 'active';
        document.getElementById('isVerified').checked = supplierData.isVerified === true;
        
        if (supplierData.wineIds && supplierData.wineIds.length > 0) {
            selectedWineIds = [...supplierData.wineIds];
            updateSelectedWinesDisplay();
            renderWineList();
        }
        
    } catch (error) {
        showError('Failed to load supplier data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== VALIDATION ==========
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password')?.value;
    
    if (!name) {
        showError('Supplier name is required');
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
    if (!phone) {
        showError('Phone number is required');
        return false;
    }
    if (!supplierId && (!password || password.length < 6)) {
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

// ========== SAVE SUPPLIER ==========
async function saveSupplier(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const supplierDataToSave = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim().toLowerCase(),
        phone: document.getElementById('phone').value.trim(),
        status: document.getElementById('status').value,
        isVerified: document.getElementById('isVerified').checked,
        wineIds: selectedWineIds
    };
    
    if (!supplierId) {
        supplierDataToSave.password = document.getElementById('password').value;
    }
    
    console.log('📤 Saving supplier:', supplierDataToSave);
    console.log('🍷 Wine IDs:', selectedWineIds);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = supplierId ? `${API_BASE}/api/suppliers/${supplierId}` : `${API_BASE}/api/suppliers`;
        const method = supplierId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(supplierDataToSave)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to save supplier');
        }
        
        showToast(supplierId ? 'Supplier updated successfully!' : 'Supplier added successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'supplier_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to save supplier: ' + error.message);
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

// Wine search
document.getElementById('wineSearch')?.addEventListener('input', (e) => {
    wineSearchQuery = e.target.value;
    renderWineList();
});

document.getElementById('supplierForm')?.addEventListener('submit', saveSupplier);

if (checkAuth()) {
    fetchWines().then(() => loadSupplierData());
}