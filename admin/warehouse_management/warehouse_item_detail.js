// Warehouse Item Detail JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const itemId = urlParams.get('id');

let itemData = null;
let wineData = null;
let isLoading = false;
let isRestocking = false;
let isDeleting = false;

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
        
        // Fetch the specific warehouse item
        const response = await fetch(`${API_BASE}/api/warehouse/${itemId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Item details:', data);
        
        if (data.success && data.data) {
            itemData = data.data;
        } else {
            throw new Error('Invalid response format');
        }
        
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

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(2);
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

// ========== RENDER DETAIL ==========
function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !itemData) return;
    
    const status = getStockStatus(itemData);
    const imageUrl = getImageUrl(itemData.metadata?.imageUrl || wineData?.imageUrl || '');
    const soldUnits = (itemData.initialStock || 0) - (itemData.currentStock || 0);
    const sellThroughRate = itemData.initialStock > 0 ? ((soldUnits / itemData.initialStock) * 100) : 0;
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-box"></i>
                    ${escapeHtml(itemData.itemName)}
                    <span class="status-badge ${status.class}" style="margin-left: 12px;">${status.text}</span>
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="window.location.href='warehouse_management_detail.html?id=${itemData.warehouseId}'">
                        <i class="fas fa-arrow-left"></i> Back to Warehouse
                    </button>
                    <button class="btn-icon" onclick="refreshData()">
                        <i class="fas fa-refresh"></i> Refresh
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="image-container">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${escapeHtml(itemData.itemName)}" onerror="this.parentElement.innerHTML='<div class=\\'image-placeholder\\'><i class=\\'fas fa-wine-bottle\\'></i><p>${escapeHtml(itemData.itemName)}</p></div>'">` : 
                        `<div class="image-placeholder"><i class="fas fa-wine-bottle"></i><p>${escapeHtml(itemData.itemName)}</p></div>`
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-info-circle"></i> Item Information</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${escapeHtml(itemData.itemName)}</div></div>
                    <div class="info-row"><div class="info-label">Type:</div><div class="info-value">${escapeHtml(itemData.itemType || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Category:</div><div class="info-value">${escapeHtml(itemData.itemCategory || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Warehouse:</div><div class="info-value">${escapeHtml(itemData.warehouseName)}</div></div>
                    <div class="info-row"><div class="info-label">Unit Price:</div><div class="info-value"><strong style="color:var(--admin-primary);">R${(itemData.unitPrice || 0).toFixed(2)}</strong></div></div>
                    <div class="info-row"><div class="info-label">Current Stock:</div><div class="info-value"><span style="color:${status.color}; font-weight:600;">${itemData.currentStock || 0} units</span></div></div>
                    <div class="info-row"><div class="info-label">Initial Stock:</div><div class="info-value">${itemData.initialStock || 0} units</div></div>
                    <div class="info-row"><div class="info-label">Reorder Level:</div><div class="info-value">${itemData.reorderLevel || 10} units</div></div>
                    <div class="info-row"><div class="info-label">Units Sold:</div><div class="info-value">${soldUnits} units</div></div>
                    <div class="info-row"><div class="info-label">Sell Through Rate:</div><div class="info-value">${sellThroughRate.toFixed(1)}%</div></div>
                    ${itemData.lastRestockedAt ? `<div class="info-row"><div class="info-label">Last Restocked:</div><div class="info-value">${formatDate(itemData.lastRestockedAt)}</div></div>` : ''}
                    ${itemData.lastSoldAt ? `<div class="info-row"><div class="info-label">Last Sold:</div><div class="info-value">${formatDate(itemData.lastSoldAt)}</div></div>` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-chart-line"></i> Performance</h3>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${itemData.currentStock || 0}</div><div class="stat-label">Current Stock</div></div>
                    <div class="stat-card"><div class="stat-value">${soldUnits}</div><div class="stat-label">Units Sold</div></div>
                    <div class="stat-card"><div class="stat-value">${sellThroughRate.toFixed(1)}%</div><div class="stat-label">Sell Through</div></div>
                    <div class="stat-card"><div class="stat-value">R${((itemData.currentStock || 0) * (itemData.unitPrice || 0)).toFixed(2)}</div><div class="stat-label">Total Value</div></div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(sellThroughRate, 100)}%; background: ${sellThroughRate > 70 ? '#2e7d32' : sellThroughRate > 40 ? '#ed6c02' : '#d32f2f'};"></div>
                </div>
                <div style="text-align: center; font-size: 12px; color: var(--admin-muted); margin-top: 4px;">
                    ${sellThroughRate.toFixed(1)}% sold
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-tools"></i> Actions</h3>
                <div class="action-buttons">
                    <button class="btn-success" onclick="showRestockModal()" id="restockBtn">
                        <i class="fas fa-plus-circle"></i> Restock
                    </button>
                    <button class="btn-secondary" onclick="window.location.href='warehouse_management_detail.html?id=${itemData.warehouseId}'">
                        <i class="fas fa-arrow-left"></i> Back to Warehouse
                    </button>
                    <button class="btn-danger" onclick="deleteItem()" id="deleteBtn">
                        <i class="fas fa-trash-alt"></i> Remove from Warehouse
                    </button>
                </div>
            </div>
            
            ${itemData.stockMovements && itemData.stockMovements.length > 0 ? `
            <div class="detail-section" style="border-bottom: none;">
                <h3 class="section-title"><i class="fas fa-history"></i> Stock Movements</h3>
                <div class="movement-list">
                    ${itemData.stockMovements.slice().reverse().map(movement => {
                        const typeClass = movement.movementType || 'adjustment';
                        const typeLabel = movement.movementType === 'restock' ? 'Restock' :
                                         movement.movementType === 'sale' ? 'Sale' :
                                         movement.movementType === 'adjustment' ? 'Adjustment' :
                                         movement.movementType === 'return' ? 'Return' : 'Damage';
                        const quantityColor = movement.quantity > 0 ? '#2e7d32' : '#d32f2f';
                        return `
                            <div class="movement-item">
                                <div>
                                    <span class="movement-type ${typeClass}">${typeLabel}</span>
                                    <span style="color: var(--admin-muted); margin-left: 8px;">${formatDate(movement.createdAt)}</span>
                                </div>
                                <div>
                                    <span style="color: ${quantityColor}; font-weight: 600;">
                                        ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
                                    </span>
                                    <span style="color: var(--admin-muted); margin-left: 8px;">
                                        ${movement.previousStock} → ${movement.newStock}
                                    </span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;
}

// ========== RESTOCK MODAL ==========
function showRestockModal() {
    if (!itemData) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="restockModal">
            <div class="modal-content">
                <h3><i class="fas fa-plus-circle" style="color: var(--admin-success);"></i> Restock Item</h3>
                <p style="color: var(--admin-muted); margin-bottom: 16px;">
                    Add stock to "${escapeHtml(itemData.itemName)}"
                </p>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Current Stock: <span style="color: var(--admin-primary); font-weight: 700;">${itemData.currentStock} units</span></label>
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Quantity to Add *</label>
                    <input type="number" id="restockQuantity" class="form-input" value="10" min="1" step="1" style="width: 100%; padding: 12px 16px; border: 1px solid var(--admin-border); border-radius: 12px; font-size: 15px;">
                    <small style="color: var(--admin-muted);">This will increase both warehouse stock and total inventory.</small>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="font-weight: 600; display: block; margin-bottom: 8px;">Notes (Optional)</label>
                    <input type="text" id="restockNotes" class="form-input" placeholder="e.g., Monthly restock" style="width: 100%; padding: 12px 16px; border: 1px solid var(--admin-border); border-radius: 12px; font-size: 15px;">
                </div>
                
                <div class="modal-actions">
                    <button class="btn-secondary" onclick="closeModal()">Cancel</button>
                    <button class="btn-success" onclick="restockItem()" id="restockConfirmBtn">
                        <i class="fas fa-plus"></i> Add Stock
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

// ========== RESTOCK ITEM ==========
async function restockItem() {
    const quantityInput = document.getElementById('restockQuantity');
    const notesInput = document.getElementById('restockNotes');
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
                notes: notesInput?.value || 'Restock from warehouse item detail'
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
    }
}

// ========== DELETE ITEM ==========
async function deleteItem() {
    if (!itemData) return;
    
    if (!confirm(`⚠️ Remove "${itemData.itemName}" from this warehouse?\n\nThis will remove the wine from this warehouse. The wine will still exist in your inventory.`)) return;
    
    if (isDeleting) return;
    isDeleting = true;
    
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
    } finally {
        isDeleting = false;
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