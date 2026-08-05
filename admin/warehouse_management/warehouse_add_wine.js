// Add Wine to Warehouse JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const warehouseId = urlParams.get('warehouseId');

let wines = [];
let warehouseItems = [];
let selectedWine = null;
let warehouseName = '';
let maxAvailable = 0;

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

// ========== LOAD DATA ==========
async function loadData() {
    if (!warehouseId) {
        showError('No warehouse ID provided');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Get warehouse name
        const locationsRes = await fetch(`${API_BASE}/api/warehouse/locations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (locationsRes.ok) {
            const data = await locationsRes.json();
            let locations = [];
            if (data.success && Array.isArray(data.data)) {
                locations = data.data;
            } else if (Array.isArray(data)) {
                locations = data;
            }
            const warehouse = locations.find(w => (w.id || w._id) === warehouseId);
            if (warehouse) {
                warehouseName = warehouse.name;
                document.getElementById('formTitle').textContent = `Add Wine to ${warehouse.name}`;
                document.getElementById('formSubtitle').textContent = `Select a wine to add to the ${warehouse.name} inventory.`;
            }
        }
        
        // Get all active wines
        const winesRes = await fetch(`${API_BASE}/api/wines?all=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (winesRes.ok) {
            const data = await winesRes.json();
            if (Array.isArray(data)) {
                wines = data.filter(w => w.isActive === true);
            } else if (data.data && Array.isArray(data.data)) {
                wines = data.data.filter(w => w.isActive === true);
            }
        }
        
        // Get all warehouse items to check allocations
        const itemsRes = await fetch(`${API_BASE}/api/warehouse`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (itemsRes.ok) {
            const data = await itemsRes.json();
            if (data.success && Array.isArray(data.data)) {
                warehouseItems = data.data;
            } else if (Array.isArray(data)) {
                warehouseItems = data;
            }
        }
        
        populateWineSelect();
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function populateWineSelect() {
    const select = document.getElementById('wineSelect');
    if (!select) return;
    
    // Get wine IDs already in this warehouse
    const existingWineIds = warehouseItems
        .filter(item => item.warehouseId === warehouseId)
        .map(item => item.itemId);
    
    // Filter out wines already in this warehouse
    const availableWines = wines.filter(w => !existingWineIds.includes(w.id.toString()));
    
    if (availableWines.length === 0) {
        select.innerHTML = '<option value="">All wines are already in this warehouse</option>';
        return;
    }
    
    select.innerHTML = '<option value="">-- Select a Wine --</option>' +
        availableWines.map(wine => 
            `<option value="${wine.id}">${escapeHtml(wine.name)} (${escapeHtml(wine.type)} - R${wine.price.toFixed(2)})</option>`
        ).join('');
}

function onWineSelect() {
    const wineId = document.getElementById('wineSelect').value;
    const infoBox = document.getElementById('wineInfoBox');
    const quantityInput = document.getElementById('quantityInput');
    
    if (!wineId) {
        infoBox.classList.remove('show');
        selectedWine = null;
        quantityInput.value = 0;
        return;
    }
    
    selectedWine = wines.find(w => w.id == wineId);
    if (!selectedWine) return;
    
    // Calculate available stock for this warehouse
    const allocatedInOthers = warehouseItems
        .filter(item => 
            item.itemId === selectedWine.id.toString() && 
            item.warehouseId !== warehouseId
        )
        .reduce((sum, item) => sum + (item.currentStock || 0), 0);
    
    maxAvailable = (selectedWine.stockCount || 0) - allocatedInOthers;
    if (maxAvailable < 0) maxAvailable = 0;
    
    // Update info box
    document.getElementById('wineName').textContent = selectedWine.name;
    document.getElementById('wineType').textContent = selectedWine.type || '—';
    document.getElementById('wineCategory').textContent = selectedWine.category || '—';
    document.getElementById('winePrice').textContent = `R${(selectedWine.price || 0).toFixed(2)}`;
    document.getElementById('wineStock').textContent = `${selectedWine.stockCount || 0} units`;
    document.getElementById('wineAllocated').textContent = `${allocatedInOthers} units`;
    document.getElementById('wineAvailable').textContent = `${maxAvailable} units`;
    
    infoBox.classList.add('show');
    quantityInput.value = 0;
    quantityInput.max = maxAvailable;
}

// ========== QUANTITY CONTROLS ==========
function setupQuantityControls() {
    const quantityInput = document.getElementById('quantityInput');
    const decrementBtn = document.getElementById('decrementBtn');
    const incrementBtn = document.getElementById('incrementBtn');
    const useAllBtn = document.getElementById('useAllBtn');
    
    if (decrementBtn) {
        decrementBtn.addEventListener('click', () => {
            const val = parseInt(quantityInput.value) || 0;
            if (val > 0) {
                quantityInput.value = val - 1;
            }
        });
    }
    
    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => {
            const val = parseInt(quantityInput.value) || 0;
            if (val < maxAvailable) {
                quantityInput.value = val + 1;
            } else {
                showToast(`Only ${maxAvailable} units available`, 'warning');
            }
        });
    }
    
    if (useAllBtn) {
        useAllBtn.addEventListener('click', () => {
            quantityInput.value = maxAvailable;
        });
    }
    
    quantityInput.addEventListener('change', () => {
        const val = parseInt(quantityInput.value) || 0;
        if (val > maxAvailable) {
            quantityInput.value = maxAvailable;
            showToast(`Only ${maxAvailable} units available`, 'warning');
        }
        if (val < 0) quantityInput.value = 0;
    });
}

// ========== VALIDATION ==========
function validateForm() {
    const wineId = document.getElementById('wineSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value) || 0;
    
    if (!wineId) {
        showError('Please select a wine');
        return false;
    }
    
    if (quantity > maxAvailable) {
        showError(`Only ${maxAvailable} units available to allocate`);
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

// ========== SAVE ==========
async function saveWineToWarehouse(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const wineId = document.getElementById('wineSelect').value;
    const quantity = parseInt(document.getElementById('quantityInput').value) || 0;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/add-wine`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wineId: wineId,
                warehouseId: warehouseId,
                quantity: quantity
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to add wine to warehouse');
        }
        
        const data = await response.json();
        console.log('📦 Response:', data);
        
        showToast('Wine added to warehouse successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = `warehouse_management_detail.html?id=${warehouseId}`;
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to add wine: ' + error.message);
        showLoading(false);
    }
}

// ========== INITIALIZE ==========
const form = document.getElementById('addWineForm');
if (form) {
    form.addEventListener('submit', saveWineToWarehouse);
}

document.getElementById('wineSelect')?.addEventListener('change', onWineSelect);

if (checkAuth()) {
    setupQuantityControls();
    loadData();
}