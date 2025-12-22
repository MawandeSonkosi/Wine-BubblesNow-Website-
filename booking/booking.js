// Booking JavaScript - Main functionality with authentication protection

// Configuration
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    PRICE_PER_GUEST: 300.00,
    SOMMELIER_PRICE: 250.00
};

// Authentication check function
function isAuthenticated() {
    const token = localStorage.getItem('wineBubbles_token');
    const timestamp = localStorage.getItem('wineBubbles_token_timestamp');
    
    if (!token || !timestamp) {
        return false;
    }
    
    // Check if token is expired (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (tokenAge >= sevenDays) {
        // Token expired, clear session
        clearUserSession();
        return false;
    }
    
    return true;
}

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

// Show login required message
function showLoginRequired() {
    // Create a modal or overlay
    const loginOverlay = document.createElement('div');
    loginOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;
    
    loginOverlay.innerHTML = `
        <div style="background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 500px; margin: 20px;">
            <i class="fas fa-lock" style="font-size: 48px; color: #6b0d2b; margin-bottom: 20px;"></i>
            <h2 style="color: #1b1b1b; margin-bottom: 16px;">Login Required</h2>
            <p style="color: #666; margin-bottom: 24px; line-height: 1.5;">
                You need to be logged in to book the African Wine Bar experience.
                Please login or create an account to continue.
            </p>
            <div style="display: flex; gap: 16px; justify-content: center;">
                <button id="loginRedirectBtn" style="
                    background: #6b0d2b;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.3s;
                ">Login Now</button>
                <button id="cancelBtn" style="
                    background: #f0f0f0;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-family: 'Montserrat', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.3s;
                ">Go Back</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(loginOverlay);
    
    // Add event listeners
    document.getElementById('loginRedirectBtn').addEventListener('click', () => {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `../login/login.html?redirect=${currentUrl}`;
    });
    
    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.history.back();
    });
}

// Booking State Manager
class BookingState {
    constructor() {
        this.userId = null;
        this.userEmail = null;
        this.selectedDate = null;
        this.selectedTime = null;
        this.numberOfGuests = 1;
        this.eventType = '';
        this.includesSommelier = false;
        this.addOns = [];
        this.location = '';
        this.specialRequests = '';
        this.totalAmount = CONFIG.PRICE_PER_GUEST;
        this.selectedAddon = null;
    }

    updateGuestCount(count) {
        this.numberOfGuests = Math.max(1, Math.min(100, count));
    }

    toggleSommelier() {
        this.includesSommelier = !this.includesSommelier;
    }

    addAddOn(addonId, name, price, quantity, imageUrl = null, category = null) {
        const existingIndex = this.addOns.findIndex(a => a.id === addonId);
        if (existingIndex > -1) {
            this.addOns[existingIndex].quantity = quantity;
        } else {
            this.addOns.push({
                id: addonId,
                name,
                price,
                quantity,
                imageUrl,
                category
            });
        }
    }

    removeAddOn(addonId) {
        this.addOns = this.addOns.filter(a => a.id !== addonId);
    }

    calculateTotal() {
        let total = CONFIG.PRICE_PER_GUEST * this.numberOfGuests;
        
        // Add add-ons
        this.addOns.forEach(addon => {
            if (addon.quantity > 0) {
                total += addon.price * addon.quantity;
            }
        });
        
        // Add sommelier
        if (this.includesSommelier) {
            total += CONFIG.SOMMELIER_PRICE;
        }
        
        this.totalAmount = total;
        return total;
    }

    validate() {
        const errors = [];
        
        if (!this.userId) {
            errors.push('User not logged in');
        }
        
        if (!this.selectedDate) {
            errors.push('Please select a date');
        }
        
        if (!this.selectedTime) {
            errors.push('Please select a time');
        }
        
        if (this.location.trim() === '') {
            errors.push('Please enter your event location address');
        }
        
        if (this.numberOfGuests < 1) {
            errors.push('Number of guests must be at least 1');
        }
        
        if (this.numberOfGuests > 100) {
            errors.push('Maximum 100 guests allowed');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    toBookingData() {
        const addOnsData = this.addOns
            .filter(a => a.quantity > 0)
            .map(addon => ({
                name: addon.name,
                price: addon.price,
                imageUrl: addon.imageUrl || null,
                category: addon.category || 'Uncategorized'
            }));
        
        // Add sommelier as add-on if selected
        if (this.includesSommelier) {
            addOnsData.push({
                name: 'Sommelier Service',
                price: CONFIG.SOMMELIER_PRICE,
                imageUrl: null,
                category: 'Service'
            });
        }
        
        return {
            userId: this.userId,
            userEmail: this.userEmail,
            type: this.eventType || 'African Wine Bar Experience',
            date: this.selectedDate,
            time: this.selectedTime,
            numberOfGuests: this.numberOfGuests,
            includesSommelier: this.includesSommelier,
            addOns: addOnsData,
            specialRequest: this.specialRequests,
            location: {
                name: "Custom Event Location",
                address: this.location
            },
            totalAmount: this.totalAmount,
            status: "pending"
        };
    }
}

// UI Manager
class UIManager {
    constructor() {
        this.state = new BookingState();
        this.datePicker = null;
        this.timePicker = null;
    }

    initialize() {
        // First check authentication
        if (!this.setUserFromStorage()) {
            showLoginRequired();
            return; // Stop initialization if not authenticated
        }
        
        this.initializeDatePickers();
        this.attachEventListeners();
        this.loadAddOns();
        this.updateUI();
        
        // Update user icon in navbar
        this.updateUserIcon();
    }

    setUserFromStorage() {
        const token = localStorage.getItem('wineBubbles_token');
        const userData = localStorage.getItem('wineBubbles_user');
        
        if (!token || !userData) {
            return false;
        }
        
        try {
            const user = JSON.parse(userData);
            this.state.userId = user._id || user.id;
            this.state.userEmail = user.email;
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return false;
        }
    }

    updateUserIcon() {
        const userIconElement = document.getElementById('userIconElement');
        const userIcon = document.getElementById('userIcon');
        
        if (userIconElement) {
            userIconElement.className = 'fas fa-user-check';
            userIconElement.style.color = '#6b0d2b';
        }
        
        if (userIcon) {
            userIcon.href = '#';
            userIcon.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleUserDropdown();
            });
        }
    }

    toggleUserDropdown() {
        const dropdown = document.querySelector('.user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    initializeDatePickers() {
        // Date picker
        this.datePicker = flatpickr("#bookingDate", {
            dateFormat: "D, M d, Y",
            minDate: "today",
            maxDate: new Date().fp_incr(365),
            onChange: (selectedDates, dateStr) => {
                this.state.selectedDate = dateStr;
                this.updateUI();
            }
        });

        // Time picker
        this.timePicker = flatpickr("#bookingTime", {
            enableTime: true,
            noCalendar: true,
            dateFormat: "h:i K",
            time_24hr: false,
            minuteIncrement: 15,
            defaultHour: 18,
            defaultMinute: 0,
            onChange: (selectedDates, timeStr) => {
                this.state.selectedTime = timeStr;
                this.updateUI();
            }
        });
    }

    attachEventListeners() {
        // Date/time picker buttons
        document.getElementById('datePickerBtn').addEventListener('click', () => {
            this.datePicker.open();
        });

        document.getElementById('timePickerBtn').addEventListener('click', () => {
            this.timePicker.open();
        });

        // Guest controls
        document.getElementById('decreaseGuests').addEventListener('click', () => {
            this.state.updateGuestCount(this.state.numberOfGuests - 1);
            document.getElementById('guests').value = this.state.numberOfGuests;
            this.updateUI();
        });

        document.getElementById('increaseGuests').addEventListener('click', () => {
            this.state.updateGuestCount(this.state.numberOfGuests + 1);
            document.getElementById('guests').value = this.state.numberOfGuests;
            this.updateUI();
        });

        // Input fields
        document.getElementById('eventType').addEventListener('input', (e) => {
            this.state.eventType = e.target.value;
        });

        document.getElementById('includesSommelier').addEventListener('change', (e) => {
            this.state.includesSommelier = e.target.checked;
            this.updateSelectedItems();
            this.updateUI();
        });

        document.getElementById('location').addEventListener('input', (e) => {
            this.state.location = e.target.value;
        });

        document.getElementById('specialRequests').addEventListener('input', (e) => {
            this.state.specialRequests = e.target.value;
        });

        // Add-ons
        document.getElementById('addOns').addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.value) {
                const addonId = selectedOption.value;
                const addonName = selectedOption.getAttribute('data-name');
                const addonPrice = parseFloat(selectedOption.getAttribute('data-price'));
                const addonImage = selectedOption.getAttribute('data-image');
                const addonCategory = selectedOption.getAttribute('data-category');
                
                this.state.selectedAddon = { 
                    id: addonId, 
                    name: addonName, 
                    price: addonPrice,
                    imageUrl: addonImage,
                    category: addonCategory
                };
                document.getElementById('selectedAddonName').textContent = addonName;
                document.getElementById('addonQuantityGroup').style.display = 'block';
                document.getElementById('addonQuantity').value = 0;
            }
        });

        // Add-on quantity controls
        document.getElementById('decreaseAddon').addEventListener('click', () => {
            const quantityInput = document.getElementById('addonQuantity');
            let quantity = parseInt(quantityInput.value);
            if (quantity > 0) {
                quantity--;
                quantityInput.value = quantity;
            }
        });

        document.getElementById('increaseAddon').addEventListener('click', () => {
            const quantityInput = document.getElementById('addonQuantity');
            let quantity = parseInt(quantityInput.value);
            if (quantity < 10) {
                quantity++;
                quantityInput.value = quantity;
            }
        });

        // Done button for add-on
        document.getElementById('doneAddonBtn').addEventListener('click', () => {
            const quantity = parseInt(document.getElementById('addonQuantity').value);
            if (quantity > 0 && this.state.selectedAddon) {
                this.state.addAddOn(
                    this.state.selectedAddon.id,
                    this.state.selectedAddon.name,
                    this.state.selectedAddon.price,
                    quantity,
                    this.state.selectedAddon.imageUrl,
                    this.state.selectedAddon.category
                );
                
                this.updateSelectedItems();
                this.updateUI();
            }
            
            // Reset
            document.getElementById('addOns').value = '';
            document.getElementById('addonQuantityGroup').style.display = 'none';
            this.state.selectedAddon = null;
        });

        // Form submission
        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitBooking();
        });
    }

    async loadAddOns() {
        try {
            this.showLoading(true);
            const token = localStorage.getItem('wineBubbles_token');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/addons`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const addOns = await response.json();
                this.populateAddOnsDropdown(addOns);
            } else {
                console.error('Failed to load add-ons:', response.status);
                this.loadFallbackAddOns();
            }
        } catch (error) {
            console.error('Error loading add-ons:', error);
            this.loadFallbackAddOns();
        } finally {
            this.showLoading(false);
        }
    }

    loadFallbackAddOns() {
        // Use images from assets/categories folder
        const fallbackAddOns = [
            { 
                id: 1, 
                name: 'Premium Wine Selection', 
                price: 500.00, 
                category: 'Wine',
                imageUrl: '../assets/categories/WINE_CASES copy.png'
            },
            { 
                id: 2, 
                name: 'Champagne Upgrade', 
                price: 800.00, 
                category: 'Champagne',
                imageUrl: '../assets/categories/CHAMPAGNE@3x-8.png'
            },
            { 
                id: 3, 
                name: 'Cheese Platter', 
                price: 350.00, 
                category: 'Food',
                imageUrl: '../assets/categories/PAIRINGS.png'
            },
            { 
                id: 4, 
                name: 'Chocolate Pairing', 
                price: 250.00, 
                category: 'Food',
                imageUrl: '../assets/categories/EVENT WINES.png'
            },
            { 
                id: 5, 
                name: 'Additional Hour', 
                price: 150.00, 
                category: 'Service',
                imageUrl: '../assets/categories/LUNCH WINES.png'
            },
            { 
                id: 6, 
                name: 'Wine Glasses', 
                price: 50.00, 
                category: 'Equipment',
                imageUrl: '../assets/categories/WHITE_WINE@3x-8.png'
            },
            { 
                id: 7, 
                name: 'Ice Buckets', 
                price: 30.00, 
                category: 'Equipment',
                imageUrl: '../assets/categories/DINNER WINES.png'
            },
            { 
                id: 8, 
                name: 'Premium Snacks', 
                price: 200.00, 
                category: 'Food',
                imageUrl: '../assets/categories/BREAKFAST WINES.png'
            }
        ];
        
        this.populateAddOnsDropdown(fallbackAddOns);
    }

    populateAddOnsDropdown(addOns) {
        const select = document.getElementById('addOns');
        
        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        addOns.forEach(addon => {
            const option = document.createElement('option');
            option.value = addon.id;
            option.setAttribute('data-name', addon.name);
            option.setAttribute('data-price', addon.price);
            option.setAttribute('data-image', addon.imageUrl || '../assets/categories/Icons.png');
            option.setAttribute('data-category', addon.category || 'Uncategorized');
            option.textContent = `${addon.name} - R${addon.price.toFixed(2)}`;
            select.appendChild(option);
        });
        
        // Create custom dropdown for better display
        this.createCustomDropdown(addOns);
    }

    createCustomDropdown(addOns) {
        const dropdownContainer = document.querySelector('.dropdown-container');
        const originalSelect = document.getElementById('addOns');
        
        // Remove existing custom dropdown if any
        const existingCustom = dropdownContainer.querySelector('.custom-dropdown');
        if (existingCustom) {
            existingCustom.remove();
        }
        
        // Create custom dropdown
        const customDropdown = document.createElement('div');
        customDropdown.className = 'custom-dropdown';
        
        // Create dropdown display
        const dropdownDisplay = document.createElement('div');
        dropdownDisplay.className = 'dropdown-display';
        dropdownDisplay.innerHTML = `
            <div class="display-content">
                <span class="placeholder">Select an add-on</span>
            </div>
            <i class="fas fa-chevron-down"></i>
        `;
        
        // Create dropdown options container
        const dropdownOptions = document.createElement('div');
        dropdownOptions.className = 'dropdown-options';
        
        // Add options
        addOns.forEach(addon => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.setAttribute('data-value', addon.id);
            option.setAttribute('data-name', addon.name);
            option.setAttribute('data-price', addon.price);
            option.setAttribute('data-image', addon.imageUrl || '../assets/categories/Icons.png');
            option.setAttribute('data-category', addon.category || 'Uncategorized');
            
            option.innerHTML = `
                <div class="option-content">
                    <div class="option-image">
                        <img src="${addon.imageUrl || '../assets/categories/Icons.png'}" 
                             alt="${addon.name}"
                             onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"40\" height=\"40\" viewBox=\"0 0 40 40\"><rect width=\"40\" height=\"40\" fill=\"%23f0f0f0\"/><text x=\"20\" y=\"22\" text-anchor=\"middle\" fill=\"%23666\" font-size=\"12\">${(addon.category || 'A').charAt(0).toUpperCase()}</text></svg>';">
                    </div>
                    <div class="option-details">
                        <div class="option-name">${addon.name}</div>
                        <div class="option-price">R${addon.price.toFixed(2)}</div>
                        <div class="option-category">${addon.category || 'Uncategorized'}</div>
                    </div>
                </div>
            `;
            
            option.addEventListener('click', () => {
                // Update original select
                originalSelect.value = addon.id;
                
                // Update custom display
                dropdownDisplay.querySelector('.display-content').innerHTML = option.innerHTML;
                
                // Trigger change event
                originalSelect.dispatchEvent(new Event('change'));
                
                // Close dropdown
                dropdownOptions.classList.remove('show');
            });
            
            dropdownOptions.appendChild(option);
        });
        
        // Toggle dropdown on click
        dropdownDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownOptions.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownOptions.classList.remove('show');
        });
        
        // Assemble custom dropdown
        customDropdown.appendChild(dropdownDisplay);
        customDropdown.appendChild(dropdownOptions);
        
        // Insert before original select
        dropdownContainer.insertBefore(customDropdown, originalSelect);
        
        // Hide original select
        originalSelect.style.display = 'none';
    }

    updateSelectedItems() {
        const container = document.getElementById('selectedItemsContainer');
        const list = document.getElementById('selectedItemsList');
        list.innerHTML = '';
        
        let hasItems = false;
        
        // Add add-ons
        this.state.addOns.forEach(addon => {
            if (addon.quantity > 0) {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>${addon.name} (x${addon.quantity})</span>
                    <span class="item-price">R${(addon.price * addon.quantity).toFixed(2)}</span>
                `;
                list.appendChild(item);
                hasItems = true;
            }
        });
        
        // Add sommelier if selected
        if (this.state.includesSommelier) {
            const item = document.createElement('div');
            item.className = 'selected-item';
            item.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Sommelier Service</span>
                <span class="item-price">R${CONFIG.SOMMELIER_PRICE.toFixed(2)}</span>
            `;
            list.appendChild(item);
            hasItems = true;
        }
        
        container.style.display = hasItems ? 'block' : 'none';
    }

    updateUI() {
        // Update guests summary
        const guests = this.state.numberOfGuests;
        const basePrice = CONFIG.PRICE_PER_GUEST * guests;
        
        document.getElementById('guestsSummary').textContent = 
            `${guests} Guests × R${CONFIG.PRICE_PER_GUEST.toFixed(2)}`;
        document.getElementById('basePriceSummary').textContent = 
            `R${basePrice.toFixed(2)}`;
        document.getElementById('basePrice').textContent = basePrice.toFixed(2);
        
        // Update add-ons summary
        const addonsSummary = document.getElementById('addonsSummary');
        addonsSummary.innerHTML = '';
        
        let addonsTotal = 0;
        
        // Add add-ons to summary
        this.state.addOns.forEach(addon => {
            if (addon.quantity > 0) {
                const addonTotal = addon.price * addon.quantity;
                addonsTotal += addonTotal;
                
                const row = document.createElement('div');
                row.className = 'price-row addon-row';
                row.innerHTML = `
                    <span>${addon.name} (x${addon.quantity})</span>
                    <span>R${addonTotal.toFixed(2)}</span>
                `;
                addonsSummary.appendChild(row);
            }
        });
        
        // Add sommelier if selected
        if (this.state.includesSommelier) {
            addonsTotal += CONFIG.SOMMELIER_PRICE;
            const row = document.createElement('div');
            row.className = 'price-row addon-row';
            row.innerHTML = `
                <span>Sommelier Service</span>
                <span>R${CONFIG.SOMMELIER_PRICE.toFixed(2)}</span>
            `;
            addonsSummary.appendChild(row);
        }
        
        // Update total
        const total = basePrice + addonsTotal;
        this.state.totalAmount = total;
        
        document.getElementById('totalAmount').textContent = `R${total.toFixed(2)}`;
    }

    async submitBooking() {
        // Validate form
        const validation = this.state.validate();
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                this.showToast(error, 'error');
            });
            return;
        }
        
        // Show loading
        this.showLoading(true);
        
        try {
            const bookingData = this.state.toBookingData();
            const token = localStorage.getItem('wineBubbles_token');
            
            const response = await fetch(`${CONFIG.API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bookingData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.showToast('Booking submitted successfully!', 'success');
                
                // Store for confirmation page
                localStorage.setItem('lastBooking', JSON.stringify({
                    ...bookingData,
                    id: data._id || Date.now().toString()
                }));
                
                // Redirect to confirmation page in the SAME FOLDER
                setTimeout(() => {
                    window.location.href = 'confirmation.html'; // Same folder
                }, 2000);
            } else {
                this.showToast(data.message || 'Failed to submit booking', 'error');
            }
        } catch (error) {
            console.error('Booking error:', error);
            this.showToast('Network error. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📋 Booking page loading...');
    
    // Check authentication first
    if (!isAuthenticated()) {
        console.log('❌ Authentication failed, showing login required');
        return; // Stop here if not authenticated
    }
    
    // Initialize UI Manager
    const uiManager = new UIManager();
    uiManager.initialize();
    
    console.log('✅ Booking page initialized for authenticated user');
});

// Also add a global authentication check for direct navigation attempts
// This ensures even if someone tries to bypass the initial check, they'll be redirected
window.addEventListener('load', () => {
    // Double-check authentication after page loads
    setTimeout(() => {
        if (!isAuthenticated()) {
            console.log('❌ Late authentication check failed');
            const currentUrl = encodeURIComponent(window.location.href);
            window.location.href = `../login/login.html?redirect=${currentUrl}`;
        }
    }, 100);
});