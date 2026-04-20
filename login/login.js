// login/login.js - WITH DRIVER LOGIN SUPPORT
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Login page loaded');
    
    // DOM Elements
    const backButton = document.getElementById('backButton');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberMe = document.getElementById('rememberMe');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const signupLink = document.getElementById('signupLink');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');
    const snackbar = document.getElementById('snackbar');
    
    // API Configuration
    const API_BASE_URL = window.location.origin;
    console.log('🌐 Using API:', API_BASE_URL);
    
    // Check if user is already logged in
    checkAuth();
    
    // Back button functionality
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.history.back();
        });
    }
    
    // Toggle password visibility
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot_password.html';
        });
    }
    
    // Sign up link
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (validateForm()) {
                await login();
            }
        });
    }
    
    function checkAuth() {
        const token = localStorage.getItem('wineBubbles_token');
        const userData = localStorage.getItem('wineBubbles_user');
        const driverToken = localStorage.getItem('driver_auth_token');
        const driverData = localStorage.getItem('driver_data');
        
        if (token && userData) {
            const timestamp = localStorage.getItem('wineBubbles_token_timestamp');
            if (timestamp) {
                const tokenAge = Date.now() - parseInt(timestamp);
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                
                if (tokenAge < sevenDays) {
                    try {
                        const user = JSON.parse(userData);
                        const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
                        const isDriver = localStorage.getItem('wineBubbles_isDriver') === 'true';
                        
                        if (isAdmin) {
                            console.log('✅ Already logged in as Admin');
                            window.location.href = '../admin/admin_dashboard.html';
                        } else if (isDriver) {
                            console.log('✅ Already logged in as Driver');
                            window.location.href = '../driver/driver_dashboard.html';
                        } else {
                            console.log('✅ Already logged in as User');
                            window.location.href = '../index.html';
                        }
                        return;
                    } catch(e) {}
                }
            }
        }
        
        // Check for driver session
        if (driverToken && driverData) {
            try {
                const driver = JSON.parse(driverData);
                if (driver.isDriver) {
                    console.log('✅ Already logged in as Driver (driver session)');
                    window.location.href = '../driver/driver_dashboard.html';
                    return;
                }
            } catch(e) {}
        }
        
        // Clear expired sessions
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
    }
    
    function validateForm() {
        let isValid = true;
        
        if (emailError) emailError.style.display = 'none';
        if (passwordError) passwordError.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        
        const email = emailInput.value.trim();
        if (!email) {
            if (emailError) {
                emailError.textContent = 'Email is required';
                emailError.style.display = 'block';
            }
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                if (emailError) {
                    emailError.textContent = 'Enter a valid email address';
                    emailError.style.display = 'block';
                }
                isValid = false;
            }
        }
        
        const password = passwordInput.value.trim();
        if (!password) {
            if (passwordError) {
                passwordError.textContent = 'Password is required';
                passwordError.style.display = 'block';
            }
            isValid = false;
        } else if (password.length < 6) {
            if (passwordError) {
                passwordError.textContent = 'Password must be at least 6 characters';
                passwordError.style.display = 'block';
            }
            isValid = false;
        }
        
        return isValid;
    }
    
    function showWelcomeToast(userName, role = 'user') {
        const toast = document.createElement('div');
        toast.className = 'welcome-toast';
        
        let iconHtml = '<i class="fas fa-wine-glass-alt"></i>';
        let titleText = 'Welcome Back!';
        
        if (role === 'admin') {
            iconHtml = '<i class="fas fa-crown"></i>';
            titleText = 'Welcome Admin!';
        } else if (role === 'driver') {
            iconHtml = '<i class="fas fa-truck"></i>';
            titleText = 'Welcome Driver!';
        }
        
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(135deg, #6b0d2b 0%, #8a1e3d 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(107, 13, 43, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 15px;
            animation: slideInRight 0.5s ease forwards;
            font-family: 'Montserrat', sans-serif;
            max-width: 400px;
            border-left: 5px solid #d4af37;
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        const iconDiv = document.createElement('div');
        iconDiv.style.cssText = `
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        `;
        iconDiv.innerHTML = iconHtml;
        
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        
        const title = document.createElement('div');
        title.style.cssText = `
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        `;
        title.textContent = titleText;
        
        const message = document.createElement('div');
        message.style.cssText = `font-size: 16px; opacity: 0.9;`;
        message.textContent = userName ? `Hello, ${userName}!` : 'Hello!';
        
        contentDiv.appendChild(title);
        contentDiv.appendChild(message);
        
        const closeBtn = document.createElement('button');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.3s;
            padding: 5px;
        `;
        closeBtn.innerHTML = '&times;';
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.7';
        closeBtn.onclick = () => {
            toast.style.animation = 'slideOutRight 0.5s ease forwards';
            setTimeout(() => toast.remove(), 500);
        };
        
        toast.appendChild(iconDiv);
        toast.appendChild(contentDiv);
        toast.appendChild(closeBtn);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.5s ease forwards';
                setTimeout(() => toast.remove(), 500);
            }
        }, 5000);
    }
    
    // ========== DRIVER LOGIN FUNCTION ==========
    async function driverLogin(email, password) {
        console.log('🚗 Attempting driver login for:', email);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/drivers/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log(`📡 Driver login response status: ${response.status}`);
            
            const data = await response.json();
            console.log('📦 Driver login response:', data);
            
            if (response.ok && data.success === true) {
                const driver = data.data;
                const token = data.token;
                
                if (driver && token) {
                    // Store driver session
                    localStorage.setItem('driver_auth_token', token);
                    localStorage.setItem('driver_data', JSON.stringify(driver));
                    localStorage.setItem('driver_token_timestamp', Date.now().toString());
                    
                    console.log('✅ Driver login successful:', driver.fullName);
                    return { success: true, driver: driver };
                }
            }
            
            return { success: false, error: data.message || 'Driver login failed' };
            
        } catch (error) {
            console.error('Driver login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ========== REGULAR USER LOGIN ==========
    async function userLogin(email, password) {
        console.log('👤 Attempting user login for:', email);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            console.log(`📡 User login response status: ${response.status}`);
            
            const data = await response.json();
            console.log('📦 User login response:', data);
            
            if (response.ok) {
                const user = data.user;
                const token = data.token;
                
                if (user && token) {
                    // Store user session
                    localStorage.setItem('wineBubbles_token', token);
                    localStorage.setItem('wineBubbles_token_timestamp', Date.now().toString());
                    localStorage.setItem('wineBubbles_user', JSON.stringify(user));
                    
                    if (user.fullName) localStorage.setItem('wineBubbles_userFullName', user.fullName);
                    if (user.email) localStorage.setItem('wineBubbles_userEmail', user.email);
                    if (user.phoneNumber) localStorage.setItem('wineBubbles_userPhone', user.phoneNumber);
                    
                    if (user.isAdmin) localStorage.setItem('wineBubbles_isAdmin', 'true');
                    if (user.isDriver) localStorage.setItem('wineBubbles_isDriver', 'true');
                    
                    console.log('✅ User login successful:', user.fullName);
                    return { success: true, user: user, isAdmin: user.isAdmin === true, isDriver: user.isDriver === true };
                }
            }
            
            if (data.needsVerification === true) {
                return { success: false, needsVerification: true, email: email };
            }
            
            return { success: false, error: data.message || 'Login failed' };
            
        } catch (error) {
            console.error('User login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async function login() {
        if (submitBtn) {
            submitBtn.disabled = true;
            btnText.textContent = 'Logging in...';
            loadingSpinner.style.display = 'inline-block';
        }
        
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();
        
        try {
            console.log('🔐 Attempting login sequence for:', email);
            
            // FIRST: Try driver login (matches Flutter order)
            console.log('🚗 Trying driver login...');
            const driverResult = await driverLogin(email, password);
            
            if (driverResult.success && driverResult.driver) {
                const driver = driverResult.driver;
                const userName = driver.fullName || email.split('@')[0];
                
                showWelcomeToast(userName, 'driver');
                showSnackbar('Driver login successful!', 'success');
                
                if (rememberMe && rememberMe.checked && email) {
                    localStorage.setItem('wineBubbles_rememberedEmail', email);
                }
                
                setTimeout(() => {
                    window.location.href = '../driver/driver_dashboard.html';
                }, 1500);
                return;
            }
            
            // SECOND: Try regular user login (which includes admin check)
            console.log('👤 Trying user login...');
            const userResult = await userLogin(email, password);
            
            if (userResult.success) {
                if (rememberMe && rememberMe.checked && email) {
                    localStorage.setItem('wineBubbles_rememberedEmail', email);
                }
                
                const userName = userResult.user?.fullName || email.split('@')[0];
                
                if (userResult.isAdmin) {
                    showWelcomeToast(userName, 'admin');
                    showSnackbar('Admin login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = '../admin/admin_dashboard.html';
                    }, 1500);
                } else if (userResult.isDriver) {
                    showWelcomeToast(userName, 'driver');
                    showSnackbar('Driver login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = '../driver/driver_dashboard.html';
                    }, 1500);
                } else {
                    showWelcomeToast(userName, 'user');
                    showSnackbar('Login successful!', 'success');
                    setTimeout(() => {
                        window.location.href = '../index.html?login=success';
                    }, 1500);
                }
                return;
            }
            
            // Handle verification requirement
            if (userResult.needsVerification) {
                showVerificationPrompt(userResult.email);
                return;
            }
            
            // All logins failed
            const errorMsg = driverResult.error || userResult.error || 'Login failed. Please check your credentials.';
            throw new Error(errorMsg);
            
        } catch (error) {
            console.error('Login error:', error);
            if (errorMessage) {
                errorMessage.textContent = error.message || 'Login failed. Please try again.';
                errorMessage.style.display = 'block';
            }
            showSnackbar(error.message || 'Login failed', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                btnText.textContent = 'LOG IN';
                loadingSpinner.style.display = 'none';
            }
        }
    }
    
    function storeUserData(data) {
        console.log('💾 Storing user data...');
        
        if (data.token) {
            localStorage.setItem('wineBubbles_token', data.token);
            localStorage.setItem('wineBubbles_token_timestamp', Date.now().toString());
        }
        
        const user = data.user;
        
        if (user) {
            localStorage.setItem('wineBubbles_user', JSON.stringify(user));
            
            if (user.fullName) localStorage.setItem('wineBubbles_userFullName', user.fullName);
            if (user.email) localStorage.setItem('wineBubbles_userEmail', user.email);
            if (user.phoneNumber) localStorage.setItem('wineBubbles_userPhone', user.phoneNumber);
            
            if (user.isAdmin) {
                localStorage.setItem('wineBubbles_isAdmin', 'true');
                console.log('👑 Admin flag saved');
            }
            if (user.isDriver) {
                localStorage.setItem('wineBubbles_isDriver', 'true');
                console.log('🚗 Driver flag saved');
            }
        }
        
        localStorage.setItem('wineBubbles_justLoggedIn', 'true');
        console.log('✅ User data stored');
    }
    
    function showVerificationPrompt(email) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 450px; width: 100%;">
                <h3 style="color: #6b0d2b; margin-bottom: 15px; font-family: 'Playfair Display', serif; font-size: 24px;">
                    Verify Your Email
                </h3>
                <p style="color: #555; margin-bottom: 20px;">
                    We've sent a verification code to <strong>${email}</strong>.
                    Please enter the 6-digit code below:
                </p>
                <input type="text" id="verifyCode" 
                       placeholder="Enter 6-digit code" 
                       style="width: 100%; padding: 16px; border: 2px solid #eee; border-radius: 8px; 
                              font-size: 20px; text-align: center; letter-spacing: 8px; margin-bottom: 20px;
                              font-family: monospace;"
                       maxlength="6">
                <div style="display: flex; gap: 10px;">
                    <button id="cancelVerify" 
                            style="flex: 1; padding: 14px; background: #f0f0f0; border: none; 
                                   border-radius: 8px; cursor: pointer; font-weight: 500;">
                        Cancel
                    </button>
                    <button id="submitVerify" 
                            style="flex: 1; padding: 14px; background: #6b0d2b; color: white; 
                                   border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">
                        Verify
                    </button>
                </div>
                <p style="font-size: 12px; color: #999; margin-top: 15px; text-align: center;">
                    Didn't receive the code? 
                    <a href="#" id="resendVerify" style="color: #6b0d2b;">Resend code</a>
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const codeInput = document.getElementById('verifyCode');
            if (codeInput) codeInput.focus();
        }, 100);
        
        document.getElementById('submitVerify').addEventListener('click', async () => {
            const code = document.getElementById('verifyCode').value;
            if (!code || code.length !== 6) {
                alert('Please enter a valid 6-digit code');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email, verificationCode: code })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    modal.remove();
                    showMessage('✓ Email verified! You can now log in.', 'success');
                    showSnackbar('Email verified successfully!', 'success');
                } else {
                    alert(data.message || 'Verification failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                alert('Verification failed. Please try again.');
            }
        });
        
        document.getElementById('cancelVerify').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('resendVerify').addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email })
                });
                
                if (response.ok) {
                    alert('Verification code resent! Please check your email.');
                } else {
                    alert('Failed to resend code. Please try again.');
                }
            } catch (error) {
                console.error('Resend error:', error);
                alert('Failed to resend code. Please try again.');
            }
        });
    }
    
    function showMessage(message, type = 'success') {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.className = type === 'error' ? 'error-message' : 'success-message';
            errorMessage.style.display = 'block';
        }
        showSnackbar(message, type);
    }
    
    function showSnackbar(message, type = 'success') {
        if (!snackbar) return;
        snackbar.textContent = message;
        snackbar.className = 'snackbar';
        if (type === 'error') snackbar.classList.add('error');
        else if (type === 'success') snackbar.classList.add('success');
        snackbar.classList.add('show');
        setTimeout(() => snackbar.classList.remove('show'), 3000);
    }
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('wineBubbles_rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMe) rememberMe.checked = true;
    }
    
    // Auto-focus email field
    if (emailInput && !emailInput.value) {
        setTimeout(() => emailInput.focus(), 300);
    }
    
    console.log('✅ Login script initialized');
});