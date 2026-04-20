// Driver Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allDrivers = [];
let searchQuery = '';

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

// ========== FETCH DRIVERS ==========
async function fetchDrivers() {
    const container = document.getElementById('driversContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading drivers...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/drivers?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Drivers response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            allDrivers = data.data;
        } else if (Array.isArray(data)) {
            allDrivers = data;
        } else if (data.drivers && Array.isArray(data.drivers)) {
            allDrivers = data.drivers;
        } else {
            allDrivers = [];
        }
        
        console.log(`✅ Loaded ${allDrivers.length} drivers`);
        renderDrivers();
        
    } catch (error) {
        console.error('Error fetching drivers:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading drivers: ${error.message}</p><button class="btn-primary" onclick="fetchDrivers()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER DRIVERS ==========
function renderDrivers() {
    const container = document.getElementById('driversContainer');
    
    let filtered = allDrivers.filter(driver => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (driver.fullName || '').toLowerCase().includes(q) ||
               (driver.phoneNumber || '').includes(q) ||
               (driver.email || '').toLowerCase().includes(q) ||
               (driver.vehicleInfo || '').toLowerCase().includes(q);
    });
    
    filtered.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-users-slash" style="font-size:48px; margin-bottom:16px;"></i><p>No drivers found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    container.innerHTML = filtered.map(driver => {
        const deliveriesCount = driver.deliveries?.length || 0;
        const isActive = driver.isDriver === true;
        
        return `
            <div class="driver-card">
                <div class="driver-card-main">
                    <div class="driver-avatar">${(driver.fullName?.[0] || 'D').toUpperCase()}</div>
                    <div class="driver-info">
                        <div class="driver-header">
                            <span class="driver-name">${escapeHtml(driver.fullName)}</span>
                            <span class="driver-status ${isActive ? 'active' : 'inactive'}">${isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                        <div class="driver-details">
                            <span><i class="fas fa-phone"></i> ${escapeHtml(driver.phoneNumber || '—')}</span>
                            <span><i class="fas fa-envelope"></i> ${escapeHtml(driver.email)}</span>
                            ${driver.vehicleInfo ? `<span><i class="fas fa-truck"></i> ${escapeHtml(driver.vehicleInfo)}</span>` : ''}
                            <span><i class="fas fa-box"></i> ${deliveriesCount} ${deliveriesCount === 1 ? 'Delivery' : 'Deliveries'}</span>
                        </div>
                    </div>
                    <div class="driver-actions">
                        <label class="switch" style="margin-right: 8px;">
                            <input type="checkbox" class="driver-status-toggle" data-id="${driver.id}" ${isActive ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <button class="icon-btn" onclick="editDriver(${driver.id})" title="Edit Driver"><i class="fas fa-edit"></i></button>
                        <button class="icon-btn danger" onclick="deleteDriverPrompt(${driver.id}, '${escapeHtml(driver.fullName)}')" title="Delete Driver"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Attach toggle event listeners
    document.querySelectorAll('.driver-status-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const driverId = parseInt(e.target.dataset.id);
            const newStatus = e.target.checked;
            toggleDriverStatus(driverId, newStatus);
        });
    });
}

// ========== TOGGLE DRIVER STATUS ==========
async function toggleDriverStatus(driverId, isActive) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/drivers/${driverId}/toggle-status`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isDriver: isActive })
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        showToast(`Driver ${isActive ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchDrivers();
    } catch (error) {
        showToast('Failed to update driver status', 'error');
        fetchDrivers(); // Refresh to revert toggle
    }
}

// ========== ADD DRIVER MODAL ==========
function showAddDriverModal() {
    const modalHtml = `
        <div class="modal-overlay" id="addDriverModal">
            <div class="modal-content">
                <h3><i class="fas fa-user-plus"></i> Add New Driver</h3>
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" id="driverFullName" class="form-input" placeholder="Enter full name">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" id="driverPhone" class="form-input" placeholder="+27 XX XXX XXXX">
                </div>
                <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" id="driverEmail" class="form-input" placeholder="driver@example.com">
                </div>
                <div class="form-group">
                    <label class="form-label">Password *</label>
                    <div class="password-wrapper">
                        <input type="password" id="driverPassword" class="form-input" placeholder="Enter password (min 6 characters)">
                        <button type="button" class="password-toggle" id="togglePassword" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer;"><i class="fas fa-eye"></i></button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Vehicle Info (Optional)</label>
                    <input type="text" id="driverVehicle" class="form-input" placeholder="e.g., Toyota Quantum - ABC123GP">
                </div>
                <div class="switch-group">
                    <div class="switch-label"><i class="fas fa-toggle-on"></i> Active Driver</div>
                    <label class="switch"><input type="checkbox" id="driverActive" checked><span class="slider"></span></label>
                </div>
                <div style="display: flex; gap: 12px; margin-top: 24px;">
                    <button class="btn-primary" onclick="createDriver()" style="flex:1;">Create Driver</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px 20px; border-radius:40px; cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Password toggle
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('driverPassword');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
}

async function createDriver() {
    const fullName = document.getElementById('driverFullName')?.value.trim();
    const phone = document.getElementById('driverPhone')?.value.trim();
    const email = document.getElementById('driverEmail')?.value.trim();
    const password = document.getElementById('driverPassword')?.value;
    const vehicleInfo = document.getElementById('driverVehicle')?.value.trim();
    const isActive = document.getElementById('driverActive')?.checked || false;
    
    if (!fullName || !phone || !email || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/drivers`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: fullName,
                phoneNumber: phone,
                email: email.toLowerCase(),
                password: password,
                vehicleInfo: vehicleInfo || null,
                isDriver: isActive
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create driver');
        }
        
        showToast('Driver created successfully', 'success');
        closeModal();
        fetchDrivers();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// ========== EDIT DRIVER ==========
window.editDriver = function(driverId) {
    window.location.href = `driver_edit_screen.html?id=${driverId}`;
};

// ========== DELETE DRIVER ==========
window.deleteDriverPrompt = function(driverId, driverName) {
    if (confirm(`⚠️ Permanently delete driver "${driverName}"?\n\nThis action cannot be undone.`)) {
        deleteDriver(driverId);
    }
};

async function deleteDriver(driverId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Driver deleted successfully', 'success');
        fetchDrivers();
    } catch (error) {
        showToast('Failed to delete driver', 'error');
    }
}

// ========== HELPER FUNCTIONS ==========
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
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

// ========== SEARCH & INITIALIZATION ==========
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderDrivers();
});

document.getElementById('addDriverBtn')?.addEventListener('click', () => {
    showAddDriverModal();
});

if (checkAuth()) {
    fetchDrivers();
}