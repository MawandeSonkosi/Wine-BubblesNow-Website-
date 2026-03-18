// Shared Authentication Script - Same as homepage
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth check running on page');
    
    // Token validation function
    function isTokenValid() {
        const token = localStorage.getItem('wineBubbles_token');
        const timestamp = localStorage.getItem('wineBubbles_token_timestamp');
        
        if (!token || !timestamp) return false;
        
        const tokenAge = Date.now() - parseInt(timestamp);
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        return tokenAge < sevenDays;
    }
    
    // Clear user session function
    function clearUserSession() {
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
        localStorage.removeItem('wineBubbles_userFullName');
        localStorage.removeItem('wineBubbles_userEmail');
        localStorage.removeItem('wineBubbles_userPhone');
        localStorage.removeItem('wineBubbles_userImage');
        localStorage.removeItem('wineBubbles_userVerified');
        localStorage.removeItem('wineBubbles_userCreated');
    }
    
    // Check if user is logged in
    const token = localStorage.getItem('wineBubbles_token');
    const userData = localStorage.getItem('wineBubbles_user');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    const isDriver = localStorage.getItem('wineBubbles_isDriver') === 'true';
    const isValidToken = isTokenValid();
    
    // Get user icon elements
    const userIcon = document.getElementById('userIcon');
    const userIconElement = document.getElementById('userIconElement');
    
    if (isValidToken && userData) {
        console.log('✅ User is logged in');
        
        try {
            const user = JSON.parse(userData);
            
            // Update user icon to show logged-in state
            if (userIconElement) {
                userIconElement.className = 'fas fa-user-check';
                userIconElement.style.color = '#6b0d2b';
            }
            
            // Update user icon link
            if (userIcon) {
                userIcon.href = '#';
                userIcon.addEventListener('click', function(e) {
                    e.preventDefault();
                    toggleUserDropdown();
                });
            }
            
            // Create dropdown
            createUserDropdown(user, isAdmin, isDriver);
            
        } catch (error) {
            console.error('Error parsing user data:', error);
            clearUserSession();
            resetUserIcon();
        }
        
    } else {
        console.log('❌ User is not logged in or token expired');
        clearUserSession();
        resetUserIcon();
    }
    
    // Reset user icon to login state
    function resetUserIcon() {
        if (userIcon) {
            userIcon.href = '../login/login.html';
            if (userIconElement) {
                userIconElement.className = 'fas fa-sign-in-alt';
                userIconElement.style.color = '#6b0d2b';
            }
        }
    }
    
    // Toggle user dropdown
    function toggleUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }
    
    // Create user dropdown menu
    function createUserDropdown(user, isAdmin, isDriver) {
        const existingDropdown = document.querySelector('.user-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }
        
        const dropdown = document.createElement('div');
        dropdown.className = 'user-dropdown';
        
        const userInfo = document.createElement('div');
        userInfo.className = 'user-dropdown-info';
        
        const userName = document.createElement('div');
        userName.className = 'user-dropdown-name';
        userName.textContent = user.fullName || user.email.split('@')[0];
        
        if (isAdmin) {
            const adminBadge = document.createElement('span');
            adminBadge.className = 'admin-badge';
            adminBadge.textContent = 'ADMIN';
            userName.appendChild(adminBadge);
        } else if (isDriver) {
            const driverBadge = document.createElement('span');
            driverBadge.className = 'driver-badge';
            driverBadge.textContent = 'DRIVER';
            userName.appendChild(driverBadge);
        }
        
        const userEmail = document.createElement('div');
        userEmail.className = 'user-dropdown-email';
        userEmail.textContent = user.email;
        
        userInfo.appendChild(userName);
        userInfo.appendChild(userEmail);
        dropdown.appendChild(userInfo);
        
        const items = [
            { text: 'My Profile', icon: 'fas fa-user', href: '../user/profile.html' }
        ];
        
        items.forEach(item => {
            const link = document.createElement('a');
            link.href = item.href;
            link.className = 'user-dropdown-link';
            link.innerHTML = `
                <i class="${item.icon}"></i>
                <span>${item.text}</span>
            `;
            dropdown.appendChild(link);
        });
        
        const logoutButton = document.createElement('button');
        logoutButton.className = 'user-dropdown-logout';
        logoutButton.textContent = 'Logout';
        logoutButton.addEventListener('click', function() {
            clearUserSession();
            window.location.href = '../index.html';
        });
        
        dropdown.appendChild(logoutButton);
        document.body.appendChild(dropdown);
        
        document.addEventListener('click', function(event) {
            const dropdown = document.querySelector('.user-dropdown');
            if (dropdown && !dropdown.contains(event.target) && 
                userIcon && !userIcon.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
});