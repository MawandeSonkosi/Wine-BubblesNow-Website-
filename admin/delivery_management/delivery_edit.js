// Delivery Edit JavaScript - Matches Flutter DeliveryEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

let allUsers = [];
let deliveryData = null;
let originalStatus = '';

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required');
        window.location.href = '../../login/login.html';
        return false;
    }
    return true;
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
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

function getUserName(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.fullName : 'Unknown User';
}

function getUserEmail(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.email : 'No email';
}

function getUserPhone(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? (user.phoneNumber || '—') : '—';
}

// ========== FETCH DELIVERY ==========
async function fetchDelivery() {
    if (!deliveryId) {
        showError('No delivery ID provided');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load delivery');
        
        const data = await response.json();
        deliveryData = data.data || data;
        originalStatus = deliveryData.status;
        console.log('📦 Delivery data:', deliveryData);
        
        renderDeliveryInfo();
        
        // Set form values
        const statusSelect = document.getElementById('statusSelect');
        const addressInput = document.getElementById('addressInput');
        if (statusSelect) statusSelect.value = deliveryData.status;
        if (addressInput) addressInput.value = deliveryData.address || '';
        
        // Show delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'block';
        
        // Show warning if status is locked
        if (deliveryData.status === 'Delivered' || deliveryData.status === 'Cancelled') {
            const warningContainer = document.getElementById('warningContainer');
            if (warningContainer) {
                warningContainer.style.display = 'block';
                warningContainer.innerHTML = `<i class="fas fa-lock"></i> This order has been ${deliveryData.status.toLowerCase()} and cannot be modified.`;
                if (statusSelect) statusSelect.disabled = true;
                if (addressInput) addressInput.disabled = true;
                const updateBtn = document.getElementById('updateBtn');
                if (updateBtn) updateBtn.disabled = true;
            }
        }
        
    } catch (error) {
        showError('Failed to load delivery: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== RENDER DELIVERY INFO ==========
function renderDeliveryInfo() {
    const container = document.getElementById('deliveryInfo');
    if (!container || !deliveryData) return;
    
    const userName = getUserName(deliveryData.userId);
    const userEmail = getUserEmail(deliveryData.userId);
    const userPhone = getUserPhone(deliveryData.userId);
    const orderId = (deliveryData._id || deliveryData.id || '').substring(0, 8);
    const caseCount = getCaseCount(deliveryData);
    const advertCount = deliveryData.adverts?.length || 0;
    const foodCount = deliveryData.foodItems?.length || 0;
    
    container.innerHTML = `
        <div class="info-section">
            <h3><i class="fas fa-user"></i> Customer Information</h3>
            <div class="info-row"><div class="info-label">Name:</div><div class="info-value">${escapeHtml(userName)}</div></div>
            <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(userEmail)}</div></div>
            <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(userPhone)}</div></div>
        </div>
        <div class="info-section">
            <h3><i class="fas fa-shopping-cart"></i> Order #${orderId}</h3>
            <div class="info-row"><div class="info-label">Payment Method:</div><div class="info-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
            <div class="info-row"><div class="info-label">Total Amount:</div><div class="info-value">R${(deliveryData.totalAmount || 0).toFixed(2)}</div></div>
            <div class="info-row"><div class="info-label">Order Date:</div><div class="info-value">${formatDateTime(deliveryData.createdAt)}</div></div>
            <div class="info-row"><div class="info-label">Current Status:</div><div class="info-value"><span class="delivery-status ${getStatusClass(deliveryData.status)}">${deliveryData.status}</span></div></div>
        </div>
        ${deliveryData.items && deliveryData.items.length > 0 ? `
        <div class="info-section">
            <h3><i class="fas fa-wine-bottle"></i> Wine Items (${deliveryData.items.length})</h3>
            ${deliveryData.items.map(item => `
                <div class="info-row"><div class="info-label">${item.isCase ? '📦 Case:' : '🍷'}</div><div class="info-value">${escapeHtml(item.name)} x${item.quantity} - R${((item.price || 0) * (item.isCase ? 6 : 1) * (item.quantity || 1)).toFixed(2)}</div></div>
            `).join('')}
        </div>
        ` : ''}
        ${deliveryData.addOns && deliveryData.addOns.length > 0 ? `
        <div class="info-section">
            <h3><i class="fas fa-gift"></i> Add-ons (${deliveryData.addOns.length})</h3>
            ${deliveryData.addOns.map(addon => `
                <div class="info-row"><div class="info-label">🎁</div><div class="info-value">${escapeHtml(addon.name)} - R${(addon.price || 0).toFixed(2)}</div></div>
            `).join('')}
        </div>
        ` : ''}
        ${deliveryData.adverts && deliveryData.adverts.length > 0 ? `
        <div class="info-section">
            <h3><i class="fas fa-ad"></i> Adverts (${deliveryData.adverts.length})</h3>
            ${deliveryData.adverts.map(advert => `
                <div class="info-row"><div class="info-label">📢</div><div class="info-value">${escapeHtml(advert.title)} x${advert.quantity || 1} - R${((advert.price || 0) * (advert.quantity || 1)).toFixed(2)}</div></div>
            `).join('')}
        </div>
        ` : ''}
        ${deliveryData.foodItems && deliveryData.foodItems.length > 0 ? `
        <div class="info-section">
            <h3><i class="fas fa-utensils"></i> Food Items (${deliveryData.foodItems.length})</h3>
            ${deliveryData.foodItems.map(food => `
                <div class="info-row"><div class="info-label">🍽️</div><div class="info-value">${escapeHtml(food.name)} (${escapeHtml(food.restaurantName)}) x${food.quantity} - R${((food.price || 0) * (food.quantity || 1)).toFixed(2)}</div></div>
            `).join('')}
        </div>
        ` : ''}
    `;
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

function getCaseCount(delivery) {
    if (!delivery.items) return 0;
    return delivery.items.filter(item => item.isCase === true).length;
}

// ========== UPDATE DELIVERY ==========
async function updateDelivery() {
    const statusSelect = document.getElementById('statusSelect');
    const addressInput = document.getElementById('addressInput');
    const newStatus = statusSelect.value;
    const newAddress = addressInput.value.trim();
    
    if (!deliveryData || !deliveryId) return;
    
    if (!newAddress) {
        showError('Address is required');
        return;
    }
    
    const hasChanges = newStatus !== originalStatus || newAddress !== deliveryData.address;
    if (!hasChanges) {
        showToast('No changes to save', 'info');
        return;
    }
    
    // Show confirmation dialog for status change
    if (newStatus !== originalStatus) {
        const confirmMsg = newStatus === 'Processing' ? 
            'Process this order? This will move it to processing stage.' :
            newStatus === 'Out for delivery' ? 'Mark this order as out for delivery?' :
            newStatus === 'Delivered' ? 'Mark this order as delivered? This will complete the order.' :
            newStatus === 'Cancelled' ? 'Cancel this order? This action can be reversed later.' :
            `Change status from "${originalStatus}" to "${newStatus}"?`;
        
        if (!confirm(confirmMsg)) return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Use PUT endpoint to update delivery completely
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                address: newAddress,
                status: newStatus,
                driverId: null
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update');
        }
        
        const successMsg = newStatus !== originalStatus ? 
            `Delivery status updated to "${newStatus}"` : 
            'Delivery updated successfully';
        
        showToast(successMsg, 'success');
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'delivery_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to update: ' + error.message);
        showLoading(false);
    }
}

// ========== DELETE DELIVERY ==========
async function deleteDelivery() {
    if (!deliveryId) return;
    
    if (!confirm(`⚠️ Permanently delete this delivery?\n\nOrder #${(deliveryData?._id || '').substring(0, 8)}\nCustomer: ${getUserName(deliveryData?.userId)}\nTotal: R${deliveryData?.totalAmount?.toFixed(2)}\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Delivery deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'delivery_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to delete: ' + error.message);
        showLoading(false);
    }
}

// ========== HELPER FUNCTIONS ==========
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

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

function showLoading(show) {
    const loadingContainer = document.getElementById('loadingContainer');
    const updateBtn = document.getElementById('updateBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    
    if (show) {
        if (loadingContainer) loadingContainer.style.display = 'block';
        if (updateBtn) updateBtn.disabled = true;
        if (deleteBtn) deleteBtn.disabled = true;
    } else {
        if (loadingContainer) loadingContainer.style.display = 'none';
        if (updateBtn) updateBtn.disabled = false;
        if (deleteBtn) deleteBtn.disabled = false;
    }
}

// ========== INITIALIZE ==========
document.getElementById('updateBtn')?.addEventListener('click', updateDelivery);
document.getElementById('deleteBtn')?.addEventListener('click', deleteDelivery);

if (checkAuth()) {
    fetchUsers().then(() => fetchDelivery());
}