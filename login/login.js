// login/login.js - UPDATED TO MATCH FLUTTER APP
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Login page loaded');
    
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    // API base URL - USE PRODUCTION API LIKE FLUTTER
    const API_BASE_URL = 'https://www.wineandbubblesnow.co.za';
    
    function showError(message, isSuccess = false) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
            errorMessage.style.color = isSuccess ? '#28a745' : '#721c24';
            errorMessage.style.background = isSuccess ? '#d4edda' : '#f8d7da';
            errorMessage.style.border = isSuccess ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
            console.error('Error:', message);
        }
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    function setLoading(isLoading) {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        
        if (submitBtn && btnText && loadingSpinner) {
            if (isLoading) {
                submitBtn.disabled = true;
                btnText.style.display = 'none';
                loadingSpinner.style.display = 'block';
            } else {
                submitBtn.disabled = false;
                btnText.style.display = 'block';
                loadingSpinner.style.display = 'none';
            }
        }
    }
    
    async function loginUser(email, password) {
        console.log(`🔐 Attempting login for: ${email}`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
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
                const text = await response.text();
                console.error('Raw response:', text);
                return { 
                    success: false, 
                    error: 'Invalid server response format',
                    needsVerification: false
                };
            }
            
            if (!response.ok) {
                // Check for verification requirement (like Flutter app)
                if (data.needsVerification === true || 
                    data.message?.toLowerCase().includes('verify') ||
                    data.message?.toLowerCase().includes('verification')) {
                    return { 
                        success: false, 
                        error: data.message || 'Please verify your email first.',
                        needsVerification: true,
                        email: data.email || email
                    };
                }
                
                return { 
                    success: false, 
                    error: data.message || `Login failed (${response.status})`,
                    needsVerification: false
                };
            }
            
            console.log('✅ Login successful!', data);
            return { 
                success: true, 
                data: data,
                needsVerification: false
            };
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                return { 
                    success: false, 
                    error: 'Cannot connect to server. Please check if the server is running.',
                    needsVerification: false
                };
            }
            
            return { 
                success: false, 
                error: `Connection error: ${error.message}`,
                needsVerification: false
            };
        }
    }
    
    // After successful login, set the flag and clear cart
// In login/login.js - storeUserData function
function storeUserData(userData) {
    console.log('💾 Storing user data...');
    
    // DO NOT clear cart here - let homepage handle it
    
    // Store user data
    if (userData.token) {
        localStorage.setItem('wineBubbles_token', userData.token);
        localStorage.setItem('wineBubbles_token_timestamp', Date.now().toString());
    }
    
    if (userData.user) {
        localStorage.setItem('wineBubbles_user', JSON.stringify(userData.user));
        // ... store other user fields
    }
    
    // IMPORTANT: Set this flag to tell homepage to reset cart
    localStorage.setItem('wineBubbles_justLoggedIn', 'true');
    
    console.log('✅ User data stored, cart will be reset on homepage');
}
    async function verifyEmail(email, verificationCode) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    verificationCode: verificationCode
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Verification failed');
            }
            
            const data = await response.json();
            return { success: true, data: data };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // Test server connection
    async function testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server is running:', data.message);
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Server is not reachable:', error);
            return false;
        }
    }
    
    // Main form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            hideError();
            
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            
            // Basic validation
            if (!email || !email.includes('@')) {
                showError('Please enter a valid email address');
                emailInput.focus();
                return;
            }
            
            if (!password || password.length < 6) {
                showError('Password must be at least 6 characters');
                passwordInput.focus();
                return;
            }
            
            console.log('🚀 Starting login process...');
            setLoading(true);
            
            try {
                const result = await loginUser(email, password);
                
                if (result.success) {
                    storeUserData(result.data);
                    
                    showError('✓ Login successful! Redirecting...', true);
                    
                    setTimeout(() => {
                        // Redirect to homepage with success parameter
                        window.location.href = '../index.html?login=success';
                    }, 1500);
                    
                } else {
                    if (result.needsVerification) {
                        console.log('📧 User needs verification - showing prompt');
                        
                        // Show verification modal/prompt
                        const verificationModal = document.createElement('div');
                        verificationModal.style.cssText = `
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: rgba(0,0,0,0.8);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 9999;
                        `;
                        
                        verificationModal.innerHTML = `
                            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 400px; width: 90%;">
                                <h3 style="color: #6b0d2b; margin-bottom: 15px; font-family: 'Playfair Display', serif;">
                                    Verify Your Email
                                </h3>
                                <p style="color: #666; margin-bottom: 20px;">
                                    We've sent a 6-digit verification code to <strong>${email}</strong>.
                                    Please enter it below:
                                </p>
                                <input type="text" id="verificationCode" 
                                       placeholder="Enter 6-digit code" 
                                       style="width: 100%; padding: 12px; border: 2px solid #ddd; 
                                              border-radius: 8px; font-size: 16px; margin-bottom: 15px;"
                                       maxlength="6">
                                <div style="display: flex; gap: 10px;">
                                    <button id="cancelVerify" 
                                            style="flex: 1; padding: 12px; background: #f5f5f5; 
                                                   border: none; border-radius: 8px; cursor: pointer;">
                                        Cancel
                                    </button>
                                    <button id="submitVerify" 
                                            style="flex: 1; padding: 12px; background: #6b0d2b; 
                                                   color: white; border: none; border-radius: 8px; cursor: pointer;">
                                        Verify
                                    </button>
                                </div>
                                <p style="font-size: 12px; color: #999; margin-top: 15px; text-align: center;">
                                    Didn't receive the code? Check your spam folder or 
                                    <a href="#" id="resendCode" style="color: #6b0d2b;">resend code</a>
                                </p>
                            </div>
                        `;
                        
                        document.body.appendChild(verificationModal);
                        
                        // Focus on verification code input
                        setTimeout(() => {
                            const codeInput = document.getElementById('verificationCode');
                            if (codeInput) codeInput.focus();
                        }, 100);
                        
                        // Handle verification submission
                        document.getElementById('submitVerify').addEventListener('click', async () => {
                            const code = document.getElementById('verificationCode').value;
                            if (!code || code.length !== 6) {
                                alert('Please enter a valid 6-digit code');
                                return;
                            }
                            
                            setLoading(true);
                            const verifyResult = await verifyEmail(email, code);
                            
                            if (verifyResult.success) {
                                storeUserData(verifyResult.data);
                                verificationModal.remove();
                                showError('✓ Email verified! Redirecting...', true);
                                
                                setTimeout(() => {
                                    window.location.href = '../index.html?login=success';
                                }, 1500);
                            } else {
                                alert(`Verification failed: ${verifyResult.error}`);
                                setLoading(false);
                            }
                        });
                        
                        // Handle cancel
                        document.getElementById('cancelVerify').addEventListener('click', () => {
                            verificationModal.remove();
                            setLoading(false);
                            passwordInput.value = '';
                            passwordInput.focus();
                        });
                        
                        // Handle resend code
                        document.getElementById('resendCode').addEventListener('click', async (e) => {
                            e.preventDefault();
                            alert('Code resent! Please check your email.');
                            // You can implement actual resend logic here
                        });
                        
                    } else {
                        showError(result.error);
                        passwordInput.value = '';
                        passwordInput.focus();
                    }
                }
                
            } catch (error) {
                console.error('🚨 Unexpected error:', error);
                showError('An unexpected error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        });
    }
    
    // Password toggle
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
                icon.title = 'Hide password';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
                icon.title = 'Show password';
            }
        });
    }
    
    // Remember me functionality
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const rememberedEmail = localStorage.getItem('wineBubbles_rememberedEmail');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberMeCheckbox) {
            rememberMeCheckbox.checked = true;
        }
    }
    
    // Save email if remember me is checked
    if (rememberMeCheckbox) {
        rememberMeCheckbox.addEventListener('change', function() {
            if (!this.checked) {
                localStorage.removeItem('wineBubbles_rememberedEmail');
                console.log('🗑️ Cleared remembered email');
            }
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const email = this.value.trim();
            if (rememberMeCheckbox && rememberMeCheckbox.checked && email) {
                localStorage.setItem('wineBubbles_rememberedEmail', email);
                console.log('💾 Saved email for remember me');
            }
        });
    }
    
    // Sign up link
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        signupLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
    
    // Forgot password link
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot_password.html';
        });
    }
    
    // Back button
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    }
    
    // Auto-focus email field
    if (emailInput && !emailInput.value) {
        setTimeout(() => emailInput.focus(), 300);
    }
    
    // Test connection on load
    setTimeout(async () => {
        const isConnected = await testConnection();
        if (!isConnected) {
            console.warn('⚠️ Server is not reachable');
        }
    }, 1000);
    
    console.log('✅ Login script initialized');
});