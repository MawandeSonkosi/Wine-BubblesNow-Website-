// login/forgot-password.js - UPDATED TO USE PRODUCTION API LIKE FLUTTER
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Forgot password page loaded');
    
    // DOM Elements
    const emailForm = document.getElementById('emailForm');
    const codeForm = document.getElementById('codeForm');
    const passwordForm = document.getElementById('passwordForm');
    const emailInput = document.getElementById('email');
    const verificationInputs = document.querySelectorAll('.verification-input');
    const verificationCodeInput = document.getElementById('verificationCode');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const userEmailSpan = document.getElementById('userEmail');
    const resendLink = document.getElementById('resendLink');
    const resendTimer = document.getElementById('resendTimer');
    const timerCountSpan = document.getElementById('timerCount');
    
    // Steps
    const steps = document.querySelectorAll('.step');
    
    // API base URL - SAME AS FLUTTER APP
    const API_BASE_URL = 'https://www.wineandbubblesnow.co.za';
    console.log('🌐 Using production API:', API_BASE_URL);
    
    let currentEmail = '';
    let resetToken = '';
    let resendTimerInterval;
    let countdown = 60;
    let canResend = false;
    
    // Initialize
    init();
    
    function init() {
        setupEventListeners();
        startResendTimer();
        
        // Auto-focus email input
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 300);
        }
    }
    
    function setupEventListeners() {
        // Email form submission
        if (emailForm) {
            emailForm.addEventListener('submit', handleEmailSubmit);
        }
        
        // Verification code form submission
        if (codeForm) {
            codeForm.addEventListener('submit', handleCodeSubmit);
        }
        
        // Password form submission
        if (passwordForm) {
            passwordForm.addEventListener('submit', handlePasswordSubmit);
        }
        
        // Verification code inputs
        setupVerificationInputs();
        
        // Resend link
        if (resendLink) {
            resendLink.addEventListener('click', handleResendCode);
        }
        
        // Go to login button
        const goToLoginBtn = document.getElementById('goToLoginBtn');
        if (goToLoginBtn) {
            goToLoginBtn.addEventListener('click', function() {
                window.location.href = 'login.html';
            });
        }
        
        // Password toggle buttons
        setupPasswordToggle('toggleNewPassword', newPasswordInput);
        setupPasswordToggle('toggleConfirmNewPassword', confirmNewPasswordInput);
        
        // Password strength indicator
        if (newPasswordInput) {
            newPasswordInput.addEventListener('input', updatePasswordStrength);
        }
        
        // Back button
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.addEventListener('click', function() {
                window.history.back();
            });
        }
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
    
    function setLoading(step, isLoading) {
        let submitBtn, btnText, loadingSpinner;
        
        switch(step) {
            case 1:
                submitBtn = document.getElementById('submitBtn');
                btnText = document.getElementById('btnText');
                loadingSpinner = document.getElementById('loadingSpinner');
                break;
            case 2:
                submitBtn = document.getElementById('verifyBtn');
                btnText = document.getElementById('verifyBtnText');
                loadingSpinner = document.getElementById('verifyLoadingSpinner');
                break;
            case 3:
                submitBtn = document.getElementById('resetBtn');
                btnText = document.getElementById('resetBtnText');
                loadingSpinner = document.getElementById('resetLoadingSpinner');
                break;
        }
        
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
    
    function goToStep(stepNumber) {
        steps.forEach(step => step.classList.remove('active'));
        const stepElement = document.getElementById(`step${stepNumber}`);
        if (stepElement) {
            stepElement.classList.add('active');
        }
    }
    
    // Step 1: Send OTP - USING FLUTTER'S API ENDPOINT
    async function handleEmailSubmit(e) {
        e.preventDefault();
        hideMessages();
        
        const email = emailInput.value.trim();
        
        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }
        
        setLoading(1, true);
        
        try {
            const result = await sendPasswordResetOTP(email);
            
            if (result.success) {
                currentEmail = email;
                userEmailSpan.textContent = email;
                showError(result.message || 'OTP sent successfully', true);
                goToStep(2);
                resetVerificationInputs();
                startResendTimer();
                
                // Auto-focus first verification input
                setTimeout(() => {
                    if (verificationInputs[0]) {
                        verificationInputs[0].focus();
                    }
                }, 100);
            } else {
                showError(result.error || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An unexpected error occurred');
        } finally {
            setLoading(1, false);
        }
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    async function sendPasswordResetOTP(email) {
        try {
            console.log('📤 Sending password reset OTP via Flutter API:', email);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email: email.toLowerCase() })
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
                return { success: false, error: 'Invalid server response format' };
            }
            
            if (response.ok) {
                return { 
                    success: true, 
                    data: data,
                    message: data.message || 'OTP sent successfully'
                };
            } else {
                // Handle different error responses
                let errorMsg = data.message || `Failed to send OTP (${response.status})`;
                
                // For security, don't reveal if email exists or not
                if (response.status === 404) {
                    errorMsg = 'If this email exists in our system, you will receive an OTP';
                } else if (response.status === 400) {
                    errorMsg = data.message || 'Invalid request';
                }
                
                return { 
                    success: false, 
                    error: errorMsg 
                };
            }
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            
            if (error.message.includes('Failed to fetch')) {
                return { 
                    success: false, 
                    error: 'Cannot connect to server. Please check your connection.' 
                };
            }
            
            return { 
                success: false, 
                error: `Connection error: ${error.message}` 
            };
        }
    }
    
    // Step 2: Verify OTP
    function setupVerificationInputs() {
        verificationInputs.forEach((input, index) => {
            input.addEventListener('input', function(e) {
                const value = this.value;
                
                // Only allow numbers
                if (value && !/^\d$/.test(value)) {
                    this.value = '';
                    return;
                }
                
                // Move to next input if value entered
                if (value && index < verificationInputs.length - 1) {
                    verificationInputs[index + 1].focus();
                }
                
                // Update hidden input
                updateVerificationCode();
                
                // Clear any error
                const codeError = document.getElementById('codeError');
                if (codeError) {
                    codeError.style.display = 'none';
                    codeError.textContent = '';
                }
            });
            
            input.addEventListener('keydown', function(e) {
                // Handle backspace
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    verificationInputs[index - 1].focus();
                }
                
                // Handle paste
                if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
                    setTimeout(() => {
                        handlePaste(this, e);
                    }, 10);
                }
            });
            
            input.addEventListener('paste', handlePaste);
        });
    }
    
    function handlePaste(input, e) {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        
        if (!/^\d+$/.test(pastedData)) {
            return;
        }
        
        const digits = pastedData.split('').slice(0, 6);
        
        digits.forEach((digit, index) => {
            if (verificationInputs[index]) {
                verificationInputs[index].value = digit;
            }
        });
        
        // Focus last input
        const lastIndex = Math.min(digits.length - 1, verificationInputs.length - 1);
        if (verificationInputs[lastIndex]) {
            verificationInputs[lastIndex].focus();
        }
        
        updateVerificationCode();
    }
    
    function updateVerificationCode() {
        let code = '';
        verificationInputs.forEach(input => {
            code += input.value;
        });
        
        if (verificationCodeInput) {
            verificationCodeInput.value = code;
        }
    }
    
    function resetVerificationInputs() {
        verificationInputs.forEach(input => {
            input.value = '';
        });
        updateVerificationCode();
        
        // Focus first input
        if (verificationInputs[0]) {
            verificationInputs[0].focus();
        }
    }
    
    async function handleCodeSubmit(e) {
        e.preventDefault();
        
        const otp = verificationCodeInput.value;
        
        if (!otp || otp.length !== 6) {
            const codeError = document.getElementById('codeError');
            if (codeError) {
                codeError.textContent = 'Please enter the 6-digit OTP code';
                codeError.style.display = 'block';
            }
            return;
        }
        
        setLoading(2, true);
        
        try {
            const result = await verifyOTP(currentEmail, otp);
            
            if (result.success) {
                resetToken = result.data.resetToken || result.data.token;
                
                // Move to step 3
                goToStep(3);
                resetPasswordForm();
                
                // Focus password input
                setTimeout(() => {
                    if (newPasswordInput) {
                        newPasswordInput.focus();
                    }
                }, 100);
                
            } else {
                const codeError = document.getElementById('codeError');
                if (codeError) {
                    codeError.textContent = result.error || 'Invalid OTP code';
                    codeError.style.display = 'block';
                }
            }
        } catch (error) {
            console.error('Error:', error);
            const codeError = document.getElementById('codeError');
            if (codeError) {
                codeError.textContent = 'Verification failed. Please try again.';
                codeError.style.display = 'block';
            }
        } finally {
            setLoading(2, false);
        }
    }
    
    // VERIFY OTP - USING FLUTTER'S API ENDPOINT
    async function verifyOTP(email, otp) {
        try {
            console.log('🔐 Verifying OTP via Flutter API:', email);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email.toLowerCase(),
                    otp: otp
                })
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            let data;
            try {
                data = await response.json();
                console.log('📦 Response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                return { success: false, error: 'Invalid server response format' };
            }
            
            if (response.ok) {
                return { 
                    success: true, 
                    data: data,
                    message: data.message || 'OTP verified successfully'
                };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Invalid or expired OTP' 
                };
            }
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            return { 
                success: false, 
                error: 'Cannot connect to server' 
            };
        }
    }
    
    // Step 3: Reset password
    function resetPasswordForm() {
        if (newPasswordInput) newPasswordInput.value = '';
        if (confirmNewPasswordInput) confirmNewPasswordInput.value = '';
        updatePasswordStrength();
    }
    
    function setupPasswordToggle(toggleId, passwordField) {
        const toggleBtn = document.getElementById(toggleId);
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
    
    function updatePasswordStrength() {
        const password = newPasswordInput ? newPasswordInput.value : '';
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthFill || !strengthText) return;
        
        let strength = 0;
        let text = 'Password strength';
        let color = '#e0e0e0';
        
        if (password.length >= 6) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        
        strengthFill.style.width = `${strength}%`;
        
        if (password.length === 0) {
            text = 'Password strength';
            color = '#e0e0e0';
        } else if (strength < 50) {
            text = 'Weak';
            color = '#dc3545';
        } else if (strength < 75) {
            text = 'Fair';
            color = '#ffc107';
        } else {
            text = 'Strong';
            color = '#28a745';
        }
        
        strengthFill.style.backgroundColor = color;
        strengthText.textContent = text;
        strengthText.style.color = color;
    }
    
    async function handlePasswordSubmit(e) {
        e.preventDefault();
        hideMessages();
        
        const password = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;
        
        // Validation
        if (!password || password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        setLoading(3, true);
        
        try {
            const result = await resetPassword(resetToken, password);
            
            if (result.success) {
                showError(result.message || 'Password reset successfully! You can now log in with your new password.', true);
                goToStep(4);
            } else {
                showError(result.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('An unexpected error occurred');
        } finally {
            setLoading(3, false);
        }
    }
    
    // RESET PASSWORD - USING FLUTTER'S API ENDPOINT
    async function resetPassword(token, newPassword) {
        try {
            console.log('🔐 Resetting password via Flutter API');
            
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    resetToken: token,
                    newPassword: newPassword
                })
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            let data;
            try {
                data = await response.json();
                console.log('📦 Response data:', data);
            } catch (parseError) {
                console.error('Failed to parse JSON:', parseError);
                return { success: false, error: 'Invalid server response format' };
            }
            
            if (response.ok) {
                return { 
                    success: true, 
                    data: data,
                    message: data.message || 'Password reset successfully'
                };
            } else {
                return { 
                    success: false, 
                    error: data.message || 'Failed to reset password' 
                };
            }
            
        } catch (error) {
            console.error('🚨 Network error:', error);
            return { 
                success: false, 
                error: 'Cannot connect to server' 
            };
        }
    }
    
    // Resend code functionality
    function startResendTimer() {
        clearInterval(resendTimerInterval);
        canResend = false;
        countdown = 60;
        
        if (resendLink) {
            resendLink.classList.add('disabled');
            resendLink.style.pointerEvents = 'none';
            resendLink.style.color = '#999';
            resendLink.style.cursor = 'not-allowed';
        }
        
        if (resendTimer) {
            resendTimer.style.display = 'block';
        }
        
        updateTimerDisplay();
        
        resendTimerInterval = setInterval(() => {
            countdown--;
            updateTimerDisplay();
            
            if (countdown <= 0) {
                clearInterval(resendTimerInterval);
                canResend = true;
                
                if (resendLink) {
                    resendLink.classList.remove('disabled');
                    resendLink.style.pointerEvents = 'auto';
                    resendLink.style.color = '#6b0d2b';
                    resendLink.style.cursor = 'pointer';
                }
                
                if (resendTimer) {
                    resendTimer.style.display = 'none';
                }
            }
        }, 1000);
    }
    
    function updateTimerDisplay() {
        if (timerCountSpan) {
            timerCountSpan.textContent = countdown;
        }
    }
    
    async function handleResendCode(e) {
        e.preventDefault();
        
        if (!currentEmail) {
            showError('Please enter your email first');
            return;
        }
        
        if (!canResend) {
            return;
        }
        
        setLoading(1, true);
        
        try {
            const result = await sendPasswordResetOTP(currentEmail);
            
            if (result.success) {
                showError('New OTP sent successfully!', true);
                startResendTimer();
                resetVerificationInputs();
                
                // Focus first verification input
                setTimeout(() => {
                    if (verificationInputs[0]) {
                        verificationInputs[0].focus();
                    }
                }, 100);
            } else {
                showError(result.error || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to resend OTP');
        } finally {
            setLoading(1, false);
        }
    }
    
    // Test connection on load
    async function testConnection() {
        try {
            console.log('🔗 Testing connection to Flutter API...');
            const response = await fetch(`${API_BASE_URL}/api/health`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Flutter API is running:', data.message);
                return true;
            } else {
                console.log('⚠️ Flutter API returned non-OK status:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Cannot connect to Flutter API:', error);
            return false;
        }
    }
    
    // Test connection on load
    setTimeout(async () => {
        const isConnected = await testConnection();
        if (!isConnected) {
            console.warn('⚠️ Flutter API is not reachable');
            // Don't show error to user, just log it
        }
    }, 1000);
    
    console.log('✅ Forgot password script initialized - using Flutter API endpoints');
});