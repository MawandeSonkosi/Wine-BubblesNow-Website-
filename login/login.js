// login/login.js - UPDATED WITH CORRECT PATHS
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Login page loaded');
    
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');
    
    // API base URL - same origin (Node.js server)
    const API_BASE_URL = window.location.origin; // Will be http://localhost:3000
    console.log('🌐 API Base URL:', API_BASE_URL);
    
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
                // Check for verification requirement
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
    
    function storeUserData(userData) {
        console.log('💾 Storing user data...');
        
        if (userData.token) {
            localStorage.setItem('wineBubbles_token', userData.token);
            localStorage.setItem('wineBubbles_token_timestamp', Date.now().toString());
            console.log('✅ Token stored');
        }
        
        if (userData.user) {
            localStorage.setItem('wineBubbles_user', JSON.stringify(userData.user));
            localStorage.setItem('wineBubbles_isAdmin', userData.user.isAdmin || 'false');
            localStorage.setItem('wineBubbles_isDriver', userData.user.isDriver || 'false');
            localStorage.setItem('wineBubbles_userEmail', userData.user.email);
            console.log('✅ User data stored:', userData.user.email);
        }
    }
    
    // Test server connection
    async function testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
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
            
            // Test connection first
            const isConnected = await testConnection();
            if (!isConnected) {
                showError('Server is not running. Please start the Node.js server.');
                setLoading(false);
                return;
            }
            
            try {
                const result = await loginUser(email, password);
                
                if (result.success) {
                    storeUserData(result.data);
                    
                    showError('✓ Login successful! Redirecting...', true);
                    
                    setTimeout(() => {
                        // Redirect to homepage (which is at root)
                        window.location.href = '/index.html?login=success';
                    }, 1500);
                    
                } else {
                    if (result.needsVerification) {
                        console.log('📧 User needs verification');
                        // Simple verification prompt
                        const code = prompt(`Please enter the verification code sent to ${email}:`, '');
                        if (code && code.length === 6) {
                            // Verify the code
                            setLoading(true);
                            try {
                                const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        email: email.toLowerCase().trim(),
                                        verificationCode: code 
                                    })
                                });
                                
                                const verifyData = await verifyResponse.json();
                                
                                if (verifyResponse.ok) {
                                    storeUserData(verifyData);
                                    showError('✓ Email verified! Redirecting...', true);
                                    setTimeout(() => {
                                        window.location.href = '/index.html?login=success';
                                    }, 1500);
                                } else {
                                    showError(verifyData.message || 'Invalid verification code');
                                    passwordInput.value = '';
                                }
                            } catch (verifyError) {
                                showError('Verification failed. Please try again.');
                            } finally {
                                setLoading(false);
                            }
                        } else if (code !== null) {
                            showError('Please enter a valid 6-digit code');
                        }
                    } else {
                        showError(result.error);
                    }
                    passwordInput.value = '';
                    passwordInput.focus();
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
        console.log('✅ Sign up link found, will navigate to register.html');
    }
    
    
   const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'forgot_password.html';
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
            console.warn('⚠️ Server is not running');
            showError('⚠️ Note: Server is not running. Run: npm start');
        }
    }, 1000);
    
    console.log('✅ Login script initialized');
});