// Restaurant Menu Management JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('id');

let restaurantData = null;
let menuItems = [];
let isLoading = false;

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

// ========== FETCH RESTAURANT AND MENU ==========
async function fetchRestaurantAndMenu() {
    if (!restaurantId) {
        showError('No restaurant ID provided');
        return;
    }
    
    const container = document.getElementById('menuContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading restaurant menu...</p></div>';
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.id || data._id) {
            restaurantData = data;
        } else if (data.data) {
            restaurantData = data.data;
        } else {
            throw new Error('Invalid response format');
        }
        
        menuItems = restaurantData.menuItems || [];
        
        renderMenuScreen();
        
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading restaurant: ${error.message}</p><button class="btn-primary" onclick="fetchRestaurantAndMenu()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='restaurant_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
        }
    }
}

function renderMenuScreen() {
    const container = document.getElementById('menuContent');
    if (!container || !restaurantData) return;
    
    const imageUrl = getImageUrl(restaurantData.imageUrl);
    
    container.innerHTML = `
        <div class="page-header">
            <div style="display: flex; align-items: center; gap: 20px;">
                <a href="restaurant_management_detail.html?id=${restaurantId}" style="color: var(--admin-primary); text-decoration: none;"><i class="fas fa-arrow-left"></i> Back to Restaurant</a>
                <h1><i class="fas fa-utensils"></i> ${escapeHtml(restaurantData.name)} - Menu</h1>
            </div>
            <button class="btn-primary" onclick="showAddMenuItemModal()">
                <i class="fas fa-plus"></i> Add Menu Item
            </button>
        </div>
        
        <div class="restaurant-info-card">
            <div class="restaurant-avatar">
                ${restaurantData.imageUrl ? 
                    `<img src="${imageUrl}" alt="${escapeHtml(restaurantData.name)}" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-utensils\\' style=\\'font-size: 30px; color: #999;\\'></i>'">` : 
                    `<i class="fas fa-utensils" style="font-size: 30px; color: #999;"></i>`
                }
            </div>
            <div class="restaurant-info">
                <h2>${escapeHtml(restaurantData.name)}</h2>
                <p><i class="fas fa-cutlery"></i> ${escapeHtml(restaurantData.cuisineType)}</p>
                <p><i class="fas fa-clock"></i> ${escapeHtml(restaurantData.openingHours)} - ${escapeHtml(restaurantData.closingHours)}</p>
            </div>
        </div>
        
        <div id="menuGrid" class="menu-grid">
            ${renderMenuItems()}
        </div>
    `;
}

function renderMenuItems() {
    if (menuItems.length === 0) {
        return '<div class="empty-state" style="grid-column: 1/-1;"><i class="fas fa-utensils" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i><p>No menu items yet</p><button class="btn-primary" onclick="showAddMenuItemModal()" style="margin-top:16px;"><i class="fas fa-plus"></i> Add First Menu Item</button></div>';
    }
    
    return menuItems.map(item => {
        const itemImageUrl = getImageUrl(item.imageUrl);
        const statusClass = item.isAvailable ? 'status-available' : 'status-unavailable';
        const statusText = item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE';
        
        return `
            <div class="menu-card">
                <div class="menu-image">
                    ${item.imageUrl && item.imageUrl !== 'assets/dine_with_me/food_placeholder.png' ? 
                        `<img src="${itemImageUrl}" alt="${escapeHtml(item.name)}" onerror="this.parentElement.innerHTML='<div class=\\'menu-image-placeholder\\'><i class=\\'fas fa-utensils\\'></i><span>${escapeHtml(item.name)}</span></div>'">` : 
                        `<div class="menu-image-placeholder"><i class="fas fa-utensils"></i><span>${escapeHtml(item.name)}</span></div>`
                    }
                </div>
                <div class="menu-body">
                    <div class="menu-name">${escapeHtml(item.name)}</div>
                    <div class="menu-description">${escapeHtml(item.description || 'No description')}</div>
                    <div class="menu-price">R${(item.price || 0).toFixed(2)}</div>
                    <div>
                        <span class="status-badge ${statusClass}">
                            <i class="fas ${item.isAvailable ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${statusText}
                        </span>
                    </div>
                </div>
                <div class="menu-actions">
                    <button class="icon-btn" onclick="toggleMenuItemStatus(${item.id}, ${!item.isAvailable})">
                        <i class="fas ${item.isAvailable ? 'fa-toggle-off' : 'fa-toggle-on'}"></i>
                        ${item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                    </button>
                    <button class="icon-btn" onclick="showEditMenuItemModal(${item.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="icon-btn danger" onclick="deleteMenuItem(${item.id}, '${escapeHtml(item.name)}')">
                        <i class="fas fa-trash-alt"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    return '/assets/dine_with_me/' + imageUrl;
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
    showToast(message, 'error');
}

// ========== MENU ITEM MODAL ==========
function showAddMenuItemModal() {
    showMenuItemModal(null);
}

function showEditMenuItemModal(itemId) {
    const item = menuItems.find(i => i.id == itemId);
    if (item) {
        showMenuItemModal(item);
    }
}

function showMenuItemModal(menuItem) {
    const isEditing = menuItem !== null;
    const modalHtml = `
        <div class="modal-overlay" id="menuItemModal">
            <div class="modal-content">
                <h3><i class="fas fa-utensils"></i> ${isEditing ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                <form id="menuItemForm">
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-tag"></i> Item Name *</label>
                        <input type="text" id="itemName" class="form-input" value="${isEditing ? escapeHtml(menuItem.name) : ''}" placeholder="e.g., Margherita Pizza">
                    </div>
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-align-left"></i> Description</label>
                        <textarea id="itemDescription" class="form-textarea" rows="3" placeholder="Item description">${isEditing ? escapeHtml(menuItem.description || '') : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-tag"></i> Price (R) *</label>
                        <input type="number" id="itemPrice" class="form-input" step="0.01" value="${isEditing ? menuItem.price : ''}" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-image"></i> Image URL</label>
                        <input type="text" id="itemImageUrl" class="form-input" value="${isEditing ? escapeHtml(menuItem.imageUrl || '') : ''}" placeholder="assets/dine_with_me/food_image.png">
                    </div>
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-check-circle"></i> Status</label>
                        <select id="itemIsAvailable" class="form-input">
                            <option value="true" ${isEditing && menuItem.isAvailable ? 'selected' : ''}>Available</option>
                            <option value="false" ${isEditing && !menuItem.isAvailable ? 'selected' : ''}>Unavailable</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        <button type="button" class="btn-secondary" onclick="closeModal()" style="flex: 1;">Cancel</button>
                        <button type="submit" class="btn-primary" style="flex: 1;">${isEditing ? 'Update' : 'Add'} Item</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const form = document.getElementById('menuItemForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('itemName').value.trim();
            const description = document.getElementById('itemDescription').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value);
            const imageUrl = document.getElementById('itemImageUrl').value.trim() || 'assets/dine_with_me/food_placeholder.png';
            const isAvailable = document.getElementById('itemIsAvailable').value === 'true';
            
            if (!name) {
                showError('Item name is required');
                return;
            }
            if (isNaN(price) || price <= 0) {
                showError('Valid price is required');
                return;
            }
            
            closeModal();
            
            if (isEditing) {
                await updateMenuItem(menuItem.id, name, description, price, imageUrl, isAvailable);
            } else {
                await addMenuItem(name, description, price, imageUrl, isAvailable);
            }
        });
    }
}

function closeModal() {
    const modal = document.getElementById('menuItemModal');
    if (modal) modal.remove();
}

// ========== API CALLS ==========
async function addMenuItem(name, description, price, imageUrl, isAvailable) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const newItem = {
            id: Date.now(),
            restaurantId: parseInt(restaurantId),
            name: name,
            description: description,
            price: price,
            imageUrl: imageUrl,
            isAvailable: isAvailable
        };
        
        const updatedMenuItems = [...menuItems, newItem];
        
        // Update restaurant with new menu
        const updatedRestaurant = {
            ...restaurantData,
            menuItems: updatedMenuItems
        };
        
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedRestaurant)
        });
        
        if (!response.ok) throw new Error('Failed to add menu item');
        
        menuItems = updatedMenuItems;
        renderMenuScreen();
        showToast('Menu item added successfully!', 'success');
        
    } catch (error) {
        console.error('Error adding menu item:', error);
        showError('Failed to add menu item');
    } finally {
        isLoading = false;
    }
}

async function updateMenuItem(id, name, description, price, imageUrl, isAvailable) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        const updatedMenuItems = menuItems.map(item => 
            item.id == id ? { ...item, name, description, price, imageUrl, isAvailable } : item
        );
        
        const updatedRestaurant = {
            ...restaurantData,
            menuItems: updatedMenuItems
        };
        
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedRestaurant)
        });
        
        if (!response.ok) throw new Error('Failed to update menu item');
        
        menuItems = updatedMenuItems;
        renderMenuScreen();
        showToast('Menu item updated successfully!', 'success');
        
    } catch (error) {
        console.error('Error updating menu item:', error);
        showError('Failed to update menu item');
    } finally {
        isLoading = false;
    }
}

async function toggleMenuItemStatus(itemId, newStatus) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        const updatedMenuItems = menuItems.map(item => 
            item.id == itemId ? { ...item, isAvailable: newStatus } : item
        );
        
        const updatedRestaurant = {
            ...restaurantData,
            menuItems: updatedMenuItems
        };
        
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedRestaurant)
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        menuItems = updatedMenuItems;
        renderMenuScreen();
        showToast(`Item ${newStatus ? 'marked available' : 'marked unavailable'}`, 'success');
        
    } catch (error) {
        console.error('Error toggling status:', error);
        showError('Failed to update status');
    } finally {
        isLoading = false;
    }
}

window.deleteMenuItem = async function(itemId, itemName) {
    if (confirm(`Delete "${itemName}" from the menu?\n\nThis action cannot be undone.`)) {
        if (isLoading) return;
        isLoading = true;
        
        try {
            const token = localStorage.getItem('wineBubbles_token');
            
            const updatedMenuItems = menuItems.filter(item => item.id != itemId);
            
            const updatedRestaurant = {
                ...restaurantData,
                menuItems: updatedMenuItems
            };
            
            const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedRestaurant)
            });
            
            if (!response.ok) throw new Error('Failed to delete menu item');
            
            menuItems = updatedMenuItems;
            renderMenuScreen();
            showToast('Menu item deleted successfully!', 'success');
            
        } catch (error) {
            console.error('Error deleting menu item:', error);
            showError('Failed to delete menu item');
        } finally {
            isLoading = false;
        }
    }
};

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchRestaurantAndMenu();
}