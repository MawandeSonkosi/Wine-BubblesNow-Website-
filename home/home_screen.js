// ===== Configuration =====
const CONFIG = {
    API_BASE_URL: 'https://www.wineandbubblesnow.co.za/api',
    CART_KEY: 'wine_bubbles_cart',
    AGE_VERIFIED_KEY: 'age_verified'
};

// ===== State =====
let state = {
    cart: [],
    ageVerified: false,
    isLoading: false
};

// ===== DOM Elements =====
const elements = {
    // Age Verification
    ageOverlay: document.getElementById('ageOverlay'),
    ageNo: document.getElementById('ageNo'),
    ageYes: document.getElementById('ageYes'),
    
    // Mobile Menu
    mobileMenu: document.getElementById('mobileMenu'),
    mobileMenuToggle: document.getElementById('mobileMenuToggle'),
    closeMenu: document.querySelector('.close-menu'),
    
    // Cart
    cartSidebar: document.getElementById('cartSidebar'),
    cartToggle: document.getElementById('cartToggle'),
    closeCart: document.querySelector('.close-cart'),
    cartItems: document.querySelector('.cart-items'),
    cartCount: document.querySelector('.cart-count'),
    totalPrice: document.querySelector('.total-price'),
    checkoutBtn: document.querySelector('.checkout-btn'),
    
    // Shop Now Buttons
    shopNowButtons: document.querySelectorAll('.shop-now-btn, .product-btn, .pairing-btn'),
    
    // Read More Links
    readMoreLinks: document.querySelectorAll('.read-more'),
    
    // Category Cards
    categoryCards: document.querySelectorAll('.category-card')
};

// ===== Initialize Application =====
function initApp() {
    console.log('Initializing Wine & Bubbles Now website...');
    
    // Check age verification
    checkAgeVerification();
    
    // Load cart from localStorage
    loadCart();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize product interactions
    initProductInteractions();
    
    // Initialize API calls (if needed)
    // initAPICalls();
    
    console.log('Application initialized successfully');
}

// ===== Age Verification =====
function checkAgeVerification() {
    const ageVerified = localStorage.getItem(CONFIG.AGE_VERIFIED_KEY);
    
    if (ageVerified === 'true') {
        state.ageVerified = true;
        elements.ageOverlay.style.display = 'none';
    } else {
        state.ageVerified = false;
        elements.ageOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function initAgeVerification() {
    elements.ageYes.addEventListener('click', () => {
        localStorage.setItem(CONFIG.AGE_VERIFIED_KEY, 'true');
        state.ageVerified = true;
        elements.ageOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        showNotification('Age verified successfully!', 'success');
    });
    
    elements.ageNo.addEventListener('click', () => {
        showNotification('You must be 18 or older to access this website.', 'error');
        // Redirect to safe page or show alternative content
        setTimeout(() => {
            window.location.href = 'https://www.google.com';
        }, 2000);
    });
}

// ===== Cart Management =====
function loadCart() {
    try {
        const savedCart = localStorage.getItem(CONFIG.CART_KEY);
        if (savedCart) {
            state.cart = JSON.parse(savedCart);
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        state.cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(state.cart));
        updateCartDisplay();
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

function addToCart(product) {
    const existingItem = state.cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    showNotification(`Added ${product.name} to cart!`, 'success');
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    saveCart();
    showNotification('Item removed from cart', 'info');
}

function updateCartDisplay() {
    // Update cart count
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    
    // Update cart items
    elements.cartItems.innerHTML = '';
    
    if (state.cart.length === 0) {
        elements.cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Your cart is empty</p>
            </div>
        `;
        elements.totalPrice.textContent = 'R 0.00';
        return;
    }
    
    let total = 0;
    
    state.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p class="cart-item-price">R ${item.price.toFixed(2)} × ${item.quantity}</p>
                <p class="cart-item-total">R ${itemTotal.toFixed(2)}</p>
            </div>
            <button class="remove-item" data-id="${item.id}">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        elements.cartItems.appendChild(cartItem);
    });
    
    // Update total
    elements.totalPrice.textContent = `R ${total.toFixed(2)}`;
    
    // Add remove event listeners
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.currentTarget.dataset.id;
            removeFromCart(productId);
        });
    });
}

// ===== Event Listeners =====
function initEventListeners() {
    // Age verification
    initAgeVerification();
    
    // Mobile menu
    elements.mobileMenuToggle.addEventListener('click', () => {
        elements.mobileMenu.classList.add('open');
    });
    
    elements.closeMenu.addEventListener('click', () => {
        elements.mobileMenu.classList.remove('open');
    });
    
    // Cart
    elements.cartToggle.addEventListener('click', () => {
        elements.cartSidebar.classList.add('open');
    });
    
    elements.closeCart.addEventListener('click', () => {
        elements.cartSidebar.classList.remove('open');
    });
    
    // Checkout
    elements.checkoutBtn.addEventListener('click', () => {
        if (state.cart.length === 0) {
            showNotification('Your cart is empty!', 'error');
            return;
        }
        
        // In a real app, this would redirect to checkout
        showNotification('Proceeding to checkout...', 'success');
        console.log('Checkout items:', state.cart);
        
        // Simulate checkout process
        setTimeout(() => {
            state.cart = [];
            saveCart();
            elements.cartSidebar.classList.remove('open');
            showNotification('Order placed successfully!', 'success');
        }, 2000);
    });
    
    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.cartSidebar.contains(e.target) && 
            !elements.cartToggle.contains(e.target) &&
            elements.cartSidebar.classList.contains('open')) {
            elements.cartSidebar.classList.remove('open');
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.mobileMenu.contains(e.target) && 
            !elements.mobileMenuToggle.contains(e.target) &&
            elements.mobileMenu.classList.contains('open')) {
            elements.mobileMenu.classList.remove('open');
        }
    });
}

// ===== Product Interactions =====
function initProductInteractions() {
    // Shop Now buttons
    elements.shopNowButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get product info from closest product card
            const productCard = e.target.closest('.product-card, .pairing-item');
            if (!productCard) return;
            
            const productName = productCard.querySelector('h3, h4')?.textContent || 'Product';
            const priceText = productCard.querySelector('.price')?.textContent || 'R 0.00';
            const price = parseFloat(priceText.replace('R ', '').replace(',', '')) || 0;
            
            const product = {
                id: Date.now(), // In real app, use actual product ID
                name: productName,
                price: price,
                quantity: 1
            };
            
            addToCart(product);
        });
    });
    
    // Read More links
    elements.readMoreLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showNotification('Opening event details...', 'info');
            // In real app, this would open a modal or navigate to event page
        });
    });
    
    // Category cards
    elements.categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const categoryName = card.querySelector('h3')?.textContent || 'Category';
            showNotification(`Showing ${categoryName}...`, 'info');
            
            // In real app, this would filter or navigate to category page
            // Example: window.location.href = `/category/${categoryName.toLowerCase().replace(' ', '-')}`;
        });
    });
}

// ===== API Functions =====
async function fetchWines() {
    try {
        state.isLoading = true;
        const response = await fetch(`${CONFIG.API_BASE_URL}/wines?all=true`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const wines = await response.json();
        console.log('Fetched wines:', wines);
        return wines;
    } catch (error) {
        console.error('Error fetching wines:', error);
        showNotification('Error loading wines. Please try again.', 'error');
        return [];
    } finally {
        state.isLoading = false;
    }
}

async function fetchFeaturedWines() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/wines/featured/featured`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const wines = await response.json();
        console.log('Fetched featured wines:', wines);
        return wines;
    } catch (error) {
        console.error('Error fetching featured wines:', error);
        return [];
    }
}

// ===== Notification System =====
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            }
            
            .notification-content {
                background-color: var(--bg-dark);
                border: 2px solid;
                border-radius: 8px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                max-width: 400px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            }
            
            .notification-info .notification-content {
                border-color: var(--accent-gold);
                color: var(--accent-gold);
            }
            
            .notification-success .notification-content {
                border-color: #4CAF50;
                color: #4CAF50;
            }
            
            .notification-error .notification-content {
                border-color: #f44336;
                color: #f44336;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ===== Image Fallback Handling =====
function setupImageFallbacks() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const placeholder = `https://via.placeholder.com/400x300/0F0F0F/D8C09D?text=${encodeURIComponent(e.target.alt || 'Image')}`;
            e.target.src = placeholder;
        }
    }, true);
}

// ===== Initialize on DOM Load =====
document.addEventListener('DOMContentLoaded', () => {
    // Setup image fallbacks
    setupImageFallbacks();
    
    // Initialize app
    initApp();
    
    // Add fade-in animation to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('fade-in');
    });
});

// ===== Export for debugging =====
window.appState = state;
window.appElements = elements;