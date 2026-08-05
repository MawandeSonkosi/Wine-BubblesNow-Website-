// Add Wine to Warehouse JavaScript - Matches Flutter AddWineToWarehouseScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const warehouseId = urlParams.get('warehouseId');

let wines = [];
let warehouseItems = [];
let selectedWine = null;
let warehouseName = '';
let maxAvailable = 0;
let quantity = 0;

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
                
                // Update warehouse info
                const warehouseInfo = document.getElementById('warehouseInfo');
                if (warehouseInfo) {
                    warehouseInfo.innerHTML = `
                        <i class="fas fa-warehouse" style="color: var(--admin-accent);"></i>
                        <span>Warehouse: <strong>${escapeHtml(warehouse.name)}</strong></span>
                        <span style="margin-left: auto; font-size: 12px; color: var(--admin-muted);" id="wineCount">Loading wines...</span>
                    `;
                }
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
            console.log(`✅ Loaded ${wines.length} active wines`);
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
            console.log(`✅ Loaded ${warehouseItems.length} warehouse items`);
        }
        
        // Show wines grid
        renderWineGrid();
        
        // Update wine count
        const wineCount = document.getElementById('wineCount');
        if (wineCount) {
            const existingIds = warehouseItems
                .filter(item => item.warehouseId === warehouseId)
                .map(item => item.itemId);
            const availableCount = wines.filter(w => !existingIds.includes(w.id.toString())).length;
            wineCount.textContent = `${availableCount} available`;
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load data: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== RENDER WINE GRID ==========
function renderWineGrid() {
    const gridContainer = document.getElementById('wineGridContainer');
    if (!gridContainer) return;
    
    // Get wine IDs already in this warehouse
    const existingWineIds = warehouseItems
        .filter(item => item.warehouseId === warehouseId)
        .map(item => item.itemId);
    
    // Filter out wines already in this warehouse
    const availableWines = wines.filter(w => !existingWineIds.includes(w.id.toString()));
    
    if (availableWines.length === 0) {
        gridContainer.innerHTML = `
            <div class="empty-state" style="padding: 40px; text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 48px; color: var(--admin-success); margin-bottom: 16px;"></i>
                <p style="font-size: 16px; font-weight: bold; color: var(--admin-text);">All active wines are already in this warehouse</p>
                <p style="font-size: 13px; color: var(--admin-muted);">You can add more wines by creating them in the Wine Management section first.</p>
                <button class="btn-secondary" onclick="window.location.href='warehouse_management_detail.html?id=${warehouseId}'" style="margin-top: 16px; width: auto; padding: 10px 24px;">
                    <i class="fas fa-arrow-left"></i> Back to Warehouse
                </button>
            </div>
        `;
        return;
    }
    
    // Calculate available stock for each wine
    const winesWithStock = availableWines.map(wine => {
        const allocatedInOthers = warehouseItems
            .filter(item => 
                item.itemId === wine.id.toString() && 
                item.warehouseId !== warehouseId
            )
            .reduce((sum, item) => sum + (item.currentStock || 0), 0);
        
        const available = (wine.stockCount || 0) - allocatedInOthers;
        return {
            ...wine,
            availableStock: available < 0 ? 0 : available,
            allocatedInOthers: allocatedInOthers
        };
    });
    
    gridContainer.innerHTML = `
        <div class="wine-grid">
            ${winesWithStock.map(wine => {
                const isSelected = selectedWine && selectedWine.id === wine.id;
                const stockClass = wine.availableStock > 0 ? 'in-stock' : 'out-of-stock';
                const stockText = wine.availableStock > 0 ? `${wine.availableStock} avail` : '0 avail';
                
                return `
                    <div class="wine-card ${isSelected ? 'selected' : ''}" 
                         onclick="selectWine(${wine.id})"
                         data-wine-id="${wine.id}">
                        <div class="wine-card-image">
                            <img src="${getImageUrl(wine.imageUrl || wine.bannerImageUrl)}" 
                                 alt="${escapeHtml(wine.name)}" 
                                 onerror="this.parentElement.innerHTML='<i class=\\'fas fa-wine-bottle\\' style=\\'font-size: 40px; color: #999;\\'></i>'">
                            ${isSelected ? '<div class="selected-overlay"><i class="fas fa-check-circle"></i> SELECTED</div>' : ''}
                        </div>
                        <div class="wine-card-info">
                            <div class="wine-card-name">${escapeHtml(wine.name)}</div>
                            <div class="wine-card-category">${escapeHtml(wine.category || wine.type || '')}</div>
                            <div class="wine-card-bottom">
                                <span class="wine-card-price">R${(wine.price || 0).toFixed(2)}</span>
                                <span class="wine-card-stock ${stockClass}">${stockText}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ========== SELECT WINE ==========
function selectWine(wineId) {
    const wine = wines.find(w => w.id === wineId);
    if (!wine) return;
    
    // Calculate available stock
    const allocatedInOthers = warehouseItems
        .filter(item => 
            item.itemId === wine.id.toString() && 
            item.warehouseId !== warehouseId
        )
        .reduce((sum, item) => sum + (item.currentStock || 0), 0);
    
    const available = (wine.stockCount || 0) - allocatedInOthers;
    maxAvailable = available < 0 ? 0 : available;
    
    selectedWine = wine;
    quantity = 0;
    
    // Update UI
    renderWineGrid();
    updateSelectedWineInfo();
    updateQuantityDisplay();
    
    // Show selected section
    const selectedSection = document.getElementById('selectedSection');
    if (selectedSection) {
        selectedSection.style.display = 'block';
        selectedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// ========== UPDATE SELECTED WINE INFO ==========
function updateSelectedWineInfo() {
    if (!selectedWine) return;
    
    const allocatedInOthers = warehouseItems
        .filter(item => 
            item.itemId === selectedWine.id.toString() && 
            item.warehouseId !== warehouseId
        )
        .reduce((sum, item) => sum + (item.currentStock || 0), 0);
    
    document.getElementById('selectedWineName').textContent = selectedWine.name;
    document.getElementById('selectedWineCategory').textContent = `${selectedWine.category || selectedWine.type || ''} • R${(selectedWine.price || 0).toFixed(2)}`;
    document.getElementById('selectedWineAvailable').textContent = `${maxAvailable} units`;
    document.getElementById('selectedWineAvailable').style.color = maxAvailable > 0 ? 'var(--admin-success)' : 'var(--admin-warning)';
    document.getElementById('selectedWineTotalStock').textContent = `${selectedWine.stockCount || 0} units`;
    document.getElementById('selectedWineAllocated').textContent = `${allocatedInOthers} units`;
    
    // Update image
    const img = document.getElementById('selectedWineImage');
    if (img) {
        const url = getImageUrl(selectedWine.imageUrl || selectedWine.bannerImageUrl);
        img.src = url;
        img.onerror = () => {
            img.style.display = 'none';
            const placeholder = document.getElementById('selectedWineImagePlaceholder');
            if (placeholder) placeholder.style.display = 'flex';
        };
    }
}

// ========== UPDATE QUANTITY DISPLAY ==========
function updateQuantityDisplay() {
    const quantityDisplay = document.getElementById('quantityDisplay');
    if (quantityDisplay) {
        quantityDisplay.textContent = quantity;
    }
    
    const decrementBtn = document.getElementById('decrementBtn');
    if (decrementBtn) {
        decrementBtn.disabled = quantity <= 0;
    }
    
    const incrementBtn = document.getElementById('incrementBtn');
    if (incrementBtn) {
        incrementBtn.disabled = quantity >= maxAvailable;
    }
}

// ========== QUANTITY CONTROLS ==========
function setupQuantityControls() {
    const decrementBtn = document.getElementById('decrementBtn');
    const incrementBtn = document.getElementById('incrementBtn');
    const useAllBtn = document.getElementById('useAllBtn');
    
    if (decrementBtn) {
        decrementBtn.addEventListener('click', () => {
            if (quantity > 0) {
                quantity--;
                updateQuantityDisplay();
            }
        });
    }
    
    if (incrementBtn) {
        incrementBtn.addEventListener('click', () => {
            if (quantity < maxAvailable) {
                quantity++;
                updateQuantityDisplay();
            } else {
                showToast(`Only ${maxAvailable} units available`, 'warning');
            }
        });
    }
    
    if (useAllBtn) {
        useAllBtn.addEventListener('click', () => {
            quantity = maxAvailable;
            updateQuantityDisplay();
        });
    }
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '/assets/images/default_wine.png';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    if (imageUrl.indexOf('assets/') === 0) return '/' + imageUrl;
    return '/assets/images/' + imageUrl;
}

// ========== VALIDATION ==========
function validateForm() {
    if (!selectedWine) {
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
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/warehouse/add-wine`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                wineId: selectedWine.id.toString(),
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

if (checkAuth()) {
    setupQuantityControls();
    loadData();
}