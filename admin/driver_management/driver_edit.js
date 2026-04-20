// Driver Edit JavaScript - Matches Flutter DriverEditScreen

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const driverId = urlParams.get('id');

let driverData = null;

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

// ========== FETCH DRIVER ==========
async function fetchDriver() {
    if (!driverId) {
        showError('No driver ID provided');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        console.log('📡 Fetching driver:', `${API_BASE}/api/drivers/${driverId}`);
        
        const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) throw new Error('Failed to load driver');
        
        const data = await response.json();
        driverData = data.data || data;
        console.log('📦 Driver data:', driverData);
        
        renderDriverInfo();
        
        // Populate form fields
        document.getElementById('fullName').value = driverData.fullName || '';
        document.getElementById('phoneNumber').value = driverData.phoneNumber || '';
        document.getElementById('email').value = driverData.email || '';
        document.getElementById('vehicleInfo').value = driverData.vehicleInfo || '';
        document.getElementById('isDriver').checked = driverData.isDriver === true;
        
        // Show delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) deleteBtn.style.display = 'block';
        
    } catch (error) {
        console.error('Error fetching driver:', error);
        showError('Failed to load driver: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function renderDriverInfo() {
    const container = document.getElementById('driverInfo');
    if (!container || !driverData) return;
    
    const deliveriesCount = driverData.deliveries?.length || 0;
    
    container.innerHTML = `
        <div class="info-section">
            <h3><i class="fas fa-info-circle"></i> Driver Information</h3>
            <div class="info-row"><div class="info-label">Driver ID:</div><div class="info-value">${driverData.id || '—'}</div></div>
            <div class="info-row"><div class="info-label">Status:</div><div class="info-value"><span style="display:inline-block; padding:4px 12px; border-radius:20px; background:${driverData.isDriver ? 'rgba(46,125,50,0.1)' : 'rgba(109,109,109,0.1)'}; color:${driverData.isDriver ? '#2e7d32' : '#6d6d6d'};">${driverData.isDriver ? 'ACTIVE' : 'INACTIVE'}</span></div></div>
            <div class="info-row"><div class="info-label">Assigned Deliveries:</div><div class="info-value">${deliveriesCount}</div></div>
        </div>
    `;
}

// ========== UPDATE DRIVER ==========
async function updateDriver() {
    const fullName = document.getElementById('fullName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const vehicleInfo = document.getElementById('vehicleInfo').value.trim();
    const isDriver = document.getElementById('isDriver').checked;
    
    if (!fullName || !phoneNumber || !email) {
        showError('Please fill in all required fields');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (password && password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const updateData = {
            fullName: fullName,
            phoneNumber: phoneNumber,
            email: email.toLowerCase(),
            vehicleInfo: vehicleInfo || null,
            isDriver: isDriver
        };
        
        if (password) {
            updateData.password = password;
        }
        
        console.log('📤 Updating driver:', updateData);
        
        const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update driver');
        }
        
        showToast('Driver updated successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'driver_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to update: ' + error.message);
        showLoading(false);
    }
}

// ========== DELETE DRIVER ==========
async function deleteDriver() {
    if (!driverId) return;
    
    if (!confirm(`⚠️ Permanently delete driver "${driverData?.fullName}"?\n\nThis action cannot be undone.`)) return;
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/drivers/${driverId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Driver deleted successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'driver_management_screen.html';
        }, 1500);
        
    } catch (error) {
        showError('Failed to delete: ' + error.message);
        showLoading(false);
    }
}

// ========== HELPER FUNCTIONS ==========
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

// Password toggle
const toggleBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');
if (toggleBtn && passwordInput) {
    let showPassword = false;
    toggleBtn.addEventListener('click', () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        toggleBtn.innerHTML = showPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    });
}

// ========== INITIALIZE ==========
document.getElementById('updateBtn')?.addEventListener('click', updateDriver);
document.getElementById('deleteBtn')?.addEventListener('click', deleteDriver);

if (checkAuth()) {
    fetchDriver();
}