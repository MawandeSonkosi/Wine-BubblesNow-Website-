// Delivery Edit JavaScript - Matches Flutter DeliveryEditScreen functionality

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const deliveryId = urlParams.get('id');

let allUsers = [];
let allDrivers = [];
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
            console.log('✅ Loaded users:', allUsers.length);
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

// ========== FETCH DRIVERS ==========
async function fetchDrivers() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        // Fetch all users and filter for drivers
        const response = await fetch(`${API_BASE}/api/users?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const users = data.data || (Array.isArray(data) ? data : []);
            // Filter users where isDriver is true
            allDrivers = users.filter(user => user.isDriver === true);
            console.log('✅ Loaded drivers:', allDrivers.length);
            
            // Log driver details for debugging
            allDrivers.forEach(driver => {
                console.log(`  Driver: ${driver.fullName} (ID: ${driver.id})`);
            });
            
            populateDriverSelect();
        }
    } catch (error) {
        console.error('Error fetching drivers:', error);
        allDrivers = [];
    }
}

function populateDriverSelect() {
    const driverSelect = document.getElementById('driverSelect');
    if (!driverSelect) {
        console.log('Driver select element not found');
        return;
    }
    
    driverSelect.innerHTML = '<option value="">-- No driver assigned --</option>';
    
    if (allDrivers.length === 0) {
        driverSelect.innerHTML = '<option value="">-- No drivers available --</option>';
        const driverInfo = document.getElementById('driverInfo');
        if (driverInfo) {
            driverInfo.style.display = 'block';
            driverInfo.innerHTML = '<i class="fas fa-info-circle"></i> No active drivers found. Please add drivers in the system.';
        }
        return;
    }
    
    allDrivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = `${driver.fullName} ${driver.phoneNumber ? `- ${driver.phoneNumber}` : ''}`;
        driverSelect.appendChild(option);
    });
    
    // Set selected driver if delivery has one
    if (deliveryData && deliveryData.driverId) {
        driverSelect.value = deliveryData.driverId;
        const driverInfo = document.getElementById('driverInfo');
        if (driverInfo && deliveryData.driverId) {
            const driver = allDrivers.find(d => d.id == deliveryData.driverId);
            if (driver) {
                driverInfo.style.display = 'block';
                driverInfo.innerHTML = `<i class="fas fa-check-circle"></i> Currently assigned to: ${driver.fullName}`;
            }
        }
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

// ========== GET ALLOWED STATUSES BASED ON CURRENT STATUS (Matches Flutter) ==========
function getAllowedStatuses(currentStatus) {
    const status = (currentStatus || '').toLowerCase();
    switch (status) {
        case 'order received':
            return ['Processing', 'Cancelled'];
        case 'processing':
            return ['Out for delivery', 'Cancelled'];
        case 'out for delivery':
            return ['Delivered', 'Cancelled'];
        case 'delivered':
            return [];
        case 'cancelled':
            return [];
        default:
            return ['Processing', 'Cancelled'];
    }
}

function populateStatusSelect() {
    const statusSelect = document.getElementById('statusSelect');
    if (!statusSelect || !deliveryData) {
        console.log('Status select not ready');
        return;
    }
    
    const currentStatus = deliveryData.status;
    const allowedStatuses = getAllowedStatuses(currentStatus);
    const statusInfo = document.getElementById('statusInfo');
    
    console.log('Current status:', currentStatus);
    console.log('Allowed statuses:', allowedStatuses);
    
    if (allowedStatuses.length === 0) {
        statusSelect.innerHTML = '<option value="">-- No status changes available --</option>';
        statusSelect.disabled = true;
        if (statusInfo) {
            statusInfo.style.display = 'block';
            statusInfo.innerHTML = `<i class="fas fa-lock"></i> This order is ${currentStatus.toLowerCase()} and cannot be modified.`;
        }
    } else {
        statusSelect.innerHTML = '<option value="">-- Select new status --</option>';
        allowedStatuses.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            let icon = '';
            if (status === 'Processing') icon = '⚙️ ';
            else if (status === 'Out for delivery') icon = '🚚 ';
            else if (status === 'Delivered') icon = '✅ ';
            else if (status === 'Cancelled') icon = '❌ ';
            option.textContent = icon + status;
            statusSelect.appendChild(option);
        });
        statusSelect.disabled = false;
        
        if (statusInfo) {
            if (currentStatus === 'Order received') {
                statusInfo.style.display = 'block';
                statusInfo.innerHTML = `<i class="fas fa-info-circle"></i> You can process this order or cancel it. Processing will move it to the next stage.`;
            } else if (currentStatus === 'Processing') {
                statusInfo.style.display = 'block';
                statusInfo.innerHTML = `<i class="fas fa-info-circle"></i> Order is being processed. You can mark it as "Out for delivery" or cancel it.`;
            } else if (currentStatus === 'Out for delivery') {
                statusInfo.style.display = 'block';
                statusInfo.innerHTML = `<i class="fas fa-info-circle"></i> Order is out for delivery. You can mark it as "Delivered" or cancel it.`;
            } else {
                statusInfo.style.display = 'none';
            }
        }
    }
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
        console.log('📡 Fetching delivery:', `${API_BASE}/api/deliveries/${deliveryId}`);
        
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) throw new Error('Failed to load delivery');
        
        const data = await response.json();
        console.log('📦 Delivery data:', data);
        
        deliveryData = data.data || data;
        originalStatus = deliveryData.status;
        
        renderDeliveryInfo();
        populateStatusSelect();
        populateDriverSelect();
        
        // Show delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'block';
        
        // Show warning if status is locked
        if (deliveryData.status === 'Delivered' || deliveryData.status === 'Cancelled') {
            const warningContainer = document.getElementById('warningContainer');
            if (warningContainer) {
                warningContainer.style.display = 'block';
                warningContainer.innerHTML = `<i class="fas fa-lock"></i> This order has been ${deliveryData.status.toLowerCase()} and cannot be modified.`;
                const updateBtn = document.getElementById('updateBtn');
                if (updateBtn) updateBtn.disabled = true;
            }
        }
        
    } catch (error) {
        console.error('Error fetching delivery:', error);
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
            <div class="info-row"><div class="info-label">Delivery Address:</div><div class="info-value">${escapeHtml(deliveryData.address || '—')}</div></div>
            <div class="info-row"><div class="info-label">Payment Method:</div><div class="info-value">${escapeHtml(deliveryData.paymentMethod || '—')}</div></div>
            <div class="info-row"><div class="info-label">Total Amount:</div><div class="info-value">R${(deliveryData.totalAmount || 0).toFixed(2)}</div></div>
            <div class="info-row"><div class="info-label">Order Date:</div><div class="info-value">${formatDateTime(deliveryData.createdAt)}</div></div>
            <div class="info-row"><div class="info-label">Current Status:</div><div class="info-value"><span style="display:inline-block; padding:4px 12px; border-radius:20px; background:${getStatusColor(deliveryData.status)}20; color:${getStatusColor(deliveryData.status)}; font-weight:600;">${deliveryData.status}</span></div></div>
            ${deliveryData.driverId ? `<div class="info-row"><div class="info-label">Assigned Driver:</div><div class="info-value">${escapeHtml(getDriverName(deliveryData.driverId))}</div></div>` : ''}
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

function getDriverName(driverId) {
    const driver = allDrivers.find(d => d.id == driverId);
    return driver ? driver.fullName : 'Unknown Driver';
}

function getStatusColor(status) {
    switch(status) {
        case 'Order received': return '#6b0d2b';
        case 'Processing': return '#ed6c02';
        case 'Out for delivery': return '#0288d1';
        case 'Delivered': return '#2e7d32';
        case 'Cancelled': return '#d32f2f';
        default: return '#6b0d2b';
    }
}

function getCaseCount(delivery) {
    if (!delivery.items) return 0;
    return delivery.items.filter(item => item.isCase === true).length;
}

// ========== UPDATE DELIVERY ==========
async function updateDelivery() {
    const statusSelect = document.getElementById('statusSelect');
    const driverSelect = document.getElementById('driverSelect');
    const newStatus = statusSelect.value;
    const newDriverId = driverSelect.value ? parseInt(driverSelect.value) : null;
    
    if (!deliveryData || !deliveryId) return;
    
    // Check if anything was selected
    if (!newStatus && newDriverId === deliveryData.driverId) {
        showError('Please select a new status or assign a driver to update');
        return;
    }
    
    // Show confirmation dialog for status change
    if (newStatus && newStatus !== originalStatus) {
        let confirmMsg = '';
        
        switch (newStatus) {
            case 'Processing':
                confirmMsg = `Process this order from "${originalStatus}" to "Processing"?\n\nThis will move the order to the processing stage.`;
                break;
            case 'Out for delivery':
                confirmMsg = `Mark this order as "Out for delivery"?\n\nThis will notify the customer that their order is on the way.`;
                break;
            case 'Delivered':
                confirmMsg = `Mark this order as "Delivered"?\n\nThis will complete the order.`;
                break;
            case 'Cancelled':
                confirmMsg = `Cancel this order?\n\nThis will cancel the order and notify the customer.`;
                break;
            default:
                confirmMsg = `Change status from "${originalStatus}" to "${newStatus}"?`;
        }
        
        if (!confirm(confirmMsg)) return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const updateData = {
            address: deliveryData.address  // Keep existing address
        };
        
        // Only include fields that are being updated
        if (newStatus && newStatus !== originalStatus) {
            updateData.status = newStatus;
        } else {
            updateData.status = originalStatus;
        }
        
        if (newDriverId !== deliveryData.driverId) {
            updateData.driverId = newDriverId;
        } else {
            updateData.driverId = deliveryData.driverId || null;
        }
        
        console.log('📤 Updating delivery with:', updateData);
        
        const response = await fetch(`${API_BASE}/api/deliveries/${deliveryId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update');
        }
        
        let successMsg = '';
        if (newStatus && newStatus !== originalStatus) {
            successMsg = `Delivery status updated to "${newStatus}"`;
            if (newStatus === 'Processing') {
                successMsg += ' - Order is now being processed.';
            } else if (newStatus === 'Out for delivery') {
                successMsg += ' - Driver has been notified.';
            } else if (newStatus === 'Delivered') {
                successMsg += ' - Order completed successfully.';
            } else if (newStatus === 'Cancelled') {
                successMsg += ' - Order has been cancelled.';
            }
        } else if (newDriverId !== deliveryData.driverId) {
            successMsg = newDriverId ? 'Driver assigned successfully' : 'Driver unassigned successfully';
        } else {
            successMsg = 'Delivery updated successfully';
        }
        
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
    // Fetch users first, then drivers, then delivery
    fetchUsers().then(() => {
        fetchDrivers().then(() => {
            fetchDelivery();
        });
    });
}
