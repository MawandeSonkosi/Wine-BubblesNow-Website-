// User Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allUsers = [];
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
    
    // Setup user dropdown
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
        <a href="../../user/profile.html" style="display:flex; align-items:center; gap:10px; padding:10px 0; color:#1b1b1b; text-decoration:none;"><i class="fas fa-user" style="width:20px;"></i> My Profile</a>
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
        const response = await fetch(`${API_BASE}/api/users`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Unauthorized. Please login again.');
            }
            throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        // Handle different API response structures
        allUsers = Array.isArray(data) ? data : (data.users || data.data || []);
        renderUsers();
    } catch (error) {
        console.error('Error fetching users:', error);
        document.getElementById('usersContainer').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="fetchUsers()" style="margin-top:16px;"><i class="fas fa-sync-alt"></i> Retry</button>
            </div>
        `;
    }
}

// ========== RENDER USERS ==========
function renderUsers() {
    const container = document.getElementById('usersContainer');
    let filtered = allUsers.filter(user => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (user.fullName || '').toLowerCase().includes(q) ||
               (user.email || '').toLowerCase().includes(q) ||
               (user.phoneNumber || '').includes(q);
    });
    
    // Sort alphabetically by name
    filtered.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    
    if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-users-slash" style="font-size:48px; margin-bottom:16px;"></i><p>No users found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    container.innerHTML = filtered.map(user => `
        <div class="user-card" data-userid="${user.id}" onclick="viewUserDetails('${user.id}')">
            <div class="user-card-main">
                <div class="user-avatar">${(user.fullName?.[0] || 'U').toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">
                        ${escapeHtml(user.fullName || '—')}
                        ${user.isAdmin ? '<span class="badge badge-admin">ADMIN</span>' : ''}
                        ${user.isVerified ? '<span class="badge badge-verified">Verified</span>' : '<span class="badge badge-pending">Pending</span>'}
                    </div>
                    <div class="user-email"><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div>
                    <div class="user-meta">
                        <span><i class="fas fa-phone"></i> ${escapeHtml(user.phoneNumber || '—')}</span>
                        <span><i class="fas fa-calendar-alt"></i> Joined: ${formatDate(user.createdAt)}</span>
                        <span><i class="fas fa-gem"></i> Points: ${user.loyaltyPoints || 0}</span>
                    </div>
                </div>
                <div class="user-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="viewUserDetails('${user.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="icon-btn" onclick="editUser('${user.id}')" title="Edit User"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn" onclick="toggleAdmin('${user.id}', ${!user.isAdmin})" title="${user.isAdmin ? 'Remove Admin' : 'Make Admin'}"><i class="fas fa-user-shield"></i></button>
                    <button class="icon-btn" onclick="toggleVerify('${user.id}', ${!user.isVerified})" title="${user.isVerified ? 'Unverify' : 'Verify'}"><i class="fas fa-check-circle"></i></button>
                    <button class="icon-btn danger" onclick="deleteUserPrompt('${user.id}', '${escapeHtml(user.fullName)}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { return '—'; }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== MODAL ==========
let currentModal = null;

function showModal(contentHtml) {
    if (currentModal) currentModal.remove();
    currentModal = document.createElement('div');
    currentModal.className = 'modal-overlay';
    currentModal.innerHTML = `<div class="modal-content">${contentHtml}</div>`;
    currentModal.addEventListener('click', (e) => { if (e.target === currentModal) closeModal(); });
    document.body.appendChild(currentModal);
}

function closeModal() {
    if (currentModal) currentModal.remove();
    currentModal = null;
}

// ========== USER ACTIONS ==========
async function viewUserDetails(userId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load user details');
        const data = await response.json();
        const user = data.data || data;
        
        showModal(`
            <h3><i class="fas fa-user-circle" style="color:#6b0d2b; margin-right:10px;"></i> User Details</h3>
            <div class="detail-row"><div class="detail-label">Full Name:</div><div class="detail-value">${escapeHtml(user.fullName)}</div></div>
            <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${escapeHtml(user.email)}</div></div>
            <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${escapeHtml(user.phoneNumber || '—')}</div></div>
            <div class="detail-row"><div class="detail-label">Role:</div><div class="detail-value">${user.isAdmin ? 'Administrator' : 'Regular User'}</div></div>
            <div class="detail-row"><div class="detail-label">Verified:</div><div class="detail-value">${user.isVerified ? 'Yes' : 'No'}</div></div>
            <div class="detail-row"><div class="detail-label">User ID:</div><div class="detail-value"><code>${user.id}</code></div></div>
            <div class="detail-row"><div class="detail-label">Joined:</div><div class="detail-value">${formatDate(user.createdAt)}</div></div>
            <div class="detail-row"><div class="detail-label">Loyalty Points:</div><div class="detail-value">${user.loyaltyPoints || 0}</div></div>
            <div class="detail-row"><div class="detail-label">Bookings:</div><div class="detail-value">${user.bookings?.length || 0}</div></div>
            <div style="display:flex; gap:12px; margin-top:24px;">
                <button class="btn-primary" onclick="closeModal(); editUser('${userId}')" style="flex:1;"><i class="fas fa-edit"></i> Edit User</button>
                <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px 20px; border-radius:40px; cursor:pointer;">Close</button>
            </div>
        `);
    } catch (error) {
        showToast('Could not load user details', 'error');
    }
}

window.editUser = function(userId) {
    window.location.href = `user_edit_screen.html?id=${userId}`;
};

window.toggleAdmin = async (userId, newStatus) => {
    const action = newStatus ? 'make this user an admin' : 'remove admin privileges';
    if (!confirm(`Are you sure you want to ${action}?`)) return;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/users/${userId}/admin`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAdmin: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update');
        showToast(`Admin status updated`, 'success');
        fetchUsers();
    } catch (error) {
        showToast('Failed to update admin status', 'error');
    }
};

window.toggleVerify = async (userId, newStatus) => {
    const action = newStatus ? 'verify' : 'unverify';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/users/${userId}/verify`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ isVerified: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update');
        showToast(`User ${newStatus ? 'verified' : 'unverified'}`, 'success');
        fetchUsers();
    } catch (error) {
        showToast('Failed to update verification status', 'error');
    }
};

window.deleteUserPrompt = (userId, userName) => {
    if (confirm(`⚠️ Permanently delete ${userName}?\n\nThis action cannot be undone.`)) {
        deleteUser(userId);
    }
};

async function deleteUser(userId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete');
        showToast('User deleted successfully', 'success');
        fetchUsers();
    } catch (error) {
        showToast('Failed to delete user', 'error');
    }
}

// ========== SEARCH & INITIALIZATION ==========
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderUsers();
});

document.getElementById('addUserBtn')?.addEventListener('click', () => {
    window.location.href = 'user_edit_screen.html';
});

if (checkAuth()) {
    fetchUsers();
}