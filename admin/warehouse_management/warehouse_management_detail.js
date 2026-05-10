// Warehouse Management Detail JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const warehouseId = urlParams.get('id');

let warehouseData = null;
let warehouseItems = [];
let dashboardData = null;
let isLoading = false;

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

async function fetchWarehouseDetails() {
    if (!warehouseId) {
        showError('No warehouse ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading warehouse details...</p></div>';
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Fetch warehouse locations to get details
        const locationsRes = await fetch(`${API_BASE}/api/warehouse/locations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!locationsRes.ok) throw new Error('Failed to fetch warehouse');
        
        const locationsData = await locationsRes.json();
        let warehouses = [];
        if (locationsData.success && Array.isArray(locationsData.data)) {
            warehouses = locationsData.data;
        } else if (Array.isArray(locationsData)) {
            warehouses = locationsData;
        }
        
        warehouseData = warehouses.find(w => (w.id || w._id) === warehouseId);
        
        if (!warehouseData) throw new Error('Warehouse not found');
        
        // Fetch warehouse items
        const itemsRes = await fetch(`${API_BASE}/api/warehouse?warehouseId=${warehouseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            if (itemsData.success && Array.isArray(itemsData.data)) {
                warehouseItems = itemsData.data;
            }
        }
        
        // Fetch dashboard data
        const dashboardRes = await fetch(`${API_BASE}/api/warehouse/dashboard?warehouseId=${warehouseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (dashboardRes.ok) {
            const dashboardDataRes = await dashboardRes.json();
            if (dashboardDataRes.success) {
                dashboardData = dashboardDataRes.data;
            }
        }
        
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching warehouse:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading warehouse: ${error.message}</p><button class="btn-primary" onclick="fetchWarehouseDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
        }
    }
}

function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !warehouseData) return;
    
    const summary = dashboardData?.summary || {};
    const statusClass = warehouseData.isActive ? 'status-active' : 'status-inactive';
    
    // Calculate stats
    const totalItems = summary.totalItems || warehouseItems.length;
    const totalStock = summary.totalStock || warehouseItems.reduce((sum, i) => sum + (i.currentStock || 0), 0);
    const totalValue = summary.totalValue || warehouseItems.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitPrice || 0)), 0);
    const lowStockCount = warehouseItems.filter(i => i.stockStatus === 'low_stock').length;
    const outOfStockCount = warehouseItems.filter(i => i.stockStatus === 'out_of_stock').length;
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-warehouse"></i>
                    ${escapeHtml(warehouseData.name)}
                    <span class="status-badge ${statusClass}" style="margin-left: 12px;">${warehouseData.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="window.location.href='warehouse_management_screen.html'">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button class="btn-icon" onclick="editWarehouse()">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-icon" onclick="addSupplierToWarehouse()">
                        <i class="fas fa-plus"></i> Add Supplier
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-info-circle"></i> Warehouse Information</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${escapeHtml(warehouseData.name)}</div></div>
                    <div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(warehouseData.address)}</div></div>
                    <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(warehouseData.phone || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(warehouseData.email || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Created:</div><div class="info-value">${formatDate(warehouseData.createdAt)}</div></div>
                    <div class="info-row"><div class="info-label">Last Updated:</div><div class="info-value">${formatDate(warehouseData.updatedAt)}</div></div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-chart-line"></i> Warehouse Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${totalItems}</div><div class="stat-label">Total Items</div></div>
                    <div class="stat-card"><div class="stat-value">${totalStock}</div><div class="stat-label">Total Stock</div></div>
                    <div class="stat-card"><div class="stat-value">R${formatNumber(totalValue)}</div><div class="stat-label">Total Value</div></div>
                    <div class="stat-card"><div class="stat-value">${lowStockCount}</div><div class="stat-label">Low Stock</div></div>
                    <div class="stat-card"><div class="stat-value">${outOfStockCount}</div><div class="stat-label">Out of Stock</div></div>
                    <div class="stat-card"><div class="stat-value">${warehouseItems.length}</div><div class="stat-label">Suppliers</div></div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-boxes"></i> Inventory Items</h3>
                <div id="itemsContainer">
                    ${renderItemsList()}
                </div>
            </div>
            
            <div class="detail-section" style="display: flex; gap: 16px; justify-content: flex-end; border-bottom: none;">
                <button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'"><i class="fas fa-arrow-left"></i> Back to List</button>
                <button class="btn-primary" onclick="addSupplierToWarehouse()"><i class="fas fa-plus"></i> Add Supplier</button>
                <button class="btn-primary" onclick="editWarehouse()"><i class="fas fa-edit"></i> Edit Warehouse</button>
            </div>
        </div>
    `;
}

function renderItemsList() {
    if (warehouseItems.length === 0) {
        return '<div class="empty-state" style="padding: 40px;"><i class="fas fa-boxes" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i><p>No items in this warehouse yet</p><button class="btn-primary" onclick="addSupplierToWarehouse()" style="margin-top:16px;"><i class="fas fa-plus"></i> Add First Supplier</button></div>';
    }
    
    // Group items by supplier
    const suppliers = {};
    warehouseItems.forEach(item => {
        if (!suppliers[item.companyId]) {
            suppliers[item.companyId] = {
                name: item.companyName,
                email: item.companyEmail,
                items: []
            };
        }
        suppliers[item.companyId].items.push(item);
    });
    
    let html = '';
    for (const [supplierId, supplier] of Object.entries(suppliers)) {
        const totalStock = supplier.items.reduce((sum, i) => sum + (i.currentStock || 0), 0);
        const totalValue = supplier.items.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitPrice || 0)), 0);
        
        html += `
            <div style="margin-bottom: 24px; border: 1px solid var(--admin-border); border-radius: 16px; overflow: hidden;">
                <div style="padding: 16px; background: #f8f7f5; border-bottom: 1px solid var(--admin-border);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                        <div>
                            <h4 style="margin: 0; color: var(--admin-primary);"><i class="fas fa-building"></i> ${escapeHtml(supplier.name)}</h4>
                            <p style="margin: 4px 0 0; font-size: 12px; color: var(--admin-muted);">${escapeHtml(supplier.email)}</p>
                        </div>
                        <div style="display: flex; gap: 16px;">
                            <div><span style="font-weight: bold;">${totalStock}</span> total stock</div>
                            <div><span style="font-weight: bold;">R${formatNumber(totalValue)}</span> total value</div>
                        </div>
                    </div>
                </div>
                <div style="padding: 16px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--admin-border);">
                                <th style="text-align: left; padding: 8px; color: var(--admin-muted); font-weight: 600;">Item</th>
                                <th style="text-align: center; padding: 8px; color: var(--admin-muted); font-weight: 600;">Stock</th>
                                <th style="text-align: right; padding: 8px; color: var(--admin-muted); font-weight: 600;">Price</th>
                                <th style="text-align: right; padding: 8px; color: var(--admin-muted); font-weight: 600;">Value</th>
                                <th style="text-align: center; padding: 8px; color: var(--admin-muted); font-weight: 600;">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${supplier.items.map(item => {
                                const statusColor = item.stockStatus === 'in_stock' ? '#2e7d32' : 
                                                   item.stockStatus === 'low_stock' ? '#ed6c02' : '#d32f2f';
                                const statusText = item.stockStatus === 'in_stock' ? 'In Stock' : 
                                                  item.stockStatus === 'low_stock' ? 'Low Stock' : 'Out of Stock';
                                return `
                                    <tr style="border-bottom: 1px solid var(--admin-border); cursor: pointer;" onclick="viewItemDetail('${item.id}')">
                                        <td style="padding: 12px 8px;">${escapeHtml(item.itemName)}</td>
                                        <td style="text-align: center; padding: 12px 8px;">${item.currentStock || 0}</td>
                                        <td style="text-align: right; padding: 12px 8px;">R${formatNumber(item.unitPrice || 0)}</td>
                                        <td style="text-align: right; padding: 12px 8px;">R${formatNumber((item.currentStock || 0) * (item.unitPrice || 0))}</td>
                                        <td style="text-align: center; padding: 12px 8px;">
                                            <span style="background: ${statusColor}20; color: ${statusColor}; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 600;">${statusText}</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    return html;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { 
        return '—';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showError(message) {
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${escapeHtml(message)}</p><button class="btn-primary" onclick="fetchWarehouseDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
    } else {
        alert(message);
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

function editWarehouse() {
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_management_add_edit.html?id=${warehouseId}`;
    } else {
        showError('Unable to edit: Invalid warehouse ID');
    }
}

function addSupplierToWarehouse() {
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_add_supplier.html?id=${warehouseId}`;
    } else {
        showError('Unable to add supplier: Invalid warehouse ID');
    }
}

window.viewItemDetail = function(itemId) {
    if (itemId && itemId !== 'undefined' && itemId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_item_detail.html?id=${itemId}`;
    }
};

if (checkAuth()) {
    fetchWarehouseDetails();
}