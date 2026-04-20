// Driver Profile JavaScript

const API_BASE = window.location.origin;
let currentDriver = null;

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

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch(e) { return '—'; }
}

function renderProfile() {
    const container = document.getElementById('profileContent');
    if (!container || !currentDriver) return;
    
    container.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar"><i class="fas fa-truck"></i></div>
                <div class="profile-name">${escapeHtml(currentDriver.fullName)}</div>
                <div class="profile-role">Driver</div>
            </div>
            <div class="profile-content">
                <div class="info-section">
                    <h3><i class="fas fa-user-circle"></i> Personal Information</h3>
                    <div class="info-row"><div class="info-label">Full Name:</div><div class="info-value">${escapeHtml(currentDriver.fullName)}</div></div>
                    <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(currentDriver.email)}</div></div>
                    <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(currentDriver.phoneNumber)}</div></div>
                </div>
                <div class="info-section">
                    <h3><i class="fas fa-car"></i> Vehicle Information</h3>
                    <div class="info-row"><div class="info-label">Vehicle:</div><div class="info-value">${escapeHtml(currentDriver.vehicleInfo || 'Not provided')}</div></div>
                </div>
                <div class="info-section">
                    <h3><i class="fas fa-calendar-alt"></i> Account Information</h3>
                    <div class="info-row"><div class="info-label">Driver ID:</div><div class="info-value">${currentDriver.id || '—'}</div></div>
                    <div class="info-row"><div class="info-label">Status:</div><div class="info-value"><span style="color:#2e7d32;">Active</span></div></div>
                    <div class="info-row"><div class="info-label">Member Since:</div><div class="info-value">${formatDate(currentDriver.createdAt)}</div></div>
                </div>
                <button class="btn-primary" onclick="window.location.href='driver_edit_profile.html'"><i class="fas fa-edit"></i> Edit Profile</button>
                <button class="btn-secondary" onclick="window.location.href='driver_change_password.html'"><i class="fas fa-key"></i> Change Password</button>
                <button class="btn-secondary btn-danger" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</button>
            </div>
        </div>
    `;
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('driver_auth_token');
        localStorage.removeItem('driver_data');
        localStorage.removeItem('driver_token_timestamp');
        window.location.href = '../login/login.html';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

if (checkAuth()) {
    renderProfile();
}