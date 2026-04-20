// Driver Dashboard JavaScript - Complete with customer name fetching
const API_BASE = window.location.origin;
let currentDriver = null;
let allDeliveries = [];
let currentFilter = 'active';
let userCache = {};

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('driver_auth_token');
    const driverData = localStorage.getItem('driver_data');
    
    if (!token || !driverData) {
        alert('Please login as driver to access this page');
        window.location.href = '../login/login.html';
        return false;
    }
    
    try {
        currentDriver = JSON.parse(driverData);
        console.log('✅ Driver authenticated:', currentDriver.fullName, 'ID:', currentDriver.id);
        return true;
    } catch(e) {
        window.location.href = '../login/login.html';
        return false;
    }
}

// ========== FETCH USER BY ID ==========
async function fetchUserById(userId) {
    if (userCache[userId]) return userCache[userId];
    
    try {
        const token = localStorage.getItem('driver_auth_token');
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            const user = data.data || data;
            if (user && user.fullName) {
                userCache[userId] = user;
                console.log(`✅ Found user: ${user.fullName}`);
                return user;
            }
        }
        return null;
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
    }
}

// ========== FETCH ALL DELIVERIES ==========
async function fetchDeliveries() {
    if (!currentDriver) return;
    
    const container = document.getElementById('deliveriesContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading deliveries...</p></div>';
    
    try {
        const token = localStorage.getItem('driver_auth_token');
        const response = await fetch(`${API_BASE}/api/deliveries/admin/all?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        let allDeliveriesData = [];
        if (data.success && Array.isArray(data.data)) {
            allDeliveriesData = data.data;
        } else if (Array.isArray(data)) {
            allDeliveriesData = data;
        }
        
        // Filter deliveries assigned to this driver
        allDeliveries = allDeliveriesData.filter(delivery => delivery.driverId == currentDriver.id);
        console.log(`✅ Loaded ${allDeliveries.length} deliveries assigned to driver`);
        
        // Fetch user details for each delivery's userId
        const uniqueUserIds = [...new Set(allDeliveries.map(d => d.userId))];
        console.log(`👥 Fetching details for ${uniqueUserIds.length} customers...`);
        
        for (const userId of uniqueUserIds) {
            if (!userCache[userId]) {
                await fetchUserById(userId);
            }
        }
        
        renderDriverInfo();
        updateStats();
        renderDeliveries();
        
    } catch (error) {
        console.error('Error fetching deliveries:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading deliveries: ${error.message}</p><button onclick="location.reload()" style="margin-top:16px; background:#6b0d2b; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer;">Retry</button></div>`;
    }
}

function renderDriverInfo() {
    const container = document.getElementById('driverInfoCard');
    if (!container || !currentDriver) return;
    
    container.innerHTML = `
        <div class="driver-avatar">${(currentDriver.fullName?.[0] || 'D').toUpperCase()}</div>
        <div class="driver-details">
            <div class="driver-name">${escapeHtml(currentDriver.fullName)}</div>
            <div class="driver-vehicle"><i class="fas fa-car"></i> ${escapeHtml(currentDriver.vehicleInfo || 'No vehicle info')}</div>
            <div class="driver-phone"><i class="fas fa-phone"></i> ${escapeHtml(currentDriver.phoneNumber || '—')}</div>
            <div class="driver-status active"><i class="fas fa-check-circle"></i> Active Driver</div>
        </div>
        <button onclick="window.location.href='driver_profile.html'" style="background:#6b0d2b; color:white; border:none; padding:10px 20px; border-radius:40px; cursor:pointer;"><i class="fas fa-user-edit"></i> Edit Profile</button>
    `;
}

function updateStats() {
    const activeDeliveries = allDeliveries.filter(d => 
        d.status === 'Order received' || d.status === 'Processing' || d.status === 'Out for delivery'
    ).length;
    
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const completedToday = allDeliveries.filter(d => 
        d.status === 'Delivered' && new Date(d.updatedAt || d.createdAt) > todayStart
    ).length;
    
    const totalCompleted = allDeliveries.filter(d => d.status === 'Delivered').length;
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card"><i class="fas fa-truck"></i><div class="stat-value">${activeDeliveries}</div><div class="stat-label">Active</div></div>
        <div class="stat-card"><i class="fas fa-check-circle"></i><div class="stat-value">${completedToday}</div><div class="stat-label">Completed Today</div></div>
        <div class="stat-card"><i class="fas fa-history"></i><div class="stat-value">${totalCompleted}</div><div class="stat-label">Total Completed</div></div>
    `;
}

async function renderDeliveries() {
    const container = document.getElementById('deliveriesContainer');
    
    let filtered = allDeliveries.filter(delivery => {
        if (currentFilter === 'active') {
            return delivery.status !== 'Delivered' && delivery.status !== 'Cancelled';
        } else if (currentFilter === 'completed') {
            return delivery.status === 'Delivered';
        }
        return true;
    });
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (filtered.length === 0) {
        let message = currentFilter === 'active' ? 'No active deliveries' : 
                      currentFilter === 'completed' ? 'No completed deliveries yet' : 'No deliveries assigned';
        container.innerHTML = `<div class="empty-state"><i class="fas fa-truck" style="font-size:48px; margin-bottom:16px;"></i><p>${message}</p></div>`;
        return;
    }
    
    const deliveriesHtml = [];
    for (const delivery of filtered) {
        const orderId = (delivery._id || delivery.id || '').substring(0, 8);
        const customerName = userCache[delivery.userId]?.fullName || 'Loading...';
        const statusClass = getStatusClass(delivery.status);
        const caseCount = delivery.items?.filter(i => i.isCase === true).length || 0;
        const advertCount = delivery.adverts?.length || 0;
        const foodCount = delivery.foodItems?.length || 0;
        
        deliveriesHtml.push(`
            <div class="delivery-card" onclick="viewDeliveryDetail('${delivery._id || delivery.id}')">
                <div class="delivery-card-content">
                    <div class="delivery-header">
                        <span class="delivery-id">Order #${orderId}</span>
                        <span class="delivery-status ${statusClass}">${delivery.status}</span>
                    </div>
                    <div class="delivery-customer"><i class="fas fa-user"></i> <strong>${escapeHtml(customerName)}</strong></div>
                    <div class="delivery-details">
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(delivery.address?.substring(0, 50) || '—')}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(delivery.createdAt)}</span>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                        ${caseCount > 0 ? `<span class="badge-chip badge-case"><i class="fas fa-cubes"></i> ${caseCount} Case${caseCount > 1 ? 's' : ''}</span>` : ''}
                        ${advertCount > 0 ? `<span class="badge-chip badge-advert"><i class="fas fa-ad"></i> ${advertCount} Advert${advertCount > 1 ? 's' : ''}</span>` : ''}
                        ${foodCount > 0 ? `<span class="badge-chip badge-food"><i class="fas fa-utensils"></i> ${foodCount} Food</span>` : ''}
                    </div>
                    <div class="delivery-amount">R${(delivery.totalAmount || 0).toFixed(2)}</div>
                </div>
            </div>
        `);
    }
    
    container.innerHTML = deliveriesHtml.join('');
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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch(e) { return '—'; }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

window.viewDeliveryDetail = function(deliveryId) {
    window.location.href = `delivery_detail.html?id=${deliveryId}`;
};

async function refreshData() {
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i>';
        refreshBtn.disabled = true;
    }
    userCache = {};
    await fetchDeliveries();
    if (refreshBtn) {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.disabled = false;
    }
}

document.getElementById('refreshBtn')?.addEventListener('click', refreshData);
document.getElementById('profileIcon')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'driver_profile.html';
});
document.getElementById('logoLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.reload();
});

document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        renderDeliveries();
    });
});

if (checkAuth()) {
    fetchDeliveries();
}