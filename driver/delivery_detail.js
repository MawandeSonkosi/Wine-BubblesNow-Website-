// Delivery Detail JavaScript - Fetches users properly like admin panel

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

let deliveryData = null;
let currentDriver = null;
let isUpdating = false;
let allUsers = [];  // Store users like admin panel

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('driver_auth_token');
    const driverData = localStorage.getItem('driver_data');
    
    if (!token || !driverData) {
        alert('Please login as driver');
        window.location.href = '../login/login.html';
        return false;
    }
    
    try {
        currentDriver = JSON.parse(driverData);
        return true;
    } catch(e) {
        window.location.href = '../login/login.html';
        return false;
    }
}

// ========== FETCH USERS - LIKE ADMIN PANEL ==========
async function fetchUsers() {
    try {
        const token = localStorage.getItem('driver_auth_token');
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

// ========== GET USER DETAILS FROM CACHE ==========
function getUserName(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.fullName : 'Customer';
}

function getUserEmail(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? user.email : 'No email';
}

function getUserPhone(userId) {
    const user = allUsers.find(u => u.id === userId || u._id === userId);
    return user ? (user.phoneNumber || 'Not provided') : 'Not provided';
}

// ========== FETCH DELIVERY ==========
async function fetchDelivery() {
    if (!deliveryId) {
        showError('No delivery ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading delivery details...</p></div>';
    
    try {
        const token = localStorage.getItem('driver_auth_token');
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load delivery');
        
        const data = await response.json();
        deliveryData = data.data || data;
        
        console.log('📦 Delivery loaded:', deliveryData._id || deliveryData.id);
        renderDeliveryDetail();
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="loading-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${error.message}</p><button onclick="location.reload()" style="margin-top:16px; background:#6b0d2b; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer;">Retry</button></div>`;
    }
}

// ========== SEND EMAIL NOTIFICATION ==========
async function sendStatusUpdateEmail(newStatus) {
    try {
        const token = localStorage.getItem('driver_auth_token');
        let message = '';
        let statusText = '';
        
        if (newStatus === 'Out for delivery') {
            statusText = 'Out for delivery';
            message = 'Your order is on its way! Our driver is heading to you now.';
        } else if (newStatus === 'Delivered') {
            statusText = 'Delivered';
            message = 'Thank you for choosing Wine & Bubbles Now! We hope you enjoy your order and look forward to serving you again soon.';
        } else {
            return true;
        }
        
        const customerName = getUserName(deliveryData.userId);
        const customerEmail = getUserEmail(deliveryData.userId);
        const customerPhone = getUserPhone(deliveryData.userId);
        
        const emailData = {
            delivery: deliveryData,
            userEmail: customerEmail || deliveryData.userEmail,
            userFullName: customerName,
            userPhoneNumber: customerPhone,
            status: statusText,
            message: message,
            driverName: currentDriver?.fullName
        };
        
        console.log('📧 Sending email notification:', emailData);
        
        const response = await fetch(`${API_BASE}/api/email/send-delivery-status-update`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
            console.log('✅ Email sent successfully');
            return true;
        } else {
            console.log('⚠️ Email failed, but delivery status was updated');
            return false;
        }
    } catch (error) {
        console.error('Failed to send email:', error);
        return false;
    }
}

// ========== UPDATE DELIVERY STATUS ==========
async function updateDeliveryStatus(newStatus) {
    if (!deliveryData || isUpdating) return;
    
    const confirmMsg = newStatus === 'Out for delivery' 
        ? 'Mark this order as "Out for delivery"? The customer will be notified.'
        : 'Mark this order as "Delivered"? This will complete the order.';
    
    if (!confirm(confirmMsg)) return;
    
    isUpdating = true;
    const btn = document.getElementById('updateStatusBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Updating...';
    }
    
    try {
        const token = localStorage.getItem('driver_auth_token');
        
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}/status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        await sendStatusUpdateEmail(newStatus);
        
        showToast(`Order status updated to "${newStatus}" successfully!${newStatus === 'Delivered' ? ' A thank you email has been sent.' : ''}`, 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        showToast('Failed to update status: ' + error.message, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = deliveryData.status === 'Processing' ? 'Mark as Out for Delivery' : 'Mark as Delivered';
        }
        isUpdating = false;
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:'Montserrat', sans-serif; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== RENDER DELIVERY DETAIL ==========
function renderDeliveryDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !deliveryData) return;
    
    const orderId = (deliveryData._id || deliveryData.id || '').substring(0, 8);
    const statusClass = getStatusClass(deliveryData.status);
    const customerName = getUserName(deliveryData.userId);
    const customerEmail = getUserEmail(deliveryData.userId);
    const customerPhone = getUserPhone(deliveryData.userId);
    const caseCount = deliveryData.items?.filter(i => i.isCase === true).length || 0;
    const advertCount = deliveryData.adverts?.length || 0;
    const foodCount = deliveryData.foodItems?.length || 0;
    const canUpdate = deliveryData.status === 'Processing' || deliveryData.status === 'Out for delivery';
    
    let updateButtonHtml = '';
    if (canUpdate) {
        if (deliveryData.status === 'Processing') {
            updateButtonHtml = `<button class="btn-update" id="updateStatusBtn"><i class="fas fa-truck"></i> Mark as Out for Delivery</button>`;
        } else if (deliveryData.status === 'Out for delivery') {
            updateButtonHtml = `<button class="btn-update" id="updateStatusBtn"><i class="fas fa-check-circle"></i> Mark as Delivered</button>`;
        }
    }
    
    // Build wine items HTML
    let wineItemsHtml = '';
    if (deliveryData.items && deliveryData.items.length > 0) {
        wineItemsHtml = `
            <div class="detail-section">
                <h3><i class="fas fa-wine-bottle"></i> Wine Items</h3>
                ${deliveryData.items.map(item => `
                    <div class="item-row">
                        <div class="item-name">
                            <i class="fas ${item.isCase ? 'fa-cubes' : 'fa-wine-bottle'}"></i>
                            ${escapeHtml(item.name)}
                            ${item.isCase ? '<span class="badge-case">Case of 6</span>' : ''}
                        </div>
                        <div class="item-qty">x${item.quantity}</div>
                        <div class="item-price">R${((item.price || 0) * (item.isCase ? 6 : 1) * (item.quantity || 1)).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Build add-ons HTML
    let addOnsHtml = '';
    if (deliveryData.addOns && deliveryData.addOns.length > 0) {
        addOnsHtml = `
            <div class="detail-section">
                <h3><i class="fas fa-gift"></i> Add-ons</h3>
                ${deliveryData.addOns.map(addon => `
                    <div class="item-row">
                        <div class="item-name"><i class="fas fa-gift"></i> ${escapeHtml(addon.name)}</div>
                        <div class="item-qty">x1</div>
                        <div class="item-price">R${(addon.price || 0).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Build adverts HTML
    let advertsHtml = '';
    if (deliveryData.adverts && deliveryData.adverts.length > 0) {
        advertsHtml = `
            <div class="detail-section">
                <h3><i class="fas fa-ad"></i> Advert Placements</h3>
                ${deliveryData.adverts.map(advert => `
                    <div class="item-row">
                        <div class="item-name"><i class="fas fa-ad"></i> ${escapeHtml(advert.title)}</div>
                        <div class="item-qty">x${advert.quantity || 1}</div>
                        <div class="item-price">R${((advert.price || 0) * (advert.quantity || 1)).toFixed(2)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Build food items HTML
    let foodItemsHtml = '';
    if (deliveryData.foodItems && deliveryData.foodItems.length > 0) {
        const restaurantCount = [...new Set(deliveryData.foodItems.map(f => f.restaurantName))].length;
        foodItemsHtml = `
            <div class="detail-section">
                <h3><i class="fas fa-utensils"></i> Food Items <span style="font-size:12px; color:#ff9800;">(${restaurantCount} restaurant${restaurantCount > 1 ? 's' : ''})</span></h3>
                ${deliveryData.foodItems.map(food => `
                    <div>
                        <div class="item-row">
                            <div class="item-name"><i class="fas fa-utensils"></i> ${escapeHtml(food.name)} <span class="badge-food">${escapeHtml(food.restaurantName)}</span></div>
                            <div class="item-qty">x${food.quantity}</div>
                            <div class="item-price">R${((food.price || 0) * (food.quantity || 1)).toFixed(2)}</div>
                        </div>
                        ${food.specialInstructions ? `<div class="special-instruction"><i class="fas fa-pen"></i> Special instructions: "${escapeHtml(food.specialInstructions)}"</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <h2>Order #${orderId}</h2>
                <div class="status-badge ${statusClass}" style="margin-top: 8px;">${deliveryData.status}</div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Customer Information</h3>
                <div class="info-row"><div class="info-label">Full Name:</div><div class="info-value"><strong>${escapeHtml(customerName)}</strong></div></div>
                <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(customerEmail)}</div></div>
                <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(customerPhone)}</div></div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Delivery Information</h3>
                <div class="info-row"><div class="info-label">Delivery Address:</div><div class="info-value">${escapeHtml(deliveryData.address || '—')}</div></div>
                <div class="info-row"><div class="info-label">Payment Method:</div><div class="info-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
                <div class="info-row"><div class="info-label">Order Date:</div><div class="info-value">${formatDateTime(deliveryData.createdAt)}</div></div>
                <div class="info-row"><div class="info-label">Total Amount:</div><div class="info-value"><strong>R${(deliveryData.totalAmount || 0).toFixed(2)}</strong></div></div>
                ${caseCount > 0 ? `<div class="info-row"><div class="info-label">Wine Cases:</div><div class="info-value">${caseCount} case${caseCount > 1 ? 's' : ''} (${caseCount * 6} bottles)</div></div>` : ''}
                ${advertCount > 0 ? `<div class="info-row"><div class="info-label">Adverts:</div><div class="info-value">${advertCount} placement${advertCount > 1 ? 's' : ''}</div></div>` : ''}
                ${foodCount > 0 ? `<div class="info-row"><div class="info-label">Food Items:</div><div class="info-value">${foodCount} item${foodCount > 1 ? 's' : ''}</div></div>` : ''}
            </div>
            
            ${wineItemsHtml}
            ${addOnsHtml}
            ${advertsHtml}
            ${foodItemsHtml}
            
            ${updateButtonHtml ? `<div class="detail-section">${updateButtonHtml}</div>` : ''}
            
            <div class="detail-section">
                <button class="btn-secondary" onclick="window.location.href='driver_dashboard.html'"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            </div>
        </div>
    `;
    
    if (canUpdate) {
        const btn = document.getElementById('updateStatusBtn');
        if (btn) {
            btn.addEventListener('click', () => {
                const newStatus = deliveryData.status === 'Processing' ? 'Out for delivery' : 'Delivered';
                updateDeliveryStatus(newStatus);
            });
        }
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'Order received': return 'order-received';
        case 'Processing': return 'processing';
        case 'Out for delivery': return 'out-for-delivery';
        case 'Delivered': return 'delivered';
        default: return 'order-received';
    }
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

function showError(message) {
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = `<div class="loading-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${message}</p><button onclick="location.reload()" style="margin-top:16px; background:#6b0d2b; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer;">Retry</button></div>`;
    }
}

if (checkAuth()) {
    fetchUsers().then(() => fetchDelivery());
}