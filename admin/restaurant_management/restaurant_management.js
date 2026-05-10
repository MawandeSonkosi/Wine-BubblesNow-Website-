// Restaurant Management JavaScript

const API_BASE = window.location.origin;
let allRestaurants = [];
let searchQuery = '';
let statusFilter = 'all';
let cuisineFilter = 'all';
let uniqueCuisines = [];

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

// ========== FETCH RESTAURANTS ==========
async function fetchRestaurants() {
    const container = document.getElementById('restaurantContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading restaurants...</p></div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/dine-with-me?all=true`, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Restaurants response:', data);
        
        if (Array.isArray(data)) {
            allRestaurants = data;
        } else if (data.restaurants && Array.isArray(data.restaurants)) {
            allRestaurants = data.restaurants;
        } else {
            allRestaurants = [];
        }
        
        // Extract unique cuisines for filter
        uniqueCuisines = [...new Set(allRestaurants.map(r => r.cuisineType).filter(Boolean))];
        
        // Populate cuisine filter dropdown
        const cuisineFilterEl = document.getElementById('cuisineFilter');
        if (cuisineFilterEl && uniqueCuisines.length > 0) {
            cuisineFilterEl.innerHTML = '<option value="all">All Cuisines</option>' + 
                uniqueCuisines.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
        }
        
        console.log(`✅ Loaded ${allRestaurants.length} restaurants`);
        renderRestaurants();
        renderStats();
        
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading restaurants: ${error.message}</p><button class="btn-primary" onclick="fetchRestaurants()" style="margin-top:16px;">Retry</button></div>`;
    }
}

function renderStats() {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    
    const total = allRestaurants.length;
    const active = allRestaurants.filter(r => r.isActive === true).length;
    const inactive = total - active;
    
    container.innerHTML = `
        <div class="stat-box"><i class="fas fa-utensils"></i><div class="stat-box-info"><div class="stat-box-value">${total}</div><div class="stat-box-label">Total Restaurants</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle" style="color:#2e7d32;"></i><div class="stat-box-info"><div class="stat-box-value">${active}</div><div class="stat-box-label">Active</div></div></div>
        <div class="stat-box"><i class="fas fa-ban" style="color:#d32f2f;"></i><div class="stat-box-info"><div class="stat-box-value">${inactive}</div><div class="stat-box-label">Inactive</div></div></div>
    `;
}

function getRestaurantId(restaurant) {
    return restaurant.id || restaurant._id;
}

function filterRestaurants() {
    let filtered = [...allRestaurants];
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r => 
            (r.name && r.name.toLowerCase().includes(q)) ||
            (r.cuisineType && r.cuisineType.toLowerCase().includes(q))
        );
    }
    
    if (statusFilter === 'active') {
        filtered = filtered.filter(r => r.isActive === true);
    } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(r => r.isActive === false);
    }
    
    if (cuisineFilter !== 'all') {
        filtered = filtered.filter(r => r.cuisineType === cuisineFilter);
    }
    
    return filtered;
}

function renderRestaurants() {
    const container = document.getElementById('restaurantContainer');
    if (!container) return;
    
    const filtered = filterRestaurants();
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-utensils" style="font-size:48px; margin-bottom:16px;"></i><p>No restaurants found${searchQuery ? ' matching your search' : ''}</p><button class="btn-primary" onclick="window.location.href='restaurant_management_add_edit.html'"><i class="fas fa-plus"></i> Create First Restaurant</button></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="restaurant-grid">
            ${filtered.map(restaurant => {
                const restaurantId = getRestaurantId(restaurant);
                const imageUrl = getImageUrl(restaurant.imageUrl);
                
                return `
                    <div class="restaurant-card" onclick="viewRestaurantDetail('${restaurantId}')">
                        <div class="restaurant-image">
                            ${restaurant.imageUrl ? 
                                `<img src="${imageUrl}" alt="${escapeHtml(restaurant.name)}" onerror="this.parentElement.innerHTML='<div class=\\'restaurant-image-placeholder\\'><i class=\\'fas fa-utensils\\'></i></div>'">` : 
                                `<div class="restaurant-image-placeholder"><i class="fas fa-utensils"></i></div>`
                            }
                        </div>
                        <div class="restaurant-header">
                            <span class="restaurant-name">${escapeHtml(restaurant.name)}</span>
                            <span class="badge ${restaurant.isActive ? 'badge-active' : 'badge-inactive'}">${restaurant.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                        <div class="restaurant-body">
                            <div class="restaurant-cuisine">${escapeHtml(restaurant.cuisineType || 'Various')}</div>
                            <div class="restaurant-address">
                                <i class="fas fa-map-marker-alt"></i> ${escapeHtml(restaurant.address || 'No address')}
                            </div>
                            <div class="restaurant-hours">
                                <i class="fas fa-clock"></i> ${escapeHtml(restaurant.openingHours || '09:00')} - ${escapeHtml(restaurant.closingHours || '22:00')}
                            </div>
                        </div>
                        <div class="restaurant-actions" onclick="event.stopPropagation()">
                            <button class="icon-btn" onclick="editRestaurant('${restaurantId}')" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                            <button class="icon-btn" onclick="viewRestaurantDetail('${restaurantId}')" title="View Details"><i class="fas fa-eye"></i> View</button>
                            <button class="icon-btn" onclick="viewMenuItems('${restaurantId}')" title="Menu"><i class="fas fa-utensils"></i> Menu</button>
                            <button class="icon-btn danger" onclick="deleteRestaurantPrompt('${restaurantId}', '${escapeHtml(restaurant.name)}')" title="Delete"><i class="fas fa-trash-alt"></i> Delete</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = gridHtml;
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    if (imageUrl.indexOf('assets/') === 0) return '/' + imageUrl;
    return '/assets/images/' + imageUrl;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== RESTAURANT ACTIONS ==========
window.viewRestaurantDetail = function(restaurantId) {
    console.log('👁️ Viewing restaurant details for ID:', restaurantId);
    if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
        window.location.href = `/admin/restaurant_management/restaurant_management_detail.html?id=${restaurantId}`;
    } else {
        showToast('Unable to view details: Invalid restaurant ID', 'error');
    }
};

window.editRestaurant = function(restaurantId) {
    console.log('✏️ Editing restaurant with ID:', restaurantId);
    if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
        window.location.href = `/admin/restaurant_management/restaurant_management_add_edit.html?id=${restaurantId}`;
    } else {
        showToast('Unable to edit: Invalid restaurant ID', 'error');
    }
};

window.viewMenuItems = function(restaurantId) {
    console.log('🍽️ Viewing menu for restaurant ID:', restaurantId);
    if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
        window.location.href = `/admin/restaurant_management/restaurant_menu_screen.html?id=${restaurantId}`;
    } else {
        showToast('Unable to view menu: Invalid restaurant ID', 'error');
    }
};

window.deleteRestaurantPrompt = function(restaurantId, restaurantName) {
    if (confirm(`⚠️ Permanently delete "${restaurantName}"?\n\nThis action cannot be undone.\nThis will also remove all menu items for this restaurant.`)) {
        deleteRestaurant(restaurantId);
    }
};

async function deleteRestaurant(restaurantId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/dine-with-me/${restaurantId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to delete');
        }
        
        showToast('Restaurant deleted successfully', 'success');
        fetchRestaurants();
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete restaurant: ' + error.message, 'error');
    }
}

// ========== FILTER EVENT LISTENERS ==========
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderRestaurants();
        });
    }
    
    const statusFilterEl = document.getElementById('statusFilter');
    if (statusFilterEl) {
        statusFilterEl.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            renderRestaurants();
        });
    }
    
    const cuisineFilterEl = document.getElementById('cuisineFilter');
    if (cuisineFilterEl) {
        cuisineFilterEl.addEventListener('change', (e) => {
            cuisineFilter = e.target.value;
            renderRestaurants();
        });
    }
    
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchQuery = '';
            statusFilter = 'all';
            cuisineFilter = 'all';
            
            if (searchInput) searchInput.value = '';
            if (statusFilterEl) statusFilterEl.value = 'all';
            if (cuisineFilterEl) cuisineFilterEl.value = 'all';
            
            renderRestaurants();
        });
    }
}

// ========== INITIALIZE ==========
document.getElementById('addRestaurantBtn')?.addEventListener('click', () => {
    window.location.href = '/admin/restaurant_management/restaurant_management_add_edit.html';
});

if (checkAuth()) {
    setupFilters();
    fetchRestaurants();
}