// Restaurant Management Detail JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const restaurantId = urlParams.get('id');

let restaurantData = null;

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

async function fetchRestaurantDetails() {
    if (!restaurantId) {
        showError('No restaurant ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading restaurant details...</p></div>';
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
        
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching restaurant:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading restaurant: ${error.message}</p><button class="btn-primary" onclick="fetchRestaurantDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='restaurant_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
        }
    }
}

function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !restaurantData) return;
    
    const imageUrl = getImageUrl(restaurantData.imageUrl);
    const bannerUrl = getImageUrl(restaurantData.bannerImageUrl);
    const statusClass = restaurantData.isActive ? 'badge-active' : 'badge-inactive';
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-utensils"></i>
                    ${escapeHtml(restaurantData.name)}
                    <span class="badge ${statusClass}" style="margin-left: 12px;">${restaurantData.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="window.location.href='restaurant_management_screen.html'">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button class="btn-icon" onclick="editRestaurant()">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-icon" onclick="viewMenuItems()">
                        <i class="fas fa-utensils"></i> Manage Menu
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="image-container">
                    ${restaurantData.imageUrl ? 
                        `<img src="${imageUrl}" alt="${escapeHtml(restaurantData.name)}" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-utensils\'></i><p>Failed to load image</p></div>'">` : 
                        `<div class="image-placeholder"><i class="fas fa-utensils"></i><p>No image</p></div>`
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-info-circle"></i> Restaurant Information</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${escapeHtml(restaurantData.name)}</div></div>
                    <div class="info-row"><div class="info-label">Cuisine:</div><div class="info-value">${escapeHtml(restaurantData.cuisineType)}</div></div>
                    <div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(restaurantData.address)}</div></div>
                    <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(restaurantData.phone)}</div></div>
                    <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(restaurantData.email)}</div></div>
                    <div class="info-row"><div class="info-label">Hours:</div><div class="info-value">${escapeHtml(restaurantData.openingHours || '09:00')} - ${escapeHtml(restaurantData.closingHours || '22:00')}</div></div>
                    <div class="info-row"><div class="info-label">Description:</div><div class="info-value">${escapeHtml(restaurantData.description)}</div></div>
                    ${restaurantData.createdAt ? `<div class="info-row"><div class="info-label">Created:</div><div class="info-value">${formatDate(restaurantData.createdAt)}</div></div>` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-utensils"></i> Menu Items (${restaurantData.menuItems?.length || 0})</h3>
                <div id="menuItemsContainer">
                    ${renderMenuItems()}
                </div>
            </div>
            
            <div class="detail-section" style="display: flex; gap: 16px; justify-content: flex-end; border-bottom: none;">
                <button class="btn-secondary" onclick="window.location.href='restaurant_management_screen.html'"><i class="fas fa-arrow-left"></i> Back to List</button>
                <button class="btn-primary" onclick="viewMenuItems()"><i class="fas fa-utensils"></i> Manage Menu</button>
                <button class="btn-primary" onclick="editRestaurant()"><i class="fas fa-edit"></i> Edit Restaurant</button>
            </div>
        </div>
    `;
}

function renderMenuItems() {
    const menuItems = restaurantData.menuItems || [];
    
    if (menuItems.length === 0) {
        return '<div class="empty-state" style="padding: 40px;"><i class="fas fa-utensils" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i><p>No menu items yet</p><button class="btn-primary" onclick="viewMenuItems()" style="margin-top:16px;"><i class="fas fa-plus"></i> Add Menu Items</button></div>';
    }
    
    return `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid var(--admin-border);">
                    <th style="text-align: left; padding: 8px; color: var(--admin-muted);">Item</th>
                    <th style="text-align: left; padding: 8px; color: var(--admin-muted);">Description</th>
                    <th style="text-align: right; padding: 8px; color: var(--admin-muted);">Price</th>
                    <th style="text-align: center; padding: 8px; color: var(--admin-muted);">Status</th>
                </table>
            </thead>
            <tbody>
                ${menuItems.map(item => `
                    <tr style="border-bottom: 1px solid var(--admin-border);">
                        <td style="padding: 12px 8px;"><strong>${escapeHtml(item.name)}</strong></td>
                        <td style="padding: 12px 8px;">${escapeHtml(item.description?.substring(0, 50) || '')}${item.description?.length > 50 ? '...' : ''}</td>
                        <td style="text-align: right; padding: 12px 8px;">R${(item.price || 0).toFixed(2)}</td>
                        <td style="text-align: center; padding: 12px 8px;">
                            <span class="badge ${item.isAvailable ? 'badge-active' : 'badge-inactive'}" style="font-size: 10px;">
                                ${item.isAvailable ? 'Available' : 'Unavailable'}
                            </span>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <div style="margin-top: 16px; text-align: center;">
            <button class="btn-primary" onclick="viewMenuItems()" style="width: auto; padding: 10px 20px;"><i class="fas fa-edit"></i> Edit Menu</button>
        </div>
    `;
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    return '/assets/dine_with_me/' + imageUrl;
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
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${escapeHtml(message)}</p><button class="btn-primary" onclick="fetchRestaurantDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='restaurant_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
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

function editRestaurant() {
    if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
        window.location.href = `/admin/restaurant_management/restaurant_management_add_edit.html?id=${restaurantId}`;
    } else {
        showError('Unable to edit: Invalid restaurant ID');
    }
}

function viewMenuItems() {
    if (restaurantId && restaurantId !== 'undefined' && restaurantId !== 'null') {
        window.location.href = `/admin/restaurant_management/restaurant_menu_screen.html?id=${restaurantId}`;
    } else {
        showError('Unable to view menu: Invalid restaurant ID');
    }
}

if (checkAuth()) {
    fetchRestaurantDetails();
}