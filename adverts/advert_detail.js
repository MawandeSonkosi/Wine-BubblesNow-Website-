// Advert Detail JavaScript - MATCHING FLUTTER APP
// Configuration - USE EXACT SAME API AS FLUTTER
const API_BASE_URL = '/api';

// State
let currentAdvert = null;
let allAdverts = [];
let searchQuery = '';
let quantity = 1;

// DOM Elements
const advertDetailContainer = document.getElementById('advertDetailContainer');
const relatedAdvertsSection = document.getElementById('relatedAdvertsSection');
const relatedAdvertsGrid = document.getElementById('relatedAdvertsGrid');
const searchInput = document.getElementById('searchInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎪 Advert Detail page loaded');
  
  // Get advert ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const advertId = urlParams.get('id') || '';
  
  if (advertId) {
    console.log(`🎯 Loading advert with ID: ${advertId}`);
    fetchAdvertDetail(advertId);
  } else {
    showError('No advert ID provided in URL');
  }
  
  // Initialize cart badge
  if (window.CartUtils) {
    console.log('✅ CartUtils loaded, updating badge');
    window.CartUtils.updateCartBadge();
  } else {
    console.warn('⚠️ CartUtils not available');
  }
  
  // Listen for cart updates
  window.addEventListener('cartUpdated', (event) => {
    console.log('🔄 Cart update event received');
    if (window.CartUtils) {
      window.CartUtils.updateCartBadge();
    }
  });
  
  // Listen for storage events (from other tabs)
  window.addEventListener('storage', (event) => {
    if (event.key === 'wine_cart') {
      console.log('🔄 Storage event received');
      if (window.CartUtils) {
        window.CartUtils.updateCartBadge();
      }
    }
  });
  
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Search input - only search, no filter
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      if (searchQuery) {
        showRelatedAdverts();
      } else {
        hideRelatedAdverts();
      }
    });
  }
}

// Fetch advert detail - EXACTLY LIKE FLUTTER'S getAdvertById()
async function fetchAdvertDetail(advertId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching advert detail for ID: ${advertId}`);
    
    // Use EXACT SAME ENDPOINT as Flutter: https://www.wineandbubblesnow.co.za/api/adverts/{id}
    const apiUrl = `${API_BASE_URL}/adverts/${advertId}`;
    
    console.log('📡 Fetching from (EXACT FLUTTER URL):', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch advert details: ${response.status}`);
    }
    
    const advert = await response.json();
    console.log('✅ Advert detail received:', advert);
    
    currentAdvert = advert;
    
    // Update page title
    document.title = `Wine & Bubbles — ${advert.title}`;
    
    // Track impression (like Flutter)
    trackImpression(advert.id);
    
    // Fetch all adverts for related section
    await fetchAllAdverts();
    
    // Render advert detail
    renderAdvertDetail(advert);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load offer details: ${error.message}`);
  }
}

// Track impression (matches Flutter's trackImpression)
async function trackImpression(advertId) {
  try {
    const apiUrl = `${API_BASE_URL}/adverts/track/impression`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ advertId })
    });
    
    console.log('👁️ Impression tracked');
  } catch (error) {
    console.log('Failed to track impression:', error);
  }
}

// Fetch all adverts for related offers
async function fetchAllAdverts() {
  try {
    // Fetch active homepage adverts (like Flutter's homepageAdvertsProvider)
    const apiUrl = `${API_BASE_URL}/adverts/active?type=homepage`;
    
    console.log('📡 Fetching all adverts from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch all adverts: ${response.status}`);
    }
    
    const adverts = await response.json();
    
    // Filter only active adverts
    allAdverts = adverts.filter(advert => 
      advert.isActive === true || advert.isActive === undefined
    );
    
    console.log(`✅ All adverts received: ${allAdverts.length} active adverts`);
    
  } catch (error) {
    console.error('Error fetching all adverts:', error);
  }
}

// Helper to fix image URLs - USING IMAGE URL (not targetUrl)
function fixImageUrl(advert) {
  if (!advert) return '../assets/adverts/default_marketing.jpg';
  
  // USE IMAGE URL as requested (not targetUrl)
  let imageUrl = advert.imageUrl || '';
  
  if (!imageUrl) {
    return '../assets/adverts/default_marketing.jpg';
  }
  
  // Fix path
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return '../assets/' + imageUrl;
}

// Render advert detail - MATCHING FLUTTER'S AdvertDetailScreen
function renderAdvertDetail(advert) {
  const imageUrl = fixImageUrl(advert);
  const price = advert.price || 0;
  const subtitle = advert.subtitle || '';
  const stockCount = advert.stockCount || 0;
  const isAvailable = advert.isAvailableForPurchase || false;
  const isInStock = isAvailable && stockCount > 0;
  
  advertDetailContainer.innerHTML = `
    <div class="advert-detail-card">
      <div class="advert-detail-image-container">
        <img src="${imageUrl}" 
             alt="${advert.title}" 
             class="advert-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/adverts/default_marketing.jpg';">
      </div>
      <div class="advert-detail-content">
        <h1 class="advert-detail-name">${advert.title}</h1>
        <div class="advert-detail-subtitle">${subtitle}</div>
        <div class="advert-detail-price">R${price.toFixed(2)}</div>
        
        <!-- NO CATEGORY/TYPE FIELDS - removed completely -->
        
        ${isAvailable ? `
          <div class="stock-status ${stockCount > 5 ? 'stock-in' : stockCount > 0 ? 'stock-low' : 'stock-out'}">
            ${stockCount > 5 ? 'In Stock' : stockCount > 0 ? `Only ${stockCount} left!` : 'Out of Stock'}
          </div>
        ` : ''}
        
        ${isInStock ? `
          <div class="quantity-selector">
            <button class="quantity-btn" onclick="decrementQuantity()" ${quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <div class="quantity-display" id="quantityDisplay">${quantity}</div>
            <button class="quantity-btn" onclick="incrementQuantity()" ${quantity >= stockCount ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
        ` : ''}
        
        ${isInStock ? `
          <button class="add-to-cart-btn" id="addToCartBtn" onclick="addToCart()">
            Add ${quantity} to Cart (R${(price * quantity).toFixed(2)})
          </button>
        ` : isAvailable ? `
          <div class="not-available-message">
            <i class="fas fa-times-circle"></i>
            <p>This offer is currently out of stock</p>
          </div>
        ` : `
          <div class="not-available-message">
            <i class="fas fa-info-circle"></i>
            <p>This is a promotional offer and cannot be purchased</p>
          </div>
        `}
      </div>
    </div>
  `;
}

// Quantity controls
function incrementQuantity() {
  if (currentAdvert && quantity < currentAdvert.stockCount) {
    quantity++;
    updateQuantityDisplay();
  }
}

function decrementQuantity() {
  if (quantity > 1) {
    quantity--;
    updateQuantityDisplay();
  }
}

function updateQuantityDisplay() {
  const quantityDisplay = document.getElementById('quantityDisplay');
  const addToCartBtn = document.getElementById('addToCartBtn');
  
  if (quantityDisplay) {
    quantityDisplay.textContent = quantity;
  }
  
  if (addToCartBtn && currentAdvert) {
    const price = currentAdvert.price || 0;
    addToCartBtn.textContent = `Add ${quantity} to Cart (R${(price * quantity).toFixed(2)})`;
  }
  
  // Update button states
  const minusBtn = document.querySelector('.quantity-btn:first-child');
  const plusBtn = document.querySelector('.quantity-btn:last-child');
  
  if (minusBtn) {
    minusBtn.disabled = quantity <= 1;
  }
  if (plusBtn && currentAdvert) {
    plusBtn.disabled = quantity >= currentAdvert.stockCount;
  }
}

// Add to cart - MATCHING FLUTTER'S _addToCart()
function addToCart() {
  if (!currentAdvert) {
    console.error('❌ No current advert data');
    showToast('No offer data available', 'error');
    return;
  }
  
  if (!currentAdvert.isAvailableForPurchase) {
    showToast(`${currentAdvert.title} is not available for purchase`, 'error');
    return;
  }
  
  if (currentAdvert.stockCount < quantity) {
    showToast(`Only ${currentAdvert.stockCount} placements available`, 'error');
    return;
  }
  
  // Create cart item with correct structure - USING IMAGE URL
  const cartItem = {
    id: currentAdvert.id.toString(),
    name: currentAdvert.title,
    price: currentAdvert.price,
    imageUrl: currentAdvert.imageUrl || '../assets/adverts/default_marketing.jpg',
    type: 'advert',
    category: currentAdvert.category || '',
    description: currentAdvert.subtitle || '',
    quantity: quantity
  };
  
  console.log('🛒 Attempting to add advert to cart:', cartItem);
  
  // Add to cart using unified cart system
  if (window.CartUtils && typeof window.CartUtils.addItem === 'function') {
    try {
      const updatedCart = window.CartUtils.addItem(cartItem);
      console.log('✅ Advert added successfully! Updated cart:', updatedCart);
      
      // Show success message
      showToast(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} of ${currentAdvert.title} to cart`, 'success');
      
      // Track click (like Flutter)
      trackClick(currentAdvert.id);
      
      // Reset quantity
      quantity = 1;
      updateQuantityDisplay();
      
      // Update cart badge
      window.CartUtils.updateCartBadge();
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart: ' + error.message, 'error');
    }
  } else {
    console.error('❌ CartUtils not available');
    showToast('Cart system is not available. Please refresh the page.', 'error');
  }
}

// Track click (matches Flutter's trackClick)
async function trackClick(advertId) {
  try {
    const apiUrl = `${API_BASE_URL}/adverts/track/click`;
    
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ advertId })
    });
    
    console.log('👆 Click tracked');
  } catch (error) {
    console.log('Failed to track click:', error);
  }
}

// Show related adverts - NO FILTER, only search
function showRelatedAdverts() {
  if (!allAdverts.length) return;
  
  // Filter adverts by search only
  let related = allAdverts.filter(advert => {
    // Exclude current advert
    if (currentAdvert && advert.id === currentAdvert.id) return false;
    
    // Apply search filter only
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesTitle = (advert.title || '').toLowerCase().includes(searchLower);
      const matchesSubtitle = (advert.subtitle || '').toLowerCase().includes(searchLower);
      
      if (!(matchesTitle || matchesSubtitle)) return false;
    }
    
    return true;
  });
  
  if (related.length === 0) {
    relatedAdvertsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No related offers found</h3>
        <p>Try changing your search</p>
      </div>
    `;
  } else {
    // Limit to 6 adverts
    related = related.slice(0, 6);
    
    relatedAdvertsGrid.innerHTML = related.map(advert => {
      const imageUrl = fixImageUrl(advert);
      const price = advert.price || 0;
      const isAvailable = advert.isAvailableForPurchase || false;
      
      return `
        <div class="advert-card" onclick="navigateToAdvertDetail('${advert.id}')">
          <div class="advert-card-image-container">
            <img src="${imageUrl}" 
                 alt="${advert.title}" 
                 class="advert-card-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='../assets/adverts/default_marketing.jpg';">
          </div>
          <div class="advert-card-content">
            <div class="advert-card-title">${advert.title}</div>
            <div class="advert-card-subtitle">${advert.subtitle || 'Special Offer'}</div>
            ${isAvailable ? `
              <div class="advert-card-price">R${price.toFixed(2)}</div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Show the section
  relatedAdvertsSection.style.display = 'block';
}

// Hide related adverts
function hideRelatedAdverts() {
  relatedAdvertsSection.style.display = 'none';
  searchInput.value = '';
  searchQuery = '';
}

// Navigate to advert detail
function navigateToAdvertDetail(advertId) {
  window.location.href = `advert_detail.html?id=${advertId}`;
}

// UI States
function showLoading() {
  advertDetailContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading offer details...</p>
    </div>
  `;
}

function showError(message) {
  advertDetailContainer.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="window.history.back()" class="btn-fill" style="margin-top: 20px;">
        Go Back
      </button>
    </div>
  `;
}

// Toast notification
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Debug function
function debugAdvert() {
  console.log('=== DEBUG ADVERT ===');
  console.log('Current advert:', currentAdvert);
  console.log('All adverts count:', allAdverts.length);
  console.log('Quantity:', quantity);
  console.log('CartUtils available:', !!window.CartUtils);
  console.log('==================');
}

// Make functions available globally
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.navigateToAdvertDetail = navigateToAdvertDetail;
window.hideRelatedAdverts = hideRelatedAdverts;
window.debugAdvert = debugAdvert;