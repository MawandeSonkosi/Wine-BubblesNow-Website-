// Booking Edit JavaScript - Matches Flutter BookingEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const bookingId = urlParams.get('id');

let allUsers = [];
let bookingData = null;

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

// ========== FETCH BOOKING ==========
async function fetchBooking() {
    if (!bookingId) {
        showError('No booking ID provided');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load booking');
        
        bookingData = await response.json();
        console.log('📦 Booking data:', bookingData);
        
        renderBookingInfo();
        
        // Set status select value
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect && bookingData.status) {
            statusSelect.value = bookingData.status;
        }
        
        // Show delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'block';
        
    } catch (error) {
        showError('Failed to load booking: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ========== RENDER BOOKING INFO ==========
function renderBookingInfo() {
    const container = document.getElementById('bookingInfo');
    if (!container || !bookingData) return;
    
    const userName = getUserName(bookingData.userId);
    const userEmail = getUserEmail(bookingData.userId);
    const userPhone = getUserPhone(bookingData.userId);
    
    container.innerHTML = `
        <div class="info-section">
            <h3><i class="fas fa-user"></i> Customer Information</h3>
            <div class="info-row"><div class="info-label">Full Name:</div><div class="info-value">${escapeHtml(userName)}</div></div>
            <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(userEmail)}</div></div>
            <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(userPhone)}</div></div>
        </div>
        <div class="info-section">
            <h3><i class="fas fa-calendar-alt"></i> Booking Information</h3>
            <div class="info-row"><div class="info-label">Event Type:</div><div class="info-value">${escapeHtml(bookingData.type)}</div></div>
            <div class="info-row"><div class="info-label">Date:</div><div class="info-value">${formatDate(bookingData.date)}</div></div>
            <div class="info-row"><div class="info-label">Time:</div><div class="info-value">${bookingData.time || '—'}</div></div>
            <div class="info-row"><div class="info-label">Number of Guests:</div><div class="info-value">${bookingData.numberOfGuests || 0}</div></div>
            <div class="info-row"><div class="info-label">Location:</div><div class="info-value">${escapeHtml(bookingData.location?.address || '—')}</div></div>
            <div class="info-row"><div class="info-label">Total Amount:</div><div class="info-value">R${(bookingData.totalAmount || 0).toFixed(2)}</div></div>
            <div class="info-row"><div class="info-label">Current Status:</div><div class="info-value"><span class="booking-status ${bookingData.status}">${bookingData.status.toUpperCase()}</span></div></div>
            <div class="info-row"><div class="info-label">Sommelier Service:</div><div class="info-value">${bookingData.includesSommelier ? 'Yes' : 'No'}</div></div>
            ${bookingData.specialRequest ? `<div class="info-row"><div class="info-label">Special Requests:</div><div class="info-value">${escapeHtml(bookingData.specialRequest)}</div></div>` : ''}
            ${bookingData.addOns && bookingData.addOns.length ? `<div class="info-row"><div class="info-label">Add-ons:</div><div class="info-value">${bookingData.addOns.map(a => `${a.name} (R${a.price})`).join(', ')}</div></div>` : ''}
            <div class="info-row"><div class="info-label">Created:</div><div class="info-value">${formatDateTime(bookingData.createdAt)}</div></div>
        </div>
    `;
}

// ========== UPDATE BOOKING STATUS ==========
async function updateBookingStatus() {
    const statusSelect = document.getElementById('statusSelect');
    const newStatus = statusSelect.value;
    
    if (!bookingData || !bookingId) return;
    
    if (bookingData.status === newStatus) {
        showToast('Status unchanged', 'info');
        return;
    }
    
    const confirmMsg = newStatus === 'confirmed' ? 
        'Confirm this booking? This will send a confirmation email to the customer.' :
        newStatus === 'cancelled' ? 'Cancel this booking?' : 'Update booking status?';
    
    if (!confirm(confirmMsg)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update');
        }
        
        const successMsg = newStatus === 'confirmed' ? 
            'Booking confirmed! Confirmation email sent to customer.' : 
            `Booking status updated to ${newStatus}`;
        
        showToast(successMsg, 'success');
        
        // Update local data
        bookingData.status = newStatus;
        renderBookingInfo();
        
        // Redirect after short delay
        setTimeout(() => {
            window.location.href = 'booking_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to update: ' + error.message);
        showLoading(false);
    }
}

// ========== DELETE BOOKING ==========
async function deleteBooking() {
    if (!bookingId) return;
    
    if (!confirm(`⚠️ Permanently delete "${bookingData?.type}" booking?\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Booking deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'booking_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to delete: ' + error.message);
        showLoading(false);
    }
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
document.getElementById('updateBtn')?.addEventListener('click', updateBookingStatus);
document.getElementById('deleteBtn')?.addEventListener('click', deleteBooking);

if (checkAuth()) {
    fetchUsers().then(() => fetchBooking());
}