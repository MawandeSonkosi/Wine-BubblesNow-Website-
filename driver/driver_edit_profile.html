// Driver Edit Profile JavaScript

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

function loadDriverData() {
    document.getElementById('fullName').value = currentDriver.fullName || '';
    document.getElementById('email').value = currentDriver.email || '';
    document.getElementById('phoneNumber').value = currentDriver.phoneNumber || '';
    document.getElementById('vehicleInfo').value = currentDriver.vehicleInfo || '';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => successDiv.style.display = 'none', 3000);
}

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingContainer');
    const saveBtn = document.getElementById('saveBtn');
    if (show) {
        loadingDiv.style.display = 'block';
        if (saveBtn) saveBtn.disabled = true;
    } else {
        loadingDiv.style.display = 'none';
        if (saveBtn) saveBtn.disabled = false;
    }
}

async function saveProfile(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const vehicleInfo = document.getElementById('vehicleInfo').value.trim();
    
    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    if (!phoneNumber) {
        showError('Phone number is required');
        return;
    }
    
    showLoading(true);
    
    try {
        const token = localStorage.getItem('driver_auth_token');
        const updateData = {
            email: email.toLowerCase(),
            phoneNumber: phoneNumber,
            vehicleInfo: vehicleInfo || null
        };
        
        const response = await fetch(`${API_BASE}/api/drivers/${currentDriver.id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }
        
        const data = await response.json();
        const updatedDriver = data.data || data;
        
        // Update local storage
        localStorage.setItem('driver_data', JSON.stringify(updatedDriver));
        currentDriver = updatedDriver;
        
        showSuccess('Profile updated successfully!');
        
        setTimeout(() => {
            window.location.href = 'driver_profile.html';
        }, 1500);
        
    } catch (error) {
        showError(error.message);
        showLoading(false);
    }
}

document.getElementById('editProfileForm')?.addEventListener('submit', saveProfile);

if (checkAuth()) {
    loadDriverData();
}