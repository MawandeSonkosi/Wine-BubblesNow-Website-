// Delivery Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allDeliveries = [];
let allUsers = [];
let searchQuery = '';
let statusFilter = 'all';

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required. Please log in as admin.');
        window.location.href = '../../login/login.html';
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
        <a href="../../user/profile.html" style="display:flex; align-items:center; gap:10px; padding:10px 0; color:#1b1b1b; text-decoration:none;"><i class="fas fa-user"></i> My Profile</a>
        <button id="logoutBtn" style="margin-top:12px; padding:10px; background:#6b0d2b; color:white; border:none; border-radius:8px; width:100%; cursor:pointer; font-weight:600;">Logout</button>
    `;
    document.body.appendChild(dropdown);
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
        window.location.href = '../../login/login.html';
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

// ========== FETCH USERS ==========
async function fetchUsers() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            allUsers = data.data || (Array.isArray(data) ? data : []);
            console.log(`✅ Loaded ${allUsers.length} users`);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function getUserName(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.fullName : 'Loading...';
}

function getUserEmail(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.email : 'Loading...';
}

function getUserPhone(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? (user.phoneNumber || '—') : '—';
}

// ========== FETCH DELIVERIES ==========
async function fetchDeliveries() {
    const container = document.getElementById('deliveriesContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading deliveries...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        // Use admin/all endpoint to get all deliveries
        const response = await fetch(`${API_BASE}/api/deliveries/admin/all?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Deliveries response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            allDeliveries = data.data;
        } else if (Array.isArray(data)) {
            allDeliveries = data;
        } else if (data.deliveries && Array.isArray(data.deliveries)) {
            allDeliveries = data.deliveries;
        } else {
            allDeliveries = [];
        }
        
        console.log(`✅ Loaded ${allDeliveries.length} deliveries`);
        renderDeliveries();
        
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading deliveries: ${error.message}</p><button class="btn-primary" onclick="fetchDeliveries()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER DELIVERIES ==========
function renderDeliveries() {
    const container = document.getElementById('deliveriesContainer');
    
    let filtered = allDeliveries.filter(delivery => {
        if (statusFilter !== 'all' && delivery.status !== statusFilter) return false;
        
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const orderId = (delivery._id || delivery.id || '').substring(0, 8).toLowerCase();
            const userName = getUserName(delivery.userId).toLowerCase();
            return orderId.includes(q) || userName.includes(q);
        }
        return true;
    });
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-truck" style="font-size:48px; margin-bottom:16px;"></i><p>No deliveries found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    container.innerHTML = filtered.map(delivery => {
        const orderId = (delivery._id || delivery.id || '').substring(0, 8);
        const statusClass = getStatusClass(delivery.status);
        const statusIcon = getStatusIcon(delivery.status);
        const userName = getUserName(delivery.userId);
        const caseCount = getCaseCount(delivery);
        const advertCount = getAdvertCount(delivery);
        const foodCount = getFoodCount(delivery);
        
        return `
            <div class="delivery-card" onclick="viewDeliveryDetails('${delivery._id || delivery.id}')">
                <div class="delivery-card-main">
                    <div class="delivery-icon ${statusClass}">
                        <i class="${statusIcon}"></i>
                    </div>
                    <div class="delivery-info">
                        <div class="delivery-header">
                            <span class="delivery-id">Order #${orderId}</span>
                            <span class="delivery-status ${statusClass}">${delivery.status}</span>
                        </div>
                        <div class="delivery-customer">
                            <i class="fas fa-user"></i> ${escapeHtml(userName)}
                        </div>
                        <div class="delivery-details">
                            <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(delivery.address?.substring(0, 50) || '—')}</span>
                            <span><i class="fas fa-rand"></i> R${(delivery.totalAmount || 0).toFixed(2)}</span>
                            <span><i class="fas fa-calendar"></i> ${formatDate(delivery.createdAt)}</span>
                        </div>
                        <div class="delivery-details" style="margin-top: 8px;">
                            ${caseCount > 0 ? `<span class="badge-chip badge-case"><i class="fas fa-cubes"></i> ${caseCount} Case${caseCount > 1 ? 's' : ''}</span>` : ''}
                            ${advertCount > 0 ? `<span class="badge-chip badge-advert"><i class="fas fa-ad"></i> ${advertCount} Advert${advertCount > 1 ? 's' : ''}</span>` : ''}
                            ${foodCount > 0 ? `<span class="badge-chip badge-food"><i class="fas fa-utensils"></i> ${foodCount} Food</span>` : ''}
                        </div>
                    </div>
                    <div class="delivery-actions" onclick="event.stopPropagation()">
                        <button class="icon-btn" onclick="viewDeliveryDetails('${delivery._id || delivery.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                        <button class="icon-btn" onclick="editDelivery('${delivery._id || delivery.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                        ${delivery.status === 'Order received' ? `<button class="icon-btn success" onclick="processDelivery('${delivery._id || delivery.id}')" title="Process"><i class="fas fa-play"></i></button>` : ''}
                        <button class="icon-btn danger" onclick="deleteDeliveryPrompt('${delivery._id || delivery.id}', '${orderId}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch(status) {
        case 'Order received': return 'order-received';
        case 'Processing': return 'processing';
        case 'Out for delivery': return 'out-for-delivery';
        case 'Delivered': return 'delivered';
        case 'Cancelled': return 'cancelled';
        default: return 'order-received';
    }
}

function getStatusIcon(status) {
    switch(status) {
        case 'Order received': return 'fas fa-clipboard-list';
        case 'Processing': return 'fas fa-cogs';
        case 'Out for delivery': return 'fas fa-truck';
        case 'Delivered': return 'fas fa-check-circle';
        case 'Cancelled': return 'fas fa-times-circle';
        default: return 'fas fa-box';
    }
}

function getCaseCount(delivery) {
    if (!delivery.items) return 0;
    return delivery.items.filter(item => item.isCase === true).length;
}

function getAdvertCount(delivery) {
    return delivery.adverts?.length || 0;
}

function getFoodCount(delivery) {
    return delivery.foodItems?.length || 0;
}

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { return '—'; }
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleString();
    } catch(e) { return '—'; }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : type === 'error' ? '#d32f2f' : '#6b0d2b'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== MODAL ==========
let currentModal = null;

function closeModal() {
    if (currentModal) currentModal.remove();
    currentModal = null;
}

// ========== DELIVERY ACTIONS ==========
window.viewDeliveryDetails = async function(deliveryId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load delivery');
        const delivery = await response.json();
        const deliveryData = delivery.data || delivery;
        
        const userName = getUserName(deliveryData.userId);
        const userEmail = getUserEmail(deliveryData.userId);
        const userPhone = getUserPhone(deliveryData.userId);
        const orderId = (deliveryData._id || deliveryData.id || '').substring(0, 8);
        const caseCount = getCaseCount(deliveryData);
        const advertCount = getAdvertCount(deliveryData);
        const foodCount = getFoodCount(deliveryData);
        
        if (currentModal) closeModal();
        currentModal = document.createElement('div');
        currentModal.className = 'modal-overlay';
        currentModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-truck" style="color:#6b0d2b; margin-right:10px;"></i> Order #${orderId}</h3>
                <div class="section-title">Customer Information</div>
                <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${escapeHtml(userName)}</div></div>
                <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${escapeHtml(userEmail)}</div></div>
                <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${escapeHtml(userPhone)}</div></div>
                
                <div class="section-title">Delivery Information</div>
                <div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">${escapeHtml(deliveryData.address || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Payment Method:</div><div class="detail-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value"><span class="delivery-status ${getStatusClass(deliveryData.status)}">${deliveryData.status}</span></div></div>
                <div class="detail-row"><div class="detail-label">Total Amount:</div><div class="detail-value">R${(deliveryData.totalAmount || 0).toFixed(2)}</div></div>
                <div class="detail-row"><div class="detail-label">Order Date:</div><div class="detail-value">${formatDateTime(deliveryData.createdAt)}</div></div>
                
                ${deliveryData.items && deliveryData.items.length > 0 ? `
                <div class="section-title">Wine Items (${deliveryData.items.length})</div>
                ${deliveryData.items.map(item => `
                    <div class="detail-row"><div class="detail-label">${item.isCase ? '📦 Case:' : '🍷'}</div><div class="detail-value">${escapeHtml(item.name)} x${item.quantity} - R${((item.price || 0) * (item.isCase ? 6 : 1) * (item.quantity || 1)).toFixed(2)}</div></div>
                `).join('')}
                ` : ''}
                
                ${deliveryData.addOns && deliveryData.addOns.length > 0 ? `
                <div class="section-title">Add-ons (${deliveryData.addOns.length})</div>
                ${deliveryData.addOns.map(addon => `
                    <div class="detail-row"><div class="detail-label">🎁</div><div class="detail-value">${escapeHtml(addon.name)} - R${(addon.price || 0).toFixed(2)}</div></div>
                `).join('')}
                ` : ''}
                
                ${deliveryData.adverts && deliveryData.adverts.length > 0 ? `
                <div class="section-title">Adverts (${deliveryData.adverts.length})</div>
                ${deliveryData.adverts.map(advert => `
                    <div class="detail-row"><div class="detail-label">📢</div><div class="detail-value">${escapeHtml(advert.title)} x${advert.quantity || 1} - R${((advert.price || 0) * (advert.quantity || 1)).toFixed(2)}</div></div>
                `).join('')}
                ` : ''}
                
                ${deliveryData.foodItems && deliveryData.foodItems.length > 0 ? `
                <div class="section-title">Food Items (${deliveryData.foodItems.length})</div>
                ${deliveryData.foodItems.map(food => `
                    <div class="detail-row"><div class="detail-label">🍽️</div><div class="detail-value">${escapeHtml(food.name)} (${escapeHtml(food.restaurantName)}) x${food.quantity} - R${((food.price || 0) * (food.quantity || 1)).toFixed(2)}</div></div>
                `).join('')}
                ` : ''}
                
                <div style="display:flex; gap:12px; margin-top:24px; flex-wrap:wrap;">
                    <button class="btn-primary" onclick="closeModal(); editDelivery('${deliveryId}')" style="flex:1;"><i class="fas fa-edit"></i> Edit</button>
                    ${deliveryData.status === 'Order received' ? `<button class="btn-primary" onclick="closeModal(); processDelivery('${deliveryId}')" style="flex:1; background:#2e7d32;"><i class="fas fa-play"></i> Process</button>` : ''}
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px 20px; border-radius:40px; cursor:pointer;">Close</button>
                </div>
            </div>
        `;
        currentModal.addEventListener('click', (e) => { if (e.target === currentModal) closeModal(); });
        document.body.appendChild(currentModal);
    } catch(error) {
        showToast('Could not load delivery details', 'error');
    }
};

window.editDelivery = function(deliveryId) {
    window.location.href = `delivery_edit_screen.html?id=${deliveryId}`;
};

window.processDelivery = async function(deliveryId) {
    if (!confirm('Process this order? This will change status to "Processing".')) return;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'Processing' })
        });
        
        if (!response.ok) throw new Error('Failed to process delivery');
        
        showToast('Order status updated to Processing', 'success');
        fetchDeliveries();
        fetchUsers();
    } catch(error) {
        showToast('Failed to process order', 'error');
    }
};

window.deleteDeliveryPrompt = function(deliveryId, orderId) {
    if (confirm(`⚠️ Permanently delete Order #${orderId}?\n\nThis action cannot be undone.`)) {
        deleteDelivery(deliveryId);
    }
};

async function deleteDelivery(deliveryId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Delivery deleted', 'success');
        fetchDeliveries();
        fetchUsers();
    } catch(error) {
        showToast('Delete failed', 'error');
    }
}

// ========== FILTERS & SEARCH ==========
function initFilters() {
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            statusFilter = chip.dataset.filter;
            renderDeliveries();
        });
    });
    
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderDeliveries();
    });
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    initFilters();
    fetchUsers().then(() => fetchDeliveries());
}