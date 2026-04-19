// Booking Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allBookings = [];
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

// ========== FETCH DATA ==========
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

async function fetchBookings() {
    const container = document.getElementById('bookingsContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading bookings...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Bookings response:', data);
        
        // Handle both array and object responses
        if (Array.isArray(data)) {
            allBookings = data;
        } else if (data.data && Array.isArray(data.data)) {
            allBookings = data.data;
        } else {
            allBookings = [];
        }
        
        console.log(`✅ Loaded ${allBookings.length} bookings`);
        renderBookings();
        
    } catch (error) {
        console.error('Error fetching bookings:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading bookings: ${error.message}</p><button class="btn-primary" onclick="fetchBookings()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER BOOKINGS ==========
function renderBookings() {
    const container = document.getElementById('bookingsContainer');
    
    let filtered = allBookings.filter(booking => {
        // Status filter
        if (statusFilter !== 'all' && booking.status !== statusFilter) return false;
        
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const userName = getUserName(booking.userId).toLowerCase();
            return booking.type.toLowerCase().includes(q) ||
                   userName.includes(q) ||
                   (booking.location?.address || '').toLowerCase().includes(q);
        }
        return true;
    });
    
    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times" style="font-size:48px; margin-bottom:16px;"></i><p>No bookings found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    container.innerHTML = filtered.map(booking => `
        <div class="booking-card" onclick="viewBookingDetails('${booking._id || booking.id}')">
            <div class="booking-card-main">
                <div class="booking-icon ${booking.status}">
                    <i class="${getStatusIcon(booking.status)}"></i>
                </div>
                <div class="booking-info">
                    <div class="booking-header">
                        <span class="booking-type">${escapeHtml(booking.type)}</span>
                        <span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span>
                    </div>
                    <div class="booking-customer">
                        <i class="fas fa-user"></i> ${escapeHtml(getUserName(booking.userId))}
                    </div>
                    <div class="booking-details">
                        <span><i class="fas fa-calendar"></i> ${formatDate(booking.date)}</span>
                        <span><i class="fas fa-clock"></i> ${booking.time || '—'}</span>
                        <span><i class="fas fa-users"></i> ${booking.numberOfGuests || 0} guests</span>
                        <span><i class="fas fa-rand"></i> R${(booking.totalAmount || 0).toFixed(2)}</span>
                    </div>
                </div>
                <div class="booking-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="viewBookingDetails('${booking._id || booking.id}')" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="icon-btn" onclick="editBooking('${booking._id || booking.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                    ${booking.status !== 'confirmed' ? `<button class="icon-btn success" onclick="confirmBooking('${booking._id || booking.id}')" title="Confirm"><i class="fas fa-check-circle"></i></button>` : ''}
                    ${booking.status !== 'cancelled' ? `<button class="icon-btn" onclick="cancelBooking('${booking._id || booking.id}')" title="Cancel"><i class="fas fa-times-circle"></i></button>` : ''}
                    <button class="icon-btn danger" onclick="deleteBookingPrompt('${booking._id || booking.id}', '${escapeHtml(booking.type)}')" title="Delete"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== HELPER FUNCTIONS ==========
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

function getStatusIcon(status) {
    switch(status) {
        case 'confirmed': return 'fas fa-check-circle';
        case 'pending': return 'fas fa-clock';
        case 'cancelled': return 'fas fa-times-circle';
        default: return 'fas fa-calendar';
    }
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

// ========== BOOKING ACTIONS ==========
window.viewBookingDetails = async function(bookingId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to load booking');
        const booking = await response.json();
        
        const userName = getUserName(booking.userId);
        const userEmail = getUserEmail(booking.userId);
        const userPhone = getUserPhone(booking.userId);
        
        if (currentModal) closeModal();
        currentModal = document.createElement('div');
        currentModal.className = 'modal-overlay';
        currentModal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-calendar-check" style="color:#6b0d2b; margin-right:10px;"></i> Booking Details</h3>
                <div class="section-title">Customer Information</div>
                <div class="detail-row"><div class="detail-label">Full Name:</div><div class="detail-value">${escapeHtml(userName)}</div></div>
                <div class="detail-row"><div class="detail-label">Email:</div><div class="detail-value">${escapeHtml(userEmail)}</div></div>
                <div class="detail-row"><div class="detail-label">Phone:</div><div class="detail-value">${escapeHtml(userPhone)}</div></div>
                
                <div class="section-title">Booking Information</div>
                <div class="detail-row"><div class="detail-label">Event Type:</div><div class="detail-value">${escapeHtml(booking.type)}</div></div>
                <div class="detail-row"><div class="detail-label">Date:</div><div class="detail-value">${formatDate(booking.date)}</div></div>
                <div class="detail-row"><div class="detail-label">Time:</div><div class="detail-value">${booking.time || '—'}</div></div>
                <div class="detail-row"><div class="detail-label">Guests:</div><div class="detail-value">${booking.numberOfGuests || 0}</div></div>
                <div class="detail-row"><div class="detail-label">Location:</div><div class="detail-value">${escapeHtml(booking.location?.address || '—')}</div></div>
                <div class="detail-row"><div class="detail-label">Total Amount:</div><div class="detail-value">R${(booking.totalAmount || 0).toFixed(2)}</div></div>
                <div class="detail-row"><div class="detail-label">Status:</div><div class="detail-value"><span class="booking-status ${booking.status}">${booking.status.toUpperCase()}</span></div></div>
                <div class="detail-row"><div class="detail-label">Sommelier:</div><div class="detail-value">${booking.includesSommelier ? 'Yes' : 'No'}</div></div>
                ${booking.specialRequest ? `<div class="detail-row"><div class="detail-label">Special Requests:</div><div class="detail-value">${escapeHtml(booking.specialRequest)}</div></div>` : ''}
                ${booking.addOns && booking.addOns.length ? `<div class="detail-row"><div class="detail-label">Add-ons:</div><div class="detail-value">${booking.addOns.map(a => `${a.name} (R${a.price})`).join(', ')}</div></div>` : ''}
                <div class="detail-row"><div class="detail-label">Created:</div><div class="detail-value">${formatDateTime(booking.createdAt)}</div></div>
                
                <div style="display:flex; gap:12px; margin-top:24px; flex-wrap:wrap;">
                    <button class="btn-primary" onclick="closeModal(); editBooking('${bookingId}')" style="flex:1;"><i class="fas fa-edit"></i> Edit</button>
                    ${booking.status !== 'confirmed' ? `<button class="btn-primary" onclick="closeModal(); confirmBooking('${bookingId}')" style="flex:1; background:#2e7d32;"><i class="fas fa-check-circle"></i> Confirm</button>` : ''}
                    ${booking.status !== 'cancelled' ? `<button class="btn-primary" onclick="closeModal(); cancelBooking('${bookingId}')" style="flex:1; background:#ed6c02;"><i class="fas fa-times-circle"></i> Cancel</button>` : ''}
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px 20px; border-radius:40px; cursor:pointer;">Close</button>
                </div>
            </div>
        `;
        currentModal.addEventListener('click', (e) => { if (e.target === currentModal) closeModal(); });
        document.body.appendChild(currentModal);
    } catch(error) {
        showToast('Could not load booking details', 'error');
    }
};

window.editBooking = function(bookingId) {
    window.location.href = `booking_edit_screen.html?id=${bookingId}`;
};

window.confirmBooking = async function(bookingId) {
    if (!confirm('Are you sure you want to confirm this booking? This will send a confirmation email to the customer.')) return;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' })
        });
        
        if (!response.ok) throw new Error('Failed to confirm booking');
        
        showToast('Booking confirmed! Email sent to customer.', 'success');
        fetchBookings();
        fetchUsers();
    } catch(error) {
        showToast('Failed to confirm booking', 'error');
    }
};

window.cancelBooking = async function(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' })
        });
        
        if (!response.ok) throw new Error('Failed to cancel booking');
        
        showToast('Booking cancelled', 'warning');
        fetchBookings();
        fetchUsers();
    } catch(error) {
        showToast('Failed to cancel booking', 'error');
    }
};

window.deleteBookingPrompt = function(bookingId, bookingType) {
    if (confirm(`⚠️ Permanently delete "${bookingType}" booking?\n\nThis action cannot be undone.`)) {
        deleteBooking(bookingId);
    }
};

async function deleteBooking(bookingId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Booking deleted', 'success');
        fetchBookings();
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
            renderBookings();
        });
    });
    
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderBookings();
    });
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    initFilters();
    fetchUsers().then(() => fetchBookings());
}