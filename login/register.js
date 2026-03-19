// login/register.js - UPDATED FOR PRODUCTION API
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Register page loaded');
    
    // DOM Elements
    const backButton = document.getElementById('backButton');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const loginLink = document.getElementById('loginLink');
    const snackbar = document.getElementById('snackbar');
    
    // Verification modal elements
    const verificationModal = document.getElementById('verificationModal');
    const verificationEmail = document.getElementById('verificationEmail');
    const verificationCode = document.getElementById('verificationCode');
    const verificationError = document.getElementById('verificationError');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const verifyBtn = document.getElementById('verifyBtn');
    
    // API Configuration - USE PRODUCTION API
    const API_BASE_URL = window.location.origin; // Uses current domain (app.wineandbubblesnow.co.za)
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
    
    if (toggleConfirmPassword && confirmPasswordInput) {
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
            confirmPasswordInput.type = type;
            toggleConfirmPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }
    
    // Login link
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'login.html';
        });
    }
    
    // Form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                await register();
            }
        });
    }
    
    // Verification modal buttons
    if (verifyBtn) {
        verifyBtn.addEventListener('click', verifyEmail);
    }
    
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener('click', resendVerificationCode);
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
                }
            }
        }
    }
    
    function validateForm() {
        let isValid = true;
        
        // Clear previous errors
        clearAllErrors();
        
        // First name validation
        const firstName = firstNameInput.value.trim();
        if (!firstName) {
            showError('firstNameError', 'First name is required');
            isValid = false;
        } else if (firstName.length < 2) {
            showError('firstNameError', 'First name must be at least 2 characters');
            isValid = false;
        }
        
        // Last name validation
        const lastName = lastNameInput.value.trim();
        if (!lastName) {
            showError('lastNameError', 'Last name is required');
            isValid = false;
        } else if (lastName.length < 2) {
            showError('lastNameError', 'Last name must be at least 2 characters');
            isValid = false;
        }
        
        // Email validation
        const email = emailInput.value.trim();
        if (!email) {
            showError('emailError', 'Email is required');
            isValid = false;
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showError('emailError', 'Enter a valid email address');
                isValid = false;
            }
        }
        
        // Phone validation (optional)
        const phone = phoneInput.value.trim();
        if (phone) {
            // Basic phone validation - allows various formats
            const phoneRegex = /^[0-9\s\-\+\(\)]{10,15}$/;
            if (!phoneRegex.test(phone)) {
                showError('phoneError', 'Enter a valid phone number');
                isValid = false;
            }
        }
        
        // Password validation
        const password = passwordInput.value.trim();
        if (!password) {
            showError('passwordError', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        // Confirm password validation
        const confirmPassword = confirmPasswordInput.value.trim();
        if (!confirmPassword) {
            showError('confirmPasswordError', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }
        
        // Terms validation
        if (!termsCheckbox.checked) {
            showError('termsError', 'You must agree to the terms and conditions');
            isValid = false;
        }
        
        return isValid;
    }
    
    async function register() {
        if (submitBtn) {
            submitBtn.disabled = true;
            btnText.textContent = 'Creating Account...';
            loadingSpinner.style.display = 'inline-block';
        }
        
        const userData = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim().toLowerCase(),
            phoneNumber: phoneInput.value.trim() || null,
            password: passwordInput.value.trim()
        };
        
        try {
            console.log('📝 Registering user:', userData.email);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(userData)
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
            
            if (response.ok && data.success) {
                // Registration successful
                if (successMessage) {
                    successMessage.textContent = 'Registration successful! Please verify your email.';
                    successMessage.style.display = 'block';
                }
                
                // Store email for verification
                if (verificationEmail) {
                    verificationEmail.textContent = userData.email;
                }
                
                // Show verification modal
                if (verificationModal) {
                    verificationModal.style.display = 'flex';
                }
                
                // Clear form
                registerForm.reset();
                
                showSnackbar('Registration successful! Please verify your email.', 'success');
                
            } else {
                throw new Error(data.message || 'Registration failed');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            if (errorMessage) {
                errorMessage.textContent = error.message || 'Registration failed. Please try again.';
                errorMessage.style.display = 'block';
            }
            showSnackbar(error.message || 'Registration failed', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                btnText.textContent = 'CREATE ACCOUNT';
                loadingSpinner.style.display = 'none';
            }
        }
    }
    
    async function verifyEmail() {
        const code = verificationCode.value.trim();
        const email = verificationEmail.textContent;
        
        if (!code || code.length !== 6) {
            if (verificationError) {
                verificationError.textContent = 'Please enter a valid 6-digit code';
                verificationError.style.display = 'block';
            }
            return;
        }
        
        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<div class="loading-spinner"></div>';
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
                // Verification successful
                showSnackbar('Email verified successfully!', 'success');
                
                // Close modal and redirect to login
                setTimeout(() => {
                    if (verificationModal) {
                        verificationModal.style.display = 'none';
                    }
                    window.location.href = 'login.html?verified=true';
                }, 1500);
                
            } else {
                throw new Error(data.message || 'Verification failed');
            }
            
        } catch (error) {
            console.error('Verification error:', error);
            if (verificationError) {
                verificationError.textContent = error.message || 'Invalid verification code';
                verificationError.style.display = 'block';
            }
            showSnackbar(error.message || 'Verification failed', 'error');
        } finally {
            if (verifyBtn) {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify';
            }
        }
    }
    
    async function resendVerificationCode() {
        const email = verificationEmail.textContent;
        
        if (resendCodeBtn) {
            resendCodeBtn.disabled = true;
            resendCodeBtn.textContent = 'Sending...';
        }
        
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
                showSnackbar('Verification code resent!', 'success');
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Failed to resend code');
            }
            
        } catch (error) {
            console.error('Resend error:', error);
            showSnackbar(error.message || 'Failed to resend code', 'error');
        } finally {
            if (resendCodeBtn) {
                resendCodeBtn.disabled = false;
                resendCodeBtn.textContent = 'Resend Code';
            }
        }
    }
    
    function clearAllErrors() {
        const errorElements = document.querySelectorAll('.input-error');
        errorElements.forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });
        if (errorMessage) errorMessage.style.display = 'none';
        if (verificationError) verificationError.style.display = 'none';
    }
    
    function showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
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
    
    // Close verification modal when clicking outside
    if (verificationModal) {
        verificationModal.addEventListener('click', function(e) {
            if (e.target === verificationModal) {
                verificationModal.style.display = 'none';
            }
        });
    }
    
    // Auto-focus first name field
    if (firstNameInput) {
        setTimeout(() => firstNameInput.focus(), 300);
    }
    
    console.log('✅ Register script initialized');
});