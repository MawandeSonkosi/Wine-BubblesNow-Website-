// Warehouse Item Detail JavaScript - Matches Flutter WarehouseItemDetailScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

let itemData = null;
let wineData = null;
let allWarehouseItems = [];
let isLoading = false;
let isRestocking = false;
let isDeleting = false;
let isAddingAvailable = false;

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

// ========== FETCH ITEM DETAILS ==========
async function fetchItemDetails() {
    if (!itemId) {
        showError('No item ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading item details...</p></div>';
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Fetch all warehouse items to get the specific one
        const response = await fetch(`${API_BASE}/api/warehouse`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Warehouse items response:', data);
        
        let items = [];
        if (data.success && Array.isArray(data.data)) {
            items = data.data;
        } else if (Array.isArray(data)) {
            items = data;
        }
        
        allWarehouseItems = items;
        
        // Find the specific item by ID
        itemData = items.find(item => item.id === itemId);
        
        if (!itemData) {
            throw new Error('Item not found');
        }
        
        console.log('✅ Item found:', itemData.itemName);
        
        // If it's a wine item, fetch the wine details
        if (itemData.itemType === 'wine' && itemData.itemId) {
            await fetchWineDetails(itemData.itemId);
        }
        
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching item:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading item: ${error.message}</p><button class="btn-primary" onclick="fetchItemDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to Warehouses</button></div>`;
        }
    }
}

async function fetchWineDetails(itemId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const numericId = parseInt(itemId);
        
        if (isNaN(numericId)) return;
        
        const response = await fetch(`${API_BASE}/api/wines/${numericId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.data) {
                wineData = data.data;
            } else if (data._id || data.id) {
                wineData = data;
            }
            console.log('🍷 Wine details:', wineData?.name);
        }
    } catch (error) {
        console.error('Error fetching wine:', error);
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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) { 
        return '—';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
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

function showError(message) {
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${escapeHtml(message)}</p><button class="btn-primary" onclick="fetchItemDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='warehouse_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to Warehouses</button></div>`;
    } else {
        alert(message);
    }
}

// ========== CALCULATE AVAILABLE STOCK ==========
function getAvailableStock() {
    if (!itemData || !wineData) return 0;
    
    // Get stock allocated in OTHER warehouses (excluding current)
    const allocatedInOthers = allWarehouseItems
        .filter(item => 
            item.itemId === itemData.itemId && 
            item.warehouseId !== itemData.warehouseId
        )
        .reduce((sum, item) => sum + (item.currentStock || 0), 0);
    
    // Available for this warehouse = Total stock - Allocated in others
    const available = (wineData.stockCount || 0) - allocatedInOthers;
    return available > 0 ? available : 0;
}

function getAllocatedInOthers() {
    if (!itemData) return 0;
    
    const allocated = allWarehouseItems
        .filter(item => 
            item.itemId === itemData.itemId && 
            item.warehouseId !== itemData.warehouseId
        )
        .reduce((sum, item) => sum + (item.currentStock || 0), 0);
    return allocated;
}

// ========== RENDER DETAIL ==========
function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !itemData) return;
    
    const status = getStockStatus(itemData);
    const imageUrl = getImageUrl(itemData.metadata?.imageUrl || wineData?.imageUrl || '');
    const soldUnits = (itemData.initialStock || 0) - (itemData.currentStock || 0);
    const sellThroughRate = itemData.initialStock > 0 ? ((soldUnits / itemData.initialStock) * 100) : 0;
    const availableStock = getAvailableStock();
    const allocatedInOthers = getAllocatedInOthers();
    
    container.innerHTML = `
        <div class="detail-card">
            <!-- Header -->
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-box"></i>
                    ${escapeHtml(itemData.itemName)}
                    <span class="status-badge ${status.class}" style="margin-left: 12px;">${status.text}</span>
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="window.location.href='warehouse_management_detail.html?id=${itemData.warehouseId}'">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button class="btn-icon" onclick="refreshData()">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>
            </div>
            
            <!-- Warehouse Info Card -->
            <div class="detail-section" style="background: rgba(107,13,43,0.08); margin: 0 24px 16px; border-radius: 12px; border: 1px solid rgba(107,13,43,0.1);">
                <div style="display: flex; align-items: center; gap: 12px; padding: 12px;">
                    <div style="background: rgba(107,13,43,0.15); padding: 8px; border-radius: 8px;">
                        <i class="fas fa-warehouse" style="color: var(--admin-primary); font-size: 20px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: var(--admin-text); font-size: 14px;">Warehouse: ${escapeHtml(itemData.warehouseName)}</div>
                        <div style="font-size: 12px; color: var(--admin-muted);">Item ID: ${escapeHtml(itemData.itemId)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Image Section -->
            <div class="detail-section" style="padding-top: 0;">
                <div class="image-container">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${escapeHtml(itemData.itemName)}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-wine-bottle\\'></i><p>${escapeHtml(itemData.itemName)}</p></div>'">` : 
                        `<div class="image-placeholder"><i class="fas fa-wine-bottle"></i><p>${escapeHtml(itemData.itemName)}</p></div>`
                    }
                </div>
                
                <!-- Item Name and Category -->
                <div style="margin-top: 8px;">
                    <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: var(--admin-text); margin: 0;">${escapeHtml(itemData.itemName)}</h2>
                    ${itemData.itemCategory ? `<div style="font-size: 14px; color: var(--admin-muted); margin-top: 4px;">${escapeHtml(itemData.itemCategory)}</div>` : ''}
                </div>
                
                <!-- Action Buttons Row -->
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                    <!-- Stock Status Badge -->
                    <span style="display: inline-flex; align-items: center; gap: 6px; background: ${status.color}15; padding: 6px 14px; border-radius: 20px; border: 1px solid ${status.color};">
                        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${status.color};"></span>
                        <span style="color: ${status.color}; font-weight: 600; font-size: 14px;">${status.text}</span>
                    </span>
                    
                    <!-- Add Available Button -->
                    ${availableStock > 0 ? `
                    <button class="btn-available" onclick="addAvailableStock()" id="addAvailableBtn" style="
                        background: transparent;
                        border: 1px solid var(--admin-success);
                        color: var(--admin-success);
                        padding: 6px 14px;
                        border-radius: 40px;
                        cursor: pointer;
                        font-weight: 600;
                        font-family: 'Montserrat', sans-serif;
                        font-size: 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-inventory-2-outlined"></i>
                        ${isAddingAvailable ? 'Adding...' : `Add Available (${availableStock})`}
                    </button>
                    ` : ''}
                    
                    <!-- Restock Button -->
                    <button class="btn-restock" onclick="showRestockModal()" id="restockBtn" style="
                        background: transparent;
                        border: 1px solid var(--admin-primary);
                        color: var(--admin-primary);
                        padding: 6px 14px;
                        border-radius: 40px;
                        cursor: pointer;
                        font-weight: 600;
                        font-family: 'Montserrat', sans-serif;
                        font-size: 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-plus"></i>
                        ${isRestocking ? 'Restocking...' : 'Restock'}
                    </button>
                    
                    <!-- Remove Button -->
                    <button class="btn-remove" onclick="deleteItem()" id="deleteBtn" style="
                        background: transparent;
                        border: 1px solid var(--admin-error);
                        color: var(--admin-error);
                        padding: 6px 14px;
                        border-radius: 40px;
                        cursor: pointer;
                        font-weight: 600;
                        font-family: 'Montserrat', sans-serif;
                        font-size: 12px;
                        display: inline-flex;
                        align-items: center;
                        gap: 6px;
                        transition: all 0.2s;
                    ">
                        <i class="fas fa-trash-alt"></i>
                        ${isDeleting ? 'Removing...' : 'Remove'}
                    </button>
                </div>
                
                <!-- Available Stock Info -->
                ${availableStock > 0 ? `
                <div style="margin-top: 10px; padding: 8px 12px; background: rgba(46,125,50,0.08); border-radius: 8px; border: 1px solid rgba(46,125,50,0.2); display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-info-circle" style="color: var(--admin-success); font-size: 14px;"></i>
                    <span style="font-size: 13px; color: var(--admin-success);">${availableStock} units available to add from total inventory</span>
                </div>
                ` : ''}
            </div>
            
            <!-- Price and Stock Details -->
            <div class="detail-section">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--admin-border);">
                        <span style="color: var(--admin-muted); font-size: 14px;">Unit Price</span>
                        <span style="font-weight: 700; color: var(--admin-primary); font-size: 16px;">R${formatCurrency(itemData.unitPrice)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--admin-border);">
                        <span style="color: var(--admin-muted); font-size: 14px;">Current Stock</span>
                        <span style="font-weight: 700; color: ${status.color}; font-size: 16px;">${itemData.currentStock || 0} units</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--admin-border);">
                        <span style="color: var(--admin-muted); font-size: 14px;">Initial Stock</span>
                        <span style="font-weight: 700; color: #0288d1; font-size: 16px;">${itemData.initialStock || 0} units</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--admin-border);">
                        <span style="color: var(--admin-muted); font-size: 14px;">Units Sold</span>
                        <span style="font-weight: 700; color: var(--admin-success); font-size: 16px;">${soldUnits} units</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--admin-border);">
                        <span style="color: var(--admin-muted); font-size: 14px;">Sell Through Rate</span>
                        <span style="font-weight: 700; color: ${status.color}; font-size: 16px;">${sellThroughRate.toFixed(1)}%</span>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div style="margin-top: 12px;">
                    <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(sellThroughRate, 100)}%; height: 100%; border-radius: 4px; background: ${sellThroughRate > 70 ? '#2e7d32' : sellThroughRate > 40 ? '#ed6c02' : '#d32f2f'}; transition: width 0.5s ease;"></div>
                    </div>
                    <div style="text-align: center; font-size: 12px; color: var(--admin-muted); margin-top: 4px;">${sellThroughRate.toFixed(1)}% sold</div>
                </div>
            </div>
            
            <!-- Description -->
            ${itemData.itemDescription ? `
            <div class="detail-section" style="border-bottom: none;">
                <h3 class="section-title"><i class="fas fa-align-left"></i> Description</h3>
                <p style="color: var(--admin-muted); font-size: 14px; line-height: 1.6; margin: 0;">${escapeHtml(itemData.itemDescription)}</p>
            </div>
            ` : ''}
        </div>
    `;
}

// ========== ADD AVAILABLE STOCK ==========
async function addAvailableStock() {
    if (isAddingAvailable) return;
    
    const availableStock = getAvailableStock();
    if (availableStock <= 0) {
        showToast('No available stock to add', 'error');
        return;
    }
    
    // Show quantity selection dialog
    const quantity = await showQuantityDialog(
        'Add Available Stock',
        `Add available stock for "${itemData.itemName}"`,
        availableStock,
        'This adds from EXISTING total wine stock (does not increase total stock).'
    );
    
    if (quantity === null || quantity <= 0) return;
    
    isAddingAvailable = true;
    updateButtonStates();
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/${itemData.id}/stock`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                movementType: 'restock',
                quantity: quantity,
                notes: 'Added available stock from total inventory (no total stock increase)'
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to add available stock');
        }
        
        showToast(`Added ${quantity} available units to warehouse!`, 'success');
        await fetchItemDetails();
        
    } catch (error) {
        console.error('Add available stock error:', error);
        showToast('Failed to add available stock: ' + error.message, 'error');
    } finally {
        isAddingAvailable = false;
        updateButtonStates();
    }
}

// ========== RESTOCK MODAL ==========
function showRestockModal() {
    if (!itemData) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="restockModal">
            <div class="modal-content">
                <h3><i class="fas fa-plus-circle" style="color: var(--admin-primary);"></i> Restock Wine</h3>
                <p style="color: var(--admin-muted); margin-bottom: 16px;">
                    Enter the quantity to add to this warehouse.
                </p>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Quantity to add *</label>
                    <input type="number" id="restockQuantity" class="form-input" value="10" min="1" step="1" style="width: 100%; padding: 12px 16px; border: 1px solid var(--admin-border); border-radius: 12px; font-size: 15px;">
                </div>
                
                <div style="margin-bottom: 16px; padding: 10px 14px; background: rgba(107,13,43,0.08); border-radius: 8px; border: 1px solid rgba(107,13,43,0.15);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-info-circle" style="color: var(--admin-primary);"></i>
                        <span style="font-size: 13px; color: var(--admin-primary);">This will INCREASE total wine stock AND add to this warehouse.</span>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn-primary" onclick="restockItem()" id="restockConfirmBtn" style="width: auto; margin: 0;">
                        <i class="fas fa-plus"></i> Restock
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('restockModal');
    if (modal) modal.remove();
}

// ========== SHOW QUANTITY DIALOG ==========
function showQuantityDialog(title, message, maxAvailable, infoText) {
    return new Promise((resolve) => {
        const modalHtml = `
            <div class="modal-overlay" id="quantityModal">
                <div class="modal-content">
                    <h3><i class="fas fa-plus-circle" style="color: var(--admin-success);"></i> ${title}</h3>
                    <p style="color: var(--admin-muted); margin-bottom: 8px;">${escapeHtml(message)}</p>
                    
                    <div style="margin: 12px 0; padding: 12px; background: rgba(46,125,50,0.06); border-radius: 8px; border: 1px solid rgba(46,125,50,0.15);">
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span style="color: var(--admin-muted);">Total Stock:</span>
                            <span style="font-weight: 600;">${wineData?.stockCount || 0} units</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                            <span style="color: var(--admin-muted);">Allocated in Other Warehouses:</span>
                            <span style="font-weight: 600; color: var(--admin-warning);">${getAllocatedInOthers()} units</span>
                        </div>
                        <div style="border-top: 1px solid rgba(0,0,0,0.06); margin: 4px 0; padding-top: 6px; display: flex; justify-content: space-between;">
                            <span style="color: var(--admin-success); font-weight: 600;">Available to Add:</span>
                            <span style="color: var(--admin-success); font-weight: 700; font-size: 16px;">${maxAvailable} units</span>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 12px;">
                        <label style="font-weight: 600; display: block; margin-bottom: 6px;">Quantity to Add</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button class="btn-secondary" onclick="adjustQuantity(-1)" style="width: auto; padding: 8px 16px; margin: 0;">-</button>
                            <input type="number" id="quantityInput" class="form-input" value="${maxAvailable}" min="1" max="${maxAvailable}" step="1" style="text-align: center; width: 100px; padding: 10px;">
                            <button class="btn-secondary" onclick="adjustQuantity(1)" style="width: auto; padding: 8px 16px; margin: 0;">+</button>
                            <button class="btn-secondary" onclick="setMaxQuantity()" style="width: auto; padding: 8px 16px; margin: 0; background: var(--admin-primary); color: white;">All</button>
                        </div>
                    </div>
                    
                    ${infoText ? `
                    <div style="margin-bottom: 12px; padding: 8px 12px; background: rgba(33,150,243,0.08); border-radius: 6px; border: 1px solid rgba(33,150,243,0.15);">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-info-circle" style="color: #1976d2; font-size: 14px;"></i>
                            <span style="font-size: 12px; color: #1976d2;">${infoText}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" onclick="closeQuantityDialog(null)">Cancel</button>
                        <button class="btn-success" onclick="confirmQuantity()" style="width: auto; margin: 0; padding: 10px 24px;">
                            <i class="fas fa-check"></i> Add Stock
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Store resolve function
        window._quantityResolve = resolve;
        window._maxAvailable = maxAvailable;
        
        // Setup quantity input listeners
        const input = document.getElementById('quantityInput');
        if (input) {
            input.addEventListener('change', function() {
                let val = parseInt(this.value) || 0;
                if (val > maxAvailable) {
                    this.value = maxAvailable;
                    showToast(`Only ${maxAvailable} units available`, 'warning');
                }
                if (val < 0) this.value = 0;
            });
        }
    });
}

window.adjustQuantity = function(delta) {
    const input = document.getElementById('quantityInput');
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val += delta;
    if (val < 1) val = 1;
    if (val > window._maxAvailable) val = window._maxAvailable;
    input.value = val;
};

window.setMaxQuantity = function() {
    const input = document.getElementById('quantityInput');
    if (!input) return;
    input.value = window._maxAvailable;
};

window.closeQuantityDialog = function(result) {
    const modal = document.getElementById('quantityModal');
    if (modal) modal.remove();
    if (window._quantityResolve) {
        window._quantityResolve(result);
        window._quantityResolve = null;
    }
};

window.confirmQuantity = function() {
    const input = document.getElementById('quantityInput');
    if (!input) return;
    const quantity = parseInt(input.value) || 0;
    if (quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    if (quantity > window._maxAvailable) {
        showToast(`Only ${window._maxAvailable} units available`, 'error');
        return;
    }
    closeQuantityDialog(quantity);
};

// ========== RESTOCK ITEM ==========
async function restockItem() {
    const quantityInput = document.getElementById('restockQuantity');
    const confirmBtn = document.getElementById('restockConfirmBtn');
    
    if (!quantityInput) return;
    
    const quantity = parseInt(quantityInput.value);
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    
    if (isRestocking) return;
    isRestocking = true;
    if (confirmBtn) confirmBtn.disabled = true;
    updateButtonStates();
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/${itemData.id}/stock`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                movementType: 'restock',
                quantity: quantity,
                notes: 'Restock from warehouse item detail'
            })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to restock');
        }
        
        closeModal();
        showToast(`Added ${quantity} units to stock!`, 'success');
        await fetchItemDetails();
        
    } catch (error) {
        console.error('Restock error:', error);
        showToast('Failed to restock: ' + error.message, 'error');
    } finally {
        isRestocking = false;
        if (confirmBtn) confirmBtn.disabled = false;
        updateButtonStates();
    }
}

// ========== DELETE ITEM ==========
async function deleteItem() {
    if (!itemData) return;
    
    if (!confirm(`⚠️ Remove "${itemData.itemName}" from this warehouse?\n\nThis will remove the wine from this warehouse. The wine will still exist in your inventory.`)) return;
    
    if (isDeleting) return;
    isDeleting = true;
    updateButtonStates();
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/${itemData.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to remove item');
        }
        
        showToast('Item removed from warehouse successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = `warehouse_management_detail.html?id=${itemData.warehouseId}`;
        }, 1500);
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to remove item: ' + error.message, 'error');
        isDeleting = false;
        updateButtonStates();
    }
}

// ========== UPDATE BUTTON STATES ==========
function updateButtonStates() {
    const addBtn = document.getElementById('addAvailableBtn');
    const restockBtn = document.getElementById('restockBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    if (addBtn) {
        addBtn.disabled = isAddingAvailable;
        addBtn.innerHTML = isAddingAvailable ? 'Adding...' : `Add Available (${getAvailableStock()})`;
    }
    if (restockBtn) {
        restockBtn.disabled = isRestocking;
        restockBtn.innerHTML = isRestocking ? 'Restocking...' : 'Restock';
    }
    if (deleteBtn) {
        deleteBtn.disabled = isDeleting;
        deleteBtn.innerHTML = isDeleting ? 'Removing...' : 'Remove';
    }
}

// ========== REFRESH ==========
function refreshData() {
    fetchItemDetails();
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchItemDetails();
}