// Warehouse Add/Edit JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const warehouseId = urlParams.get('id');

let warehouseData = null;

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

// ========== LOAD WAREHOUSE DATA ==========
async function loadWarehouseData() {
    console.log('🔍 Warehouse ID from URL:', warehouseId);
    
    if (!warehouseId || warehouseId === 'null' || warehouseId === 'undefined') {
        document.getElementById('formTitle').textContent = 'Add New Warehouse';
        document.getElementById('formSubtitle').textContent = 'Create a new warehouse location for storing wine inventory.';
        document.getElementById('submitBtn').textContent = 'Create Warehouse';
        return;
    }
    
    document.getElementById('formTitle').textContent = 'Edit Warehouse';
    document.getElementById('formSubtitle').textContent = 'Update warehouse information and settings.';
    document.getElementById('submitBtn').textContent = 'Update Warehouse';
    
    addDeleteButton();
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const url = `${API_BASE}/api/warehouse/locations`;
        console.log('📡 Fetching warehouses from:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        let warehouses = [];
        if (data.success && Array.isArray(data.data)) {
            warehouses = data.data;
        } else if (Array.isArray(data)) {
            warehouses = data;
        }
        
        const warehouse = warehouses.find(w => (w.id || w._id) === warehouseId);
        
        if (!warehouse) throw new Error('Warehouse not found');
        
        warehouseData = warehouse;
        
        document.getElementById('name').value = warehouse.name || '';
        document.getElementById('address').value = warehouse.address || '';
        document.getElementById('phone').value = warehouse.phone || '';
        document.getElementById('email').value = warehouse.email || '';
        document.getElementById('isActive').checked = warehouse.isActive === true;
        
        console.log('✅ Warehouse loaded:', warehouse.name);
        
    } catch (error) {
        console.error('Error loading warehouse:', error);
        showError('Failed to load warehouse data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function addDeleteButton() {
    if (!warehouseId || warehouseId === 'null' || warehouseId === 'undefined') return;
    
    const formActions = document.querySelector('.form-actions');
    if (formActions && !document.querySelector('.btn-danger')) {
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Warehouse';
        deleteBtn.onclick = deleteWarehouse;
        formActions.appendChild(deleteBtn);
    }
}

async function deleteWarehouse() {
    if (!warehouseId) return;
    
    const warehouseName = document.getElementById('name').value || 'this warehouse';
    if (!confirm(`⚠️ Permanently delete "${warehouseName}"?\n\nThis action cannot be undone.\nThis will also remove all suppliers and items from this warehouse.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/locations/${warehouseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete');
        }
        
        showToast('Warehouse deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'warehouse_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showError('Failed to delete warehouse: ' + error.message);
        showLoading(false);
    }
}

function validateForm() {
    const name = document.getElementById('name').value.trim();
    const address = document.getElementById('address').value.trim();
    
    if (!name) {
        showError('Warehouse name is required');
        return false;
    }
    if (!address) {
        showError('Address is required');
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

async function saveWarehouse(event) {
    event.preventDefault();
    
    if (!validateForm()) return;
    
    showLoading(true);
    
    const warehouseDataToSave = {
        name: document.getElementById('name').value.trim(),
        address: document.getElementById('address').value.trim(),
        phone: document.getElementById('phone').value.trim() || null,
        email: document.getElementById('email').value.trim() || null,
        isActive: document.getElementById('isActive').checked
    };
    
    console.log('📤 Saving warehouse:', warehouseDataToSave);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const isEdit = warehouseId && warehouseId !== 'null' && warehouseId !== 'undefined';
        const url = isEdit ? `${API_BASE}/api/warehouse/locations/${warehouseId}` : `${API_BASE}/api/warehouse/locations`;
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`📡 ${method} request to:`, url);
        
        const response = await fetch(url, {
            method: method,
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(warehouseDataToSave)
        });
        
        if (!response.ok) {
            let errorMsg = 'Failed to save warehouse';
            try {
                const data = await response.json();
                errorMsg = data.message || data.error || errorMsg;
            } catch(e) {}
            throw new Error(errorMsg);
        }
        
        const data = await response.json();
        console.log('📦 Response data:', data);
        
        showToast(isEdit ? 'Warehouse updated successfully!' : 'Warehouse created successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'warehouse_management_screen.html';
        }, 1500);
        
    } catch (error) {
        console.error('Save error:', error);
        showError('Failed to save warehouse: ' + error.message);
        showLoading(false);
    }
}

const form = document.getElementById('warehouseForm');
if (form) {
    form.addEventListener('submit', saveWarehouse);
}

if (checkAuth()) {
    loadWarehouseData();
}