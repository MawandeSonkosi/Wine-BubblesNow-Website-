// Warehouse Management Detail JavaScript - Matches Flutter WarehouseDetailScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const warehouseId = urlParams.get('id');

let warehouseData = null;
let warehouseItems = [];
let dashboardData = null;
let isLoading = false;
let searchQuery = '';

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

// ========== FETCH WAREHOUSE DETAILS ==========
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
        
        // Fetch warehouse items for this warehouse
        const itemsRes = await fetch(`${API_BASE}/api/warehouse?warehouseId=${warehouseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            if (itemsData.success && Array.isArray(itemsData.data)) {
                warehouseItems = itemsData.data;
            } else if (Array.isArray(itemsData)) {
                warehouseItems = itemsData;
            }
        }
        console.log(`✅ Loaded ${warehouseItems.length} items for warehouse`);
        
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

// ========== GET STOCK STATUS ==========
function getStockStatus(item) {
    const stock = item.currentStock || 0;
    const reorderLevel = item.reorderLevel || 10;
    
    if (stock <= 0) return { text: 'Out of Stock', color: '#d32f2f', class: 'status-out-of-stock' };
    if (stock <= reorderLevel) return { text: 'Low Stock', color: '#ed6c02', class: 'status-low-stock' };
    return { text: 'In Stock', color: '#2e7d32', class: 'status-in-stock' };
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    if (imageUrl.indexOf('assets/') === 0) return '/' + imageUrl;
    return '/assets/images/' + imageUrl;
}

function formatCurrency(value) {
    if (value == null) return '0.00';
    return Number(value).toFixed(2);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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

// ========== FILTER ITEMS ==========
function filterItems() {
    if (!warehouseItems || warehouseItems.length === 0) return [];
    
    if (!searchQuery || searchQuery.trim() === '') {
        return warehouseItems;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return warehouseItems.filter(item => {
        const nameMatch = item.itemName && item.itemName.toLowerCase().includes(query);
        const categoryMatch = item.itemCategory && item.itemCategory.toLowerCase().includes(query);
        return nameMatch || categoryMatch;
    });
}

// ========== RENDER DETAIL ==========
function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !warehouseData) return;
    
    const summary = dashboardData?.summary || {};
    const statusClass = warehouseData.isActive ? 'status-active' : 'status-inactive';
    
    // Calculate stats
    const totalItems = summary.totalItems || warehouseItems.length;
    const totalStock = summary.totalStock || warehouseItems.reduce((sum, i) => sum + (i.currentStock || 0), 0);
    const totalValue = summary.totalValue || warehouseItems.reduce((sum, i) => sum + ((i.currentStock || 0) * (i.unitPrice || 0)), 0);
    
    // Filter items based on search
    const filteredItems = filterItems();
    const itemsToShow = filteredItems.length > 0 ? filteredItems : warehouseItems;
    
    container.innerHTML = `
        <div class="detail-card">
            <!-- Header -->
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-warehouse"></i>
                    ${escapeHtml(warehouseData.name)}
                    <span class="status-badge ${statusClass}" style="margin-left: 12px;">${warehouseData.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="refreshData()" title="Refresh">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn-icon" onclick="editWarehouse()" title="Edit Warehouse">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="addWineToWarehouse()" title="Add Wine" style="color:#2e7d32;">
                        <i class="fas fa-plus"></i> Add Wine
                    </button>
                </div>
            </div>
            
            <!-- Search Bar -->
            <div class="search-bar-container" style="padding: 12px 24px; border-bottom: 1px solid var(--admin-border);">
                <div class="search-bar-wrapper" style="display: flex; align-items: center; background: white; border-radius: 12px; padding: 8px 16px; border: 1px solid var(--admin-border);">
                    <i class="fas fa-search" style="color: var(--admin-muted); margin-right: 12px;"></i>
                    <input type="text" id="searchInput" placeholder="Search wines..." style="border: none; flex: 1; outline: none; font-family: 'Montserrat', sans-serif; font-size: 14px; background: transparent;">
                    <i class="fas fa-times" id="clearSearchBtn" style="color: var(--admin-muted); cursor: pointer; display: ${searchQuery ? 'block' : 'none'};" onclick="clearSearch()"></i>
                </div>
            </div>
            
            <!-- Warehouse Info Card -->
            <div class="detail-section" style="background: var(--admin-primary); margin: 16px 24px; border-radius: 16px; border: none; padding: 16px 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: rgba(212,175,55,0.2); border-radius: 8px; padding: 8px;">
                        <i class="fas fa-warehouse" style="color: var(--admin-accent); font-size: 24px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: var(--admin-accent); font-weight: bold; font-size: 16px;">${escapeHtml(warehouseData.name)}</div>
                        <div style="color: rgba(212,175,55,0.8); font-size: 12px;">${escapeHtml(warehouseData.address)}</div>
                    </div>
                </div>
                <div style="display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-phone" style="color: rgba(212,175,55,0.7); font-size: 14px;"></i>
                        <span style="color: rgba(212,175,55,0.8); font-size: 12px;">${escapeHtml(warehouseData.phone || 'No phone')}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-envelope" style="color: rgba(212,175,55,0.7); font-size: 14px;"></i>
                        <span style="color: rgba(212,175,55,0.8); font-size: 12px;">${escapeHtml(warehouseData.email || 'No email')}</span>
                    </div>
                </div>
            </div>
            
            <!-- Stats -->
            <div class="detail-section" style="border-bottom: 1px solid var(--admin-border);">
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
                    <div class="stat-item" style="background: #f8f7f5; border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--admin-border);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--admin-primary);">${totalItems}</div>
                        <div style="font-size: 11px; color: var(--admin-muted);">Total Wines</div>
                    </div>
                    <div class="stat-item" style="background: #f8f7f5; border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--admin-border);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--admin-primary);">R${formatCurrency(totalValue)}</div>
                        <div style="font-size: 11px; color: var(--admin-muted);">Total Value</div>
                    </div>
                    <div class="stat-item" style="background: #f8f7f5; border-radius: 12px; padding: 12px; text-align: center; border: 1px solid var(--admin-border);">
                        <div style="font-size: 20px; font-weight: 700; color: var(--admin-primary);">${totalStock}</div>
                        <div style="font-size: 11px; color: var(--admin-muted);">Total Stock</div>
                    </div>
                </div>
            </div>
            
            <!-- Wines Section -->
            <div class="detail-section" style="border-bottom: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 class="section-title" style="margin: 0;">
                        <i class="fas fa-wine-bottle"></i> Wines in Warehouse
                    </h3>
                    <span style="font-size: 13px; color: var(--admin-muted);">${itemsToShow.length} item${itemsToShow.length !== 1 ? 's' : ''}</span>
                </div>
                <div id="itemsContainer">
                    ${renderItemsList(itemsToShow)}
                </div>
            </div>
            
            <!-- Footer Actions -->
            <div class="detail-section" style="display: flex; gap: 16px; justify-content: flex-end; border-top: 1px solid var(--admin-border); padding: 16px 24px;">
                <button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'">
                    <i class="fas fa-arrow-left"></i> Back to List
                </button>
                <button class="btn-primary" onclick="addWineToWarehouse()">
                    <i class="fas fa-plus"></i> Add Wine
                </button>
                <button class="btn-primary" onclick="editWarehouse()">
                    <i class="fas fa-edit"></i> Edit Warehouse
                </button>
            </div>
        </div>
    `;
    
    // Setup search listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = searchQuery;
        searchInput.addEventListener('input', function() {
            searchQuery = this.value;
            const clearBtn = document.getElementById('clearSearchBtn');
            if (clearBtn) {
                clearBtn.style.display = searchQuery ? 'block' : 'none';
            }
            // Re-render with filter
            renderDetail();
        });
    }
}

function renderItemsList(items) {
    if (!items || items.length === 0) {
        return `
            <div class="empty-state" style="padding: 40px;">
                <i class="fas fa-wine-bottle" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i>
                <p>${searchQuery ? 'No wines match your search' : 'No wines in this warehouse yet'}</p>
                ${!searchQuery ? `<button class="btn-primary" onclick="addWineToWarehouse()" style="margin-top:16px;"><i class="fas fa-plus"></i> Add First Wine</button>` : ''}
            </div>
        `;
    }
    
    return items.map(item => {
        const status = getStockStatus(item);
        const imageUrl = getImageUrl(item.metadata?.imageUrl || 'assets/images/default_wine.png');
        const itemType = item.itemType || 'wine';
        
        return `
            <div class="item-card" onclick="viewItemDetail('${item.id}')" style="
                background: #f8f7f5;
                border-radius: 12px;
                padding: 12px;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                border: 1px solid var(--admin-border);
                transition: all 0.2s;
            ">
                <!-- Item Image -->
                <div style="
                    width: 60px;
                    height: 60px;
                    border-radius: 8px;
                    background: #e0e0e0;
                    overflow: hidden;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(item.itemName)}" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-wine-bottle\\' style=\\'font-size: 24px; color: #999;\\'></i>'">` : '<i class="fas fa-wine-bottle" style="font-size: 24px; color: #999;"></i>'}
                </div>
                
                <!-- Item Details -->
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: var(--admin-text); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${escapeHtml(item.itemName)}
                    </div>
                    ${item.itemCategory ? `<div style="font-size: 11px; color: var(--admin-muted);">Category: ${escapeHtml(item.itemCategory)}</div>` : ''}
                    <div style="display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap;">
                        <span style="
                            background: ${status.color}20;
                            color: ${status.color};
                            padding: 2px 8px;
                            border-radius: 4px;
                            font-size: 10px;
                            font-weight: 600;
                            border: 1px solid ${status.color};
                        ">${status.text}</span>
                        <span style="font-size: 10px; color: var(--admin-muted);">
                            Stock: ${item.currentStock || 0}
                        </span>
                    </div>
                </div>
                
                <!-- Price -->
                <div style="text-align: right; flex-shrink: 0;">
                    <div style="
                        background: rgba(107,13,43,0.1);
                        border-radius: 4px;
                        padding: 2px 8px;
                        font-size: 10px;
                        font-weight: 600;
                        color: var(--admin-primary);
                        text-align: center;
                    ">${itemType.toUpperCase()}</div>
                    <div style="font-weight: 700; color: var(--admin-success); font-size: 14px; margin-top: 4px;">
                        R${formatCurrency(item.unitPrice)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function clearSearch() {
    searchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) {
        clearBtn.style.display = 'none';
    }
    renderDetail();
}

// ========== ACTIONS ==========
function refreshData() {
    fetchWarehouseDetails();
}

function editWarehouse() {
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_management_add_edit.html?id=${warehouseId}`;
    } else {
        showError('Unable to edit: Invalid warehouse ID');
    }
}

function addWineToWarehouse() {
    if (warehouseId && warehouseId !== 'undefined' && warehouseId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_add_wine.html?warehouseId=${warehouseId}`;
    } else {
        showError('Unable to add wine: Invalid warehouse ID');
    }
}

window.viewItemDetail = function(itemId) {
    if (itemId && itemId !== 'undefined' && itemId !== 'null') {
        window.location.href = `/admin/warehouse_management/warehouse_item_detail.html?id=${itemId}`;
    }
};

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchWarehouseDetails();
}