// Warehouse Management JavaScript - Updated with item detail navigation

const API_BASE = window.location.origin;
let allWarehouses = [];
let allWarehouseItems = [];
let searchQuery = '';

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

// ========== FETCH WAREHOUSES ==========
async function fetchWarehouses() {
    const container = document.getElementById('warehouseContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading warehouses...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/locations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Warehouses response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            allWarehouses = data.data;
        } else if (Array.isArray(data)) {
            allWarehouses = data;
        } else {
            allWarehouses = [];
        }
        
        console.log(`✅ Loaded ${allWarehouses.length} warehouses`);
        renderWarehouses();
        renderStats();
        
        // Also load warehouse items for stats
        await fetchWarehouseItems();
        
    } catch (error) {
        console.error('Error fetching warehouses:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading warehouses: ${error.message}</p><button class="btn-primary" onclick="fetchWarehouses()" style="margin-top:16px;">Retry</button></div>`;
    }
}

async function fetchWarehouseItems() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            allWarehouseItems = data.data;
        } else if (Array.isArray(data)) {
            allWarehouseItems = data;
        } else {
            allWarehouseItems = [];
        }
        
        console.log(`✅ Loaded ${allWarehouseItems.length} warehouse items`);
        renderStats();
        
    } catch (error) {
        console.error('Error fetching warehouse items:', error);
    }
}

function renderStats() {
    const container = document.getElementById('statsContainer');
    const total = allWarehouses.length;
    const active = allWarehouses.filter(w => w.isActive === true).length;
    const totalItems = allWarehouseItems.length;
    const totalStock = allWarehouseItems.reduce((sum, i) => sum + (i.currentStock || 0), 0);
    
    container.innerHTML = `
        <div class="stat-box"><i class="fas fa-warehouse"></i><div class="stat-box-info"><div class="stat-box-value">${total}</div><div class="stat-box-label">Total Warehouses</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle" style="color:#2e7d32;"></i><div class="stat-box-info"><div class="stat-box-value">${active}</div><div class="stat-box-label">Active</div></div></div>
        <div class="stat-box"><i class="fas fa-boxes"></i><div class="stat-box-info"><div class="stat-box-value">${totalItems}</div><div class="stat-box-label">Total Items</div></div></div>
        <div class="stat-box"><i class="fas fa-cubes"></i><div class="stat-box-info"><div class="stat-box-value">${totalStock}</div><div class="stat-box-label">Total Stock</div></div></div>
    `;
}

function getWarehouseId(warehouse) {
    return warehouse.id || warehouse._id;
}

function renderWarehouses() {
    const container = document.getElementById('warehouseContainer');
    
    if (allWarehouses.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-warehouse" style="font-size:48px; margin-bottom:16px;"></i><p>No warehouses found</p><button class="btn-primary" onclick="window.location.href='warehouse_management_add_edit.html'"><i class="fas fa-plus"></i> Create First Warehouse</button></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="warehouse-grid">
            ${allWarehouses.map(warehouse => {
                const warehouseId = getWarehouseId(warehouse);
                const statusClass = warehouse.isActive ? 'status-active' : 'status-inactive';
                const itemCount = allWarehouseItems.filter(i => i.warehouseId === warehouseId).length;
                
                return `
                    <div class="warehouse-card" onclick="viewWarehouseDetail('${warehouseId}')">
                        <div class="warehouse-header">
                            <div class="warehouse-name">
                                <i class="fas fa-warehouse"></i>
                                ${escapeHtml(warehouse.name)}
                            </div>
                        </div>
                        <div class="warehouse-body">
                            <div class="warehouse-address">
                                <i class="fas fa-map-marker-alt"></i>
                                ${escapeHtml(warehouse.address)}
                            </div>
                            ${warehouse.phone ? `
                            <div class="warehouse-contact">
                                <i class="fas fa-phone"></i>
                                ${escapeHtml(warehouse.phone)}
                            </div>
                            ` : ''}
                            ${warehouse.email ? `
                            <div class="warehouse-contact">
                                <i class="fas fa-envelope"></i>
                                ${escapeHtml(warehouse.email)}
                            </div>
                            ` : ''}
                            <div style="margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap;">
                                <span class="status-badge ${statusClass}">
                                    <i class="fas ${warehouse.isActive ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                                    ${warehouse.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                                <span class="status-badge" style="background:rgba(107,13,43,0.1); color:#6b0d2b;">
                                    <i class="fas fa-boxes"></i> ${itemCount} items
                                </span>
                            </div>
                        </div>
                        <div class="warehouse-actions" onclick="event.stopPropagation()">
                            <button class="icon-btn" onclick="editWarehouse('${warehouseId}')" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                            <button class="icon-btn" onclick="viewWarehouseDetail('${warehouseId}')" title="View Details"><i class="fas fa-eye"></i> View</button>
                            <button class="icon-btn" onclick="addWineToWarehouse('${warehouseId}')" title="Add Wine" style="color:#2e7d32;"><i class="fas fa-plus"></i> Add Wine</button>
                            <button class="icon-btn danger" onclick="deleteWarehousePrompt('${warehouseId}', '${escapeHtml(warehouse.name)}')" title="Delete"><i class="fas fa-trash-alt"></i> Delete</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = gridHtml;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== WAREHOUSE ACTIONS ==========
window.viewWarehouseDetail = function(warehouseId) {
    console.log('👁️ Viewing warehouse details for ID:', warehouseId);
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_management_detail.html?id=${warehouseId}`;
    } else {
        showToast('Unable to view details: Invalid warehouse ID', 'error');
    }
};

window.editWarehouse = function(warehouseId) {
    console.log('✏️ Editing warehouse with ID:', warehouseId);
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_management_add_edit.html?id=${warehouseId}`;
    } else {
        showToast('Unable to edit: Invalid warehouse ID', 'error');
    }
};

window.addWineToWarehouse = function(warehouseId) {
    console.log('🍷 Adding wine to warehouse with ID:', warehouseId);
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_add_wine.html?warehouseId=${warehouseId}`;
    } else {
        showToast('Unable to add wine: Invalid warehouse ID', 'error');
    }
};

window.deleteWarehousePrompt = function(warehouseId, warehouseName) {
    if (confirm(`⚠️ Permanently delete "${warehouseName}"?\n\nThis action cannot be undone.\nThis will also remove all wines from this warehouse.`)) {
        deleteWarehouse(warehouseId);
    }
};

async function deleteWarehouse(warehouseId) {
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
        fetchWarehouses();
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete warehouse: ' + error.message, 'error');
    }
}

// ========== INITIALIZE ==========
document.getElementById('addWarehouseBtn')?.addEventListener('click', () => {
    window.location.href = '/admin/warehouse_management/warehouse_management_add_edit.html';
});

if (checkAuth()) {
    fetchWarehouses();
}