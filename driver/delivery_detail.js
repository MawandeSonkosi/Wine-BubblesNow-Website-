// Delivery Detail JavaScript - Shows customer full name

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

let deliveryData = null;
let currentDriver = null;
let isUpdating = false;
let customerName = 'Customer';
let customerEmail = '';

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

// ========== FETCH USER BY ID ==========
async function fetchUserById(userId) {
    try {
        const token = localStorage.getItem('driver_auth_token');
        console.log(`👤 Fetching customer details for ID: ${userId}`);
        
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.data || data;
            if (user && user.fullName) {
                customerName = user.fullName;
                customerEmail = user.email;
                console.log(`✅ Found customer: ${customerName} (${customerEmail})`);
                return true;
            }
        }
        
        // Fallback: parse from email
        if (deliveryData?.userEmail) {
            const email = deliveryData.userEmail;
            customerEmail = email;
            customerName = email.split('@')[0].replace(/[0-9]/g, '').replace(/[._]/g, ' ');
            customerName = customerName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        return false;
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return false;
    }
}

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
        
        // Fetch customer details using userId
        if (deliveryData.userId) {
            await fetchUserById(deliveryData.userId);
        } else if (deliveryData.userEmail) {
            customerEmail = deliveryData.userEmail;
            customerName = deliveryData.userEmail.split('@')[0].replace(/[0-9]/g, '').replace(/[._]/g, ' ');
            customerName = customerName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        }
        
        renderDeliveryDetail();
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<div class="loading-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${error.message}</p><button class="btn-secondary" onclick="fetchDelivery()" style="margin-top:16px;">Retry</button></div>`;
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

function getStatusColor(status) {
    switch(status) {
        case 'Delivered': return '#2e7d32';
        case 'Out for delivery': return '#ed6c02';
        case 'Processing': return '#0288d1';
        default: return '#6b0d2b';
    }
}

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

function getCaseCount() {
    if (!deliveryData?.items) return 0;
    return deliveryData.items.filter(item => item.isCase === true).length;
}

function renderDeliveryDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !deliveryData) return;
    
    const orderId = (deliveryData._id || deliveryData.id || '').substring(0, 8);
    const statusClass = getStatusClass(deliveryData.status);
    const caseCount = getCaseCount();
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
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <h2>Order #${orderId}</h2>
                <div class="status-badge ${statusClass}" style="margin-top: 8px;">${deliveryData.status}</div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-user"></i> Customer Information</h3>
                <div class="info-row"><div class="info-label">Full Name:</div><div class="info-value"><strong>${escapeHtml(customerName)}</strong></div></div>
                <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(customerEmail || deliveryData.userEmail || '—')}</div></div>
                <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(deliveryData.userPhone || 'Not provided')}</div></div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-map-marker-alt"></i> Delivery Information</h3>
                <div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(deliveryData.address || '—')}</div></div>
                <div class="info-row"><div class="info-label">Payment Method:</div><div class="info-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
                <div class="info-row"><div class="info-label">Order Date:</div><div class="info-value">${formatDateTime(deliveryData.createdAt)}</div></div>
            </div>
            
            <div class="detail-section">
                <h3><i class="fas fa-wine-bottle"></i> Order Summary</h3>
                <div class="info-row"><div class="info-label">Total Amount:</div><div class="info-value"><strong>R${(deliveryData.totalAmount || 0).toFixed(2)}</strong></div></div>
                ${caseCount > 0 ? `<div class="info-row"><div class="info-label">Wine Cases:</div><div class="info-value">${caseCount} case${caseCount > 1 ? 's' : ''}</div></div>` : ''}
                ${advertCount > 0 ? `<div class="info-row"><div class="info-label">Adverts:</div><div class="info-value">${advertCount} placement${advertCount > 1 ? 's' : ''}</div></div>` : ''}
                ${foodCount > 0 ? `<div class="info-row"><div class="info-label">Food Items:</div><div class="info-value">${foodCount} item${foodCount > 1 ? 's' : ''}</div></div>` : ''}
            </div>
            
            ${updateButtonHtml ? `<div class="detail-section">${updateButtonHtml}</div>` : ''}
            
            <div class="detail-section">
                <button class="btn-secondary" onclick="window.location.href='driver_dashboard.html'"><i class="fas fa-arrow-left"></i> Back to Dashboard</button>
            </div>
        </div>
    `;
    
    if (canUpdate) {
        document.getElementById('updateStatusBtn')?.addEventListener('click', updateDeliveryStatus);
    }
}

async function updateDeliveryStatus() {
    if (!deliveryData || isUpdating) return;
    
    const newStatus = deliveryData.status === 'Processing' ? 'Out for delivery' : 'Delivered';
    const confirmMsg = `Mark this order as "${newStatus}"?`;
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
        
        alert(`Order status updated to "${newStatus}" successfully!`);
        window.location.reload();
        
    } catch (error) {
        alert('Failed to update status: ' + error.message);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = deliveryData.status === 'Processing' ? 'Mark as Out for Delivery' : 'Mark as Delivered';
        }
        isUpdating = false;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showError(message) {
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = `<div class="loading-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${message}</p><button class="btn-secondary" onclick="fetchDelivery()" style="margin-top:16px;">Retry</button></div>`;
    }
}

if (checkAuth()) {
    fetchDelivery();
}