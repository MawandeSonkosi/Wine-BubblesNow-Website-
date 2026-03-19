// login/login.js - WITH PROPER WELCOME BACK MESSAGE
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
    
    // API Configuration - USE PRODUCTION API (app.wineandbubblesnow.co.za)
    const API_BASE_URL = window.location.origin; // Uses https://app.wineandbubblesnow.co.za
    console.log('🌐 Using production API:', API_BASE_URL);
    
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
    
    // Functions
    function checkAuth() {
        const token = localStorage.getItem('wineBubbles_token');
        const userData = localStorage.getItem('wineBubbles_user');
        
        if (token && userData) {
            // Verify token isn't expired
            const timestamp = localStorage.getItem('wineBubbles_token_timestamp');
            if (timestamp) {
                const tokenAge = Date.now() - parseInt(timestamp);
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                
                if (tokenAge < sevenDays) {
                    console.log('✅ Already logged in, redirecting to home');
                    window.location.href = '../index.html';
                    return;
                } else {
                    // Token expired, clear it
                    localStorage.removeItem('wineBubbles_token');
                    localStorage.removeItem('wineBubbles_token_timestamp');
                    localStorage.removeItem('wineBubbles_user');
                }
            }
        }
    }
    
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        if (emailError) emailError.style.display = 'none';
        if (passwordError) passwordError.style.display = 'none';
        if (errorMessage) errorMessage.style.display = 'none';
        
        // Email validation
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
        
        // Password validation
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
    
    // Function to show welcome toast that matches website layout
    function showWelcomeToast(userName) {
        // Create toast container
        const toast = document.createElement('div');
        toast.className = 'welcome-toast';
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
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Create icon
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
        iconDiv.innerHTML = '<i class="fas fa-wine-glass-alt"></i>';
        
        // Create content
        const contentDiv = document.createElement('div');
        contentDiv.style.flex = '1';
        
        const title = document.createElement('div');
        title.style.cssText = `
            font-family: 'Playfair Display', serif;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        `;
        title.textContent = 'Welcome Back!';
        
        const message = document.createElement('div');
        message.style.cssText = `
            font-size: 16px;
            opacity: 0.9;
        `;
        message.textContent = userName ? `Hello, ${userName}!` : 'Hello, Wine Lover!';
        
        contentDiv.appendChild(title);
        contentDiv.appendChild(message);
        
        // Create close button
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
        
        // Assemble toast
        toast.appendChild(iconDiv);
        toast.appendChild(contentDiv);
        toast.appendChild(closeBtn);
        
        // Add to body
        document.body.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOutRight 0.5s ease forwards';
                setTimeout(() => toast.remove(), 500);
            }
        }, 5000);
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
            console.log('🔐 Attempting login for:', email);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            let data;
            try {
                data = await response.json();
                console.log('📦 Response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                throw new Error('Invalid server response');
            }
            
            // Check if response is OK (status 200)
            if (response.ok) {
                // Login successful - EXACTLY like Flutter app
                console.log('✅ Login successful!');
                
                // Store user data - EXACTLY like Flutter's login method
                storeUserData(data);
                
                // Save email if remember me is checked
                if (rememberMe && rememberMe.checked && email) {
                    localStorage.setItem('wineBubbles_rememberedEmail', email);
                }
                
                // Get user name for welcome message
                const user = data.user;
                const userName = user ? (user.fullName || user.email.split('@')[0]) : null;
                
                // Show welcome toast
                showWelcomeToast(userName);
                
                // Show success message in snackbar
                showSnackbar('Login successful!', 'success');
                
                // Redirect to home page after delay with welcome message
                setTimeout(() => {
                    window.location.href = '../index.html?login=success';
                }, 2000);
                
                return; // Important: stop execution
            }
            
            // Handle verification requirement (like Flutter's needsVerification)
            if (data.needsVerification === true) {
                showVerificationPrompt(email);
            } else {
                // Show error message from backend (like Flutter)
                throw new Error(data.message || 'Login failed');
            }
            
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
    
    // Store user data - EXACTLY like Flutter's storeUserData
    function storeUserData(data) {
        console.log('💾 Storing user data...');
        
        // Store token if present (like Flutter's _storeToken)
        if (data.token) {
            localStorage.setItem('wineBubbles_token', data.token);
            localStorage.setItem('wineBubbles_token_timestamp', Date.now().toString());
        }
        
        // Handle user data - Flutter uses data['user']
        const user = data.user;
        
        if (user) {
            // Store full user object
            localStorage.setItem('wineBubbles_user', JSON.stringify(user));
            
            // Store individual fields for easy access
            if (user.fullName) {
                localStorage.setItem('wineBubbles_userFullName', user.fullName);
            }
            if (user.email) {
                localStorage.setItem('wineBubbles_userEmail', user.email);
            }
            if (user.phoneNumber) {
                localStorage.setItem('wineBubbles_userPhone', user.phoneNumber);
            }
            if (user.isAdmin) {
                localStorage.setItem('wineBubbles_isAdmin', 'true');
            }
            if (user.isDriver) {
                localStorage.setItem('wineBubbles_isDriver', 'true');
            }
        }
        
        // Set flag for homepage to reset cart
        localStorage.setItem('wineBubbles_justLoggedIn', 'true');
        
        console.log('✅ User data stored');
    }
    
    function showVerificationPrompt(email) {
        // Create verification modal
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
        
        // Focus input
        setTimeout(() => {
            const codeInput = document.getElementById('verifyCode');
            if (codeInput) codeInput.focus();
        }, 100);
        
        // Handle verify
        document.getElementById('submitVerify').addEventListener('click', async () => {
            const code = document.getElementById('verifyCode').value;
            if (!code || code.length !== 6) {
                alert('Please enter a valid 6-digit code');
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        verificationCode: code
                    })
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
        
        // Handle cancel
        document.getElementById('cancelVerify').addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle resend
        document.getElementById('resendVerify').addEventListener('click', async (e) => {
            e.preventDefault();
            
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
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
        
        if (type === 'error') {
            snackbar.classList.add('error');
        } else if (type === 'success') {
            snackbar.classList.add('success');
        }
        
        snackbar.classList.add('show');
        
        setTimeout(() => {
            snackbar.classList.remove('show');
        }, 3000);
    }
    
    // Load remembered email
    const rememberedEmail = localStorage.getItem('wineBubbles_rememberedEmail');
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMe) {
            rememberMe.checked = true;
        }
    }
    
    // Auto-focus email field
    if (emailInput && !emailInput.value) {
        setTimeout(() => emailInput.focus(), 300);
    }
    
    console.log('✅ Login script initialized');
});