// Delivery Management JavaScript - With Full Image Support

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

// ========== IMAGE HELPER FUNCTIONS ==========
function getImageUrl(imageUrl) {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return imageUrl;
    if (imageUrl.startsWith('assets/')) return '/' + imageUrl;
    return '/assets/' + imageUrl;
}

function getWineImageUrl(wineItem) {
    if (wineItem.imageUrl) {
        return getImageUrl(wineItem.imageUrl);
    }
    return null;
}

function getAddOnImageUrl(addOn) {
    if (addOn.imageUrl) {
        return getImageUrl(addOn.imageUrl);
    }
    return null;
}

function getAdvertImageUrl(advert) {
    if (advert.imageUrl) {
        return getImageUrl(advert.imageUrl);
    }
    return null;
}

function getFoodImageUrl(foodItem) {
    if (foodItem.imageUrl) {
        return getImageUrl(foodItem.imageUrl);
    }
    return null;
}

// ========== FETCH DELIVERIES ==========
async function fetchDeliveries() {
    const container = document.getElementById('deliveriesContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading deliveries...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
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

// ========== RENDER DELIVERIES WITH IMAGES ==========
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
        
        // Get first item for preview image
        const firstItem = getFirstItemWithImage(delivery);
        
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

function getFirstItemWithImage(delivery) {
    // Check wine items first
    if (delivery.items && delivery.items.length > 0) {
        for (const item of delivery.items) {
            if (item.imageUrl) return { type: 'wine', item: item, imageUrl: item.imageUrl };
        }
    }
    // Check food items
    if (delivery.foodItems && delivery.foodItems.length > 0) {
        for (const item of delivery.foodItems) {
            if (item.imageUrl) return { type: 'food', item: item, imageUrl: item.imageUrl };
        }
    }
    // Check adverts
    if (delivery.adverts && delivery.adverts.length > 0) {
        for (const item of delivery.adverts) {
            if (item.imageUrl) return { type: 'advert', item: item, imageUrl: item.imageUrl };
        }
    }
    // Check add-ons
    if (delivery.addOns && delivery.addOns.length > 0) {
        for (const item of delivery.addOns) {
            if (item.imageUrl) return { type: 'addon', item: item, imageUrl: item.imageUrl };
        }
    }
    return null;
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

function getRestaurantCount(delivery) {
    if (!delivery.foodItems) return 0;
    const restaurants = new Set();
    delivery.foodItems.forEach(item => {
        if (item.restaurantName) restaurants.add(item.restaurantName);
    });
    return restaurants.size;
}

function isWineCase(item) {
    return item.isCase === true;
}

function getWineDisplayName(item) {
    const name = item.name || 'Unknown Wine';
    const isCase = isWineCase(item);
    return isCase ? `${name} (Case of 6)` : name;
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

function parsePrice(price) {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') return parseFloat(price) || 0;
    return 0;
}

// ========== MODAL ==========
let currentModal = null;

function closeModal() {
    if (currentModal) currentModal.remove();
    currentModal = null;
}

// ========== BUILD IMAGE HTML ==========
function buildImageHtml(imageUrl, alt, className = 'item-image-medium', defaultIcon = 'fa-wine-bottle', defaultColor = '#6b0d2b') {
    if (imageUrl) {
        const fullUrl = getImageUrl(imageUrl);
        if (fullUrl) {
            return `<img src="${fullUrl}" alt="${escapeHtml(alt)}" class="${className}" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(107,13,43,0.1); border-radius:8px;\'><i class=\'fas ${defaultIcon}\' style=\'color:${defaultColor}; font-size:24px;\'></i></div>'">`;
        }
    }
    return `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:rgba(107,13,43,0.1); border-radius:8px;"><i class="fas ${defaultIcon}" style="color:${defaultColor}; font-size:24px;"></i></div>`;
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
        
        // Build wine items HTML with images
        let wineItemsHtml = '';
        if (deliveryData.items && deliveryData.items.length > 0) {
            wineItemsHtml = `
                <div class="section-title"><i class="fas fa-wine-bottle"></i> Wine Items (${deliveryData.items.length})</div>
                ${deliveryData.items.map(item => {
                    const imageUrl = getWineImageUrl(item);
                    const isCase = isWineCase(item);
                    const displayName = getWineDisplayName(item);
                    const quantity = item.quantity || 1;
                    const price = parsePrice(item.price);
                    const unitPrice = isCase ? price * 6 : price;
                    const total = unitPrice * quantity;
                    
                    return `
                        <div class="detail-row" style="padding: 12px 0;">
                            <div style="width: 60px; height: 60px; margin-right: 12px; flex-shrink: 0;">
                                ${buildImageHtml(imageUrl, displayName, 'item-image-medium', 'fa-wine-bottle', '#6b0d2b')}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1b1b1b;">${escapeHtml(displayName)}</div>
                                ${item.type ? `<div style="font-size: 12px; color: #6d6d6d;">${escapeHtml(item.type)}</div>` : ''}
                                ${isCase ? `<div style="font-size: 11px; color: #E6C79C; font-style: italic;">6 x 750ml per case</div>` : ''}
                                <div style="font-size: 12px; color: #6d6d6d; margin-top: 4px;">Quantity: ${quantity}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #6b0d2b;">R${unitPrice.toFixed(2)}${isCase ? '/case' : ''}</div>
                                <div style="font-size: 12px; color: #6d6d6d;">Total: R${total.toFixed(2)}</div>
                                ${isCase ? `<div style="font-size: 10px; color: #999;">(R${price.toFixed(2)}/bottle)</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }
        
        // Build add-ons HTML with images
        let addOnsHtml = '';
        if (deliveryData.addOns && deliveryData.addOns.length > 0) {
            addOnsHtml = `
                <div class="section-title"><i class="fas fa-gift"></i> Add-ons (${deliveryData.addOns.length})</div>
                ${deliveryData.addOns.map(addon => {
                    const imageUrl = getAddOnImageUrl(addon);
                    const price = parsePrice(addon.price);
                    
                    return `
                        <div class="detail-row" style="padding: 12px 0;">
                            <div style="width: 50px; height: 50px; margin-right: 12px; flex-shrink: 0;">
                                ${buildImageHtml(imageUrl, addon.name, 'item-image-small', 'fa-gift', '#E6C79C')}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1b1b1b;">${escapeHtml(addon.name)}</div>
                                ${addon.category ? `<div style="font-size: 12px; color: #6d6d6d;">${escapeHtml(addon.category)}</div>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #6b0d2b;">R${price.toFixed(2)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }
        
        // Build adverts HTML with images
        let advertsHtml = '';
        if (deliveryData.adverts && deliveryData.adverts.length > 0) {
            advertsHtml = `
                <div class="section-title"><i class="fas fa-ad"></i> Advert Placements (${deliveryData.adverts.length})</div>
                ${deliveryData.adverts.map(advert => {
                    const imageUrl = getAdvertImageUrl(advert);
                    const quantity = advert.quantity || 1;
                    const price = parsePrice(advert.price);
                    const total = price * quantity;
                    
                    return `
                        <div class="detail-row" style="padding: 12px 0;">
                            <div style="width: 60px; height: 60px; margin-right: 12px; flex-shrink: 0;">
                                ${buildImageHtml(imageUrl, advert.title, 'item-image-medium', 'fa-ad', '#03a9f4')}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1b1b1b;">${escapeHtml(advert.title)}</div>
                                ${advert.subtitle ? `<div style="font-size: 12px; color: #6d6d6d;">${escapeHtml(advert.subtitle)}</div>` : ''}
                                <div style="font-size: 12px; color: #6d6d6d; margin-top: 4px;">Quantity: ${quantity}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #03a9f4;">R${price.toFixed(2)}</div>
                                <div style="font-size: 12px; color: #6d6d6d;">Total: R${total.toFixed(2)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }
        
        // Build food items HTML with images
        let foodItemsHtml = '';
        if (deliveryData.foodItems && deliveryData.foodItems.length > 0) {
            const restaurantCount = getRestaurantCount(deliveryData);
            foodItemsHtml = `
                <div class="section-title"><i class="fas fa-utensils"></i> Food Items (${deliveryData.foodItems.length} from ${restaurantCount} restaurant${restaurantCount > 1 ? 's' : ''})</div>
                ${deliveryData.foodItems.map(food => {
                    const imageUrl = getFoodImageUrl(food);
                    const quantity = food.quantity || 1;
                    const price = parsePrice(food.price);
                    const total = price * quantity;
                    
                    return `
                        <div class="detail-row" style="padding: 12px 0;">
                            <div style="width: 60px; height: 60px; margin-right: 12px; flex-shrink: 0;">
                                ${buildImageHtml(imageUrl, food.name, 'item-image-medium', 'fa-utensils', '#ff9800')}
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: bold; color: #1b1b1b;">${escapeHtml(food.name)}</div>
                                <div style="font-size: 12px; color: #ff9800;">From: ${escapeHtml(food.restaurantName || 'Unknown Restaurant')}</div>
                                ${food.description ? `<div style="font-size: 12px; color: #6d6d6d;">${escapeHtml(food.description.substring(0, 60))}${food.description.length > 60 ? '...' : ''}</div>` : ''}
                                <div style="font-size: 12px; color: #6d6d6d; margin-top: 4px;">Quantity: ${quantity}</div>
                                ${food.specialInstructions ? `<div style="font-size: 11px; color: #999; font-style: italic;">📝 "${escapeHtml(food.specialInstructions)}"</div>` : ''}
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #ff9800;">R${price.toFixed(2)}</div>
                                <div style="font-size: 12px; color: #6d6d6d;">Total: R${total.toFixed(2)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
        }
        
        currentModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-truck" style="color:#6b0d2b; margin-right:10px;"></i> Order #${orderId}</h3>
                
                <div class="section-title"><i class="fas fa-user"></i> Customer Information</div>
                <div class="detail-row"><div class="detail-label">Name:</div><div class="detail-value">${escapeHtml(userName)}</div></div>
                <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${escapeHtml(userEmail)}</div></div>
                <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${escapeHtml(userPhone)}</div></div>
                
                <div class="section-title"><i class="fas fa-map-marker-alt"></i> Delivery Information</div>
                <div class="detail-row"><div class="detail-label">Address:</div><div class="detail-value">${escapeHtml(deliveryData.address || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Payment Method:</div><div class="detail-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value"><span class="delivery-status ${getStatusClass(deliveryData.status)}" style="display:inline-block; padding:4px 12px;">${deliveryData.status}</span></div></div>
                <div class="detail-row"><div class="detail-label">Total Amount:</div><div class="detail-value">R${(deliveryData.totalAmount || 0).toFixed(2)}</div></div>
                <div class="detail-row"><div class="detail-label">Order Date:</div><div class="detail-value">${formatDateTime(deliveryData.createdAt)}</div></div>
                
                ${wineItemsHtml}
                ${addOnsHtml}
                ${advertsHtml}
                ${foodItemsHtml}
                
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