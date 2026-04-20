// Driver Change Password JavaScript

const API_BASE = window.location.origin;
let resetToken = null;
let driverEmail = null;

function checkAuth() {
    const token = localStorage.getItem('driver_auth_token');
    const driverData = localStorage.getItem('driver_data');
    
    if (!token || !driverData) {
        alert('Please login as driver');
        window.location.href = '../login/login.html';
        return false;
    }
    
    try {
        const driver = JSON.parse(driverData);
        driverEmail = driver.email;
        return true;
    } catch(e) {
        window.location.href = '../login/login.html';
        return false;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

async function sendOTP() {
    const sendBtn = document.getElementById('sendOtpBtn');
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE}/api/drivers/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: driverEmail })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('otpSection').style.display = 'none';
            document.getElementById('verifySection').style.display = 'block';
            alert('OTP sent to your email!');
        } else {
            throw new Error(data.message || 'Failed to send OTP');
        }
    } catch (error) {
        showError(error.message);
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send OTP';
    }
}

async function verifyOTP() {
    const otp = document.getElementById('otpCode').value.trim();
    if (!otp || otp.length !== 6) {
        document.getElementById('otpError').style.display = 'block';
        return;
    }
    document.getElementById('otpError').style.display = 'none';
    
    const verifyBtn = document.getElementById('sendOtpBtn');
    if (verifyBtn) verifyBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE}/api/drivers/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: driverEmail, otp: otp })
        });
        
        const data = await response.json();
        
        if (response.ok && data.resetToken) {
            resetToken = data.resetToken;
            document.getElementById('verifySection').style.display = 'none';
            document.getElementById('passwordSection').style.display = 'block';
        } else {
            throw new Error(data.message || 'Invalid OTP');
        }
    } catch (error) {
        showError(error.message);
        if (verifyBtn) verifyBtn.disabled = false;
    }
}

async function changePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!newPassword || newPassword.length < 6) {
        document.getElementById('passwordError').style.display = 'block';
        return;
    }
    document.getElementById('passwordError').style.display = 'none';
    
    if (newPassword !== confirmPassword) {
        document.getElementById('confirmError').style.display = 'block';
        return;
    }
    document.getElementById('confirmError').style.display = 'none';
    
    const changeBtn = document.getElementById('changePasswordBtn');
    changeBtn.disabled = true;
    changeBtn.textContent = 'Changing...';
    
    try {
        const response = await fetch(`${API_BASE}/api/drivers/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resetToken: resetToken, newPassword: newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Password changed successfully! Please login again.');
            localStorage.removeItem('driver_auth_token');
            localStorage.removeItem('driver_data');
            window.location.href = '../login/login.html';
        } else {
            throw new Error(data.message || 'Failed to change password');
        }
    } catch (error) {
        showError(error.message);
        changeBtn.disabled = false;
        changeBtn.textContent = 'Change Password';
    }
}

async function resendOTP() {
    const resendLink = document.getElementById('resendOtpLink');
    resendLink.style.opacity = '0.5';
    resendLink.style.pointerEvents = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/api/drivers/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: driverEmail })
        });
        
        if (response.ok) {
            alert('New OTP sent to your email!');
        } else {
            throw new Error('Failed to resend OTP');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        setTimeout(() => {
            resendLink.style.opacity = '1';
            resendLink.style.pointerEvents = 'auto';
        }, 30000);
    }
}

// Password toggle
function setupPasswordToggle(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    if (input && toggle) {
        toggle.addEventListener('click', () => {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            toggle.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
}

document.getElementById('sendOtpBtn')?.addEventListener('click', sendOTP);
document.getElementById('otpCode')?.addEventListener('input', () => {
    if (document.getElementById('otpCode').value.length === 6) verifyOTP();
});
document.getElementById('resendOtpLink')?.addEventListener('click', resendOTP);
document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);
setupPasswordToggle('newPassword', 'toggleNewPwd');
setupPasswordToggle('confirmPassword', 'toggleConfirmPwd');

if (checkAuth()) {}