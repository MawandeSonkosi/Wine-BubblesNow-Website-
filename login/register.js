// login/register.js - UPDATED WITH PROPER PHONE VALIDATION
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Register page loaded');
    
    const form = document.getElementById('registerForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const termsCheckbox = document.getElementById('terms');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const verificationModal = document.getElementById('verificationModal');
    const verificationEmail = document.getElementById('verificationEmail');
    
    // API base URL - same as login
    const API_BASE_URL = window.location.origin; // Will be http://localhost:3000
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    let currentEmail = '';
    
    // Phone validation function - more lenient for South African numbers
    function isValidPhoneNumber(phone) {
        if (!phone || phone.trim() === '') return true; // Phone is optional
        
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // South African numbers can be:
        // - 10 digits: 0123456789
        // - 11 digits: 01234567890
        // - International: +27123456789 (remove + for validation)
        
        if (cleaned.length < 10 || cleaned.length > 13) {
            return false;
        }
        
        // Check if it starts with valid South African prefixes
        const validPrefixes = [
            '27', // South Africa country code
            '0'   // Local numbers
        ];
        
        // Check if the cleaned number starts with any valid prefix
        const startsWithValidPrefix = validPrefixes.some(prefix => 
            cleaned.startsWith(prefix)
        );
        
        if (!startsWithValidPrefix) {
            // Check if it might be an international number with country code
            if (cleaned.length >= 11) {
                return true; // Could be valid international number
            }
            return false;
        }
        
        return true;
    }
    
    function formatPhoneNumber(phone) {
        if (!phone || phone.trim() === '') return '';
        
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // If it starts with country code 27, format as +27
        if (cleaned.startsWith('27') && cleaned.length >= 11) {
            return `+${cleaned}`;
        }
        
        // If it starts with 0 and is 10 digits, format as local
        if (cleaned.startsWith('0') && cleaned.length === 10) {
            return cleaned;
        }
        
        // Return cleaned version
        return cleaned;
    }
    
    function showError(message, isSuccess = false) {
        if (isSuccess) {
            if (successMessage) {
                successMessage.textContent = message;
                successMessage.style.display = 'block';
                successMessage.style.color = '#28a745';
                successMessage.style.background = '#d4edda';
                successMessage.style.border = '1px solid #c3e6cb';
                console.log('Success:', message);
            }
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        } else {
            if (errorMessage) {
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                errorMessage.style.color = '#721c24';
                errorMessage.style.background = '#f8d7da';
                errorMessage.style.border = '1px solid #f5c6cb';
                console.error('Error:', message);
            }
            if (successMessage) {
                successMessage.style.display = 'none';
            }
        }
    }
    
    function hideMessages() {
        if (errorMessage) errorMessage.style.display = 'none';
        if (successMessage) successMessage.style.display = 'none';
    }
    
    function showVerificationModal(email) {
        currentEmail = email;
        if (verificationModal && verificationEmail) {
            verificationEmail.textContent = email;
            verificationModal.style.display = 'block';
        }
    }
    
    function hideVerificationModal() {
        if (verificationModal) {
            verificationModal.style.display = 'none';
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
    
    function validateForm() {
        hideMessages();
        
        // Name validation
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        
        if (!firstName) {
            showError('First name is required');
            firstNameInput.focus();
            return false;
        }
        
        if (!lastName) {
            showError('Last name is required');
            lastNameInput.focus();
            return false;
        }
        
        // Email validation
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            showError('Please enter a valid email address');
            emailInput.focus();
            return false;
        }
        
        // Phone validation
        const phone = phoneInput.value.trim();
        if (phone && !isValidPhoneNumber(phone)) {
            showError('Please enter a valid phone number (e.g., 0123456789 or +27123456789)');
            phoneInput.focus();
            return false;
        }
        
        // Password validation
        const password = passwordInput.value;
        if (!password || password.length < 6) {
            showError('Password must be at least 6 characters');
            passwordInput.focus();
            return false;
        }
        
        // Confirm password validation
        if (password !== confirmPasswordInput.value) {
            showError('Passwords do not match');
            confirmPasswordInput.focus();
            return false;
        }
        
        // Terms validation
        if (!termsCheckbox.checked) {
            showError('You must agree to the terms and conditions');
            return false;
        }
        
        return true;
    }
    
    async function checkDuplicateUser(email, phone) {
        try {
            console.log('🔍 Checking for duplicate user...');
            
            // We'll check both email and phone by making a request to a dedicated endpoint
            // or by trying to register and letting backend handle duplication
            // For now, we'll just log and let backend handle it
            console.log(`Checking: Email=${email}, Phone=${phone || 'Not provided'}`);
            
            // In a real implementation, you might want to call an endpoint like:
            // /api/auth/check-duplicate?email=${email}&phone=${phone}
            
            return { hasDuplicate: false };
            
        } catch (error) {
            console.error('Error checking duplicate:', error);
            return { hasDuplicate: false, error: error.message };
        }
    }
    
    async function registerUser(userData) {
        console.log('📤 Registering user:', userData);
        
        try {
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
                const text = await response.text();
                console.error('Raw response:', text);
                return { 
                    success: false, 
                    error: 'Invalid server response format'
                };
            }
            
            if (!response.ok) {
                console.log('❌ Registration failed:', data);
                
                // Handle specific error cases
                let errorMessage = data.message || `Registration failed (${response.status})`;
                
                // Check for duplicate email/phone errors
                const lowerError = errorMessage.toLowerCase();
                if (lowerError.includes('already exists') || lowerError.includes('duplicate')) {
                    if (lowerError.includes('email')) {
                        errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                    } else if (lowerError.includes('phone')) {
                        errorMessage = 'This phone number is already registered. Please use a different phone number.';
                    }
                }
                
                return { 
                    success: false, 
                    error: errorMessage
                };
            }
            
            console.log('✅ Registration successful!');
            return { 
                success: true, 
                data: data,
                message: data.message || 'Registration successful!'
            };
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                return { 
                    success: false, 
                    error: 'Cannot connect to server. Please check if the server is running.'
                };
            }
            
            return { 
                success: false, 
                error: `Connection error: ${error.message}`
            };
        }
    }
    
    async function verifyEmail(email, code) {
        console.log(`🔐 Verifying email for: ${email}`);
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    verificationCode: code
                })
            });
            
            console.log(`📡 Verification response status: ${response.status}`);
            
            let data;
            try {
                data = await response.json();
                console.log('📦 Verification response:', data);
            } catch (parseError) {
                console.error('Failed to parse verification JSON:', parseError);
                return { 
                    success: false, 
                    error: 'Invalid server response'
                };
            }
            
            if (!response.ok) {
                return { 
                    success: false, 
                    error: data.message || 'Verification failed'
                };
            }
            
            return { 
                success: true, 
                data: data,
                message: 'Email verified successfully!'
            };
            
        } catch (error) {
            console.error('🚨 Verification error:', error);
            return { 
                success: false, 
                error: 'Verification failed. Please try again.'
            };
        }
    }
    
    async function resendVerificationCode(email) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim()
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                return { success: false, error: data.message || 'Failed to resend code' };
            }
            
            return { success: true, message: data.message || 'New verification code sent!' };
            
        } catch (error) {
            return { success: false, error: 'Failed to resend verification code.' };
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
    
    // Main form submission
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!validateForm()) {
                return;
            }
            
            setLoading(true);
            
            // Get and format values
            const firstName = firstNameInput.value.trim();
            const lastName = lastNameInput.value.trim();
            const email = emailInput.value.trim().toLowerCase();
            const phone = phoneInput.value.trim();
            const password = passwordInput.value;
            
            // Combine first and last name into fullName for backend
            const userData = {
                fullName: `${firstName} ${lastName}`,
                email: email,
                phoneNumber: phone ? formatPhoneNumber(phone) : '',
                password: password
            };
            
            console.log('🚀 Starting registration...');
            console.log('User data being sent:', userData);
            
            try {
                // Optional: Check for duplicates before submitting
                // const duplicateCheck = await checkDuplicateUser(email, phone);
                // if (duplicateCheck.hasDuplicate) {
                //     showError(duplicateCheck.error || 'This email or phone is already registered');
                //     setLoading(false);
                //     return;
                // }
                
                const result = await registerUser(userData);
                
                if (result.success) {
                    // Show verification modal
                    showVerificationModal(userData.email);
                    
                    // Show success message
                    showError(result.message || 'Registration successful! Please check your email for verification code.', true);
                    
                    // Clear password fields
                    passwordInput.value = '';
                    confirmPasswordInput.value = '';
                    
                } else {
                    showError(result.error);
                }
                
            } catch (error) {
                console.error('🚨 Unexpected error:', error);
                showError('An unexpected error occurred. Please try again.');
            } finally {
                setLoading(false);
            }
        });
    }
    
    // Phone input formatting
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            // Remove error styling when user starts typing
            this.style.borderColor = '';
            
            // Auto-format as user types (optional)
            const value = this.value;
            if (value.length > 0 && !value.startsWith('+')) {
                // If it starts with 0 and is getting long, consider adding +27
                if (value.startsWith('0') && value.replace(/\D/g, '').length >= 10) {
                    // User might be typing a local number, that's fine
                }
            }
        });
        
        phoneInput.addEventListener('blur', function() {
            // Format on blur
            const formatted = formatPhoneNumber(this.value);
            if (formatted !== this.value) {
                this.value = formatted;
            }
        });
    }
    
    // Verification modal functionality
    const verificationCodeInput = document.getElementById('verificationCode');
    const verifyBtn = document.getElementById('verifyBtn');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async function() {
            const code = verificationCodeInput ? verificationCodeInput.value.trim() : '';
            
            if (!code || code.length !== 6) {
                alert('Please enter a valid 6-digit code');
                return;
            }
            
            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';
            
            const result = await verifyEmail(currentEmail, code);
            
            if (result.success) {
                storeUserData(result.data);
                
                alert('✓ Email verified successfully! You are now logged in.');
                
                // Redirect to homepage
                setTimeout(() => {
                    window.location.href = '../index.html?registered=true';
                }, 1500);
                
            } else {
                alert(result.error || 'Verification failed');
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify';
            }
        });
    }
    
    if (resendCodeBtn) {
        resendCodeBtn.addEventListener('click', async function() {
            resendCodeBtn.disabled = true;
            resendCodeBtn.textContent = 'Sending...';
            
            const result = await resendVerificationCode(currentEmail);
            
            if (result.success) {
                alert(result.message || 'New verification code sent!');
            } else {
                alert(result.error || 'Failed to resend code');
            }
            
            setTimeout(() => {
                resendCodeBtn.disabled = false;
                resendCodeBtn.textContent = 'Resend Code';
            }, 2000);
        });
    }
    
    // Password toggle functionality
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    
    function setupPasswordToggle(toggleBtn, passwordField) {
        if (toggleBtn && passwordField) {
            toggleBtn.addEventListener('click', function() {
                const icon = this.querySelector('i');
                
                if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                    icon.title = 'Hide password';
                } else {
                    passwordField.type = 'password';
                    icon.className = 'fas fa-eye';
                    icon.title = 'Show password';
                }
            });
        }
    }
    
    setupPasswordToggle(togglePassword, passwordInput);
    setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);
    
    // Terms link functionality
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Terms & Conditions and Privacy Policy pages coming soon!');
        });
    });
    
    // Login link - No event listener, let HTML link work normally
    const loginLink = document.getElementById('loginLink');
    if (loginLink) {
        console.log('✅ Login link found, will navigate to login.html');
    }
    
    // Test connection on load
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
    
    setTimeout(async () => {
        const isConnected = await testConnection();
        if (!isConnected) {
            console.warn('⚠️ Server is not running');
            showError('⚠️ Note: Server is not running. Run: npm start');
        }
    }, 1000);
    
    console.log('✅ Register script initialized');
});