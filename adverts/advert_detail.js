// Advert Detail JavaScript - USING IMAGE URL ONLY, NO CATEGORY/TYPE, NO DEBUG BUTTON
const API_BASE_URL = '/api';

// State
let currentAdvert = null;
let allAdverts = [];
let quantity = 1;

// DOM Elements
const advertDetailContainer = document.getElementById('advertDetailContainer');
const relatedAdvertsSection = document.getElementById('relatedAdvertsSection');
const relatedAdvertsGrid = document.getElementById('relatedAdvertsGrid');
const advertTypeElement = document.getElementById('advertType');

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
  }
  
  // Listen for cart updates
  window.addEventListener('cartUpdated', () => {
    if (window.CartUtils) {
      window.CartUtils.updateCartBadge();
    }
  });
});

// Fetch advert detail
async function fetchAdvertDetail(advertId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching advert detail for ID: ${advertId}`);
    
    const apiUrl = `${API_BASE_URL}/adverts/${advertId}`;
    console.log('📡 Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch advert details: ${response.status}`);
    }
    
    const advert = await response.json();
    console.log('✅ Advert detail received:', advert);
    
    currentAdvert = advert;
    
    // Update page title
    document.title = `Wine & Bubbles — ${advert.title}`;
    if (advertTypeElement) {
      // Just show "Special Offer" not the type
      advertTypeElement.textContent = 'Special Offer';
    }
    
    // Track impression
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

// Track impression
async function trackImpression(advertId) {
  try {
    await fetch(`${API_BASE_URL}/adverts/track/impression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advertId })
    });
  } catch (error) {
    console.log('Failed to track impression:', error);
  }
}

// Fetch all adverts for related offers
async function fetchAllAdverts() {
  try {
    const apiUrl = `${API_BASE_URL}/adverts/active?type=homepage`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) return;
    
    const adverts = await response.json();
    allAdverts = adverts.filter(advert => 
      advert.isActive === true || advert.isActive === undefined
    );
    
    console.log(`✅ All adverts received: ${allAdverts.length} active adverts`);
    
  } catch (error) {
    console.error('Error fetching all adverts:', error);
  }
}

// Helper to fix image URLs - USING ONLY IMAGE URL (not targetUrl or imagePath)
function fixImageUrl(advert) {
  if (!advert) return '../assets/adverts/default_marketing.jpg';
  
  // USE ONLY imageUrl as specified in the model
  let imageUrl = advert.imageUrl || '';
  
  if (!imageUrl) {
    return '../assets/adverts/default_marketing.jpg';
  }
  
  // Fix path for website
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return '../assets/' + imageUrl;
}

// Render advert detail - NO CATEGORY/TYPE FIELDS
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
        
        <!-- NO CATEGORY/TYPE FIELDS - completely removed -->
        
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
  
  const minusBtn = document.querySelector('.quantity-btn:first-child');
  const plusBtn = document.querySelector('.quantity-btn:last-child');
  
  if (minusBtn) minusBtn.disabled = quantity <= 1;
  if (plusBtn && currentAdvert) plusBtn.disabled = quantity >= currentAdvert.stockCount;
}

// Add to cart - USING IMAGE URL ONLY
function addToCart() {
  if (!currentAdvert) {
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
  
  // Create cart item - USING ONLY IMAGE URL
  const cartItem = {
    id: currentAdvert.id.toString(),
    name: currentAdvert.title,
    price: currentAdvert.price,
    imageUrl: currentAdvert.imageUrl || '../assets/adverts/default_marketing.jpg', // Using imageUrl only
    type: 'advert',
    quantity: quantity
    // Removed category and description fields as they're not needed
  };
  
  if (window.CartUtils && typeof window.CartUtils.addItem === 'function') {
    try {
      window.CartUtils.addItem(cartItem);
      showToast(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} of ${currentAdvert.title} to cart`, 'success');
      
      // Track click
      trackClick(currentAdvert.id);
      
      // Reset quantity
      quantity = 1;
      updateQuantityDisplay();
      window.CartUtils.updateCartBadge();
      
    } catch (error) {
      showToast('Failed to add item to cart', 'error');
    }
  }
}

// Track click
async function trackClick(advertId) {
  try {
    await fetch(`${API_BASE_URL}/adverts/track/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ advertId })
    });
  } catch (error) {
    console.log('Failed to track click:', error);
  }
}

// Show related adverts
function showRelatedAdverts() {
  if (!allAdverts.length) return;
  
  let related = allAdverts.filter(advert => {
    if (currentAdvert && advert.id === currentAdvert.id) return false;
    return true;
  });
  
  if (related.length === 0) {
    relatedAdvertsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-tag"></i>
        <h3>No related offers found</h3>
      </div>
    `;
  } else {
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
  
  relatedAdvertsSection.style.display = 'block';
}

// Hide related adverts
function hideRelatedAdverts() {
  relatedAdvertsSection.style.display = 'none';
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
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Make functions available globally
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.navigateToAdvertDetail = navigateToAdvertDetail;
window.hideRelatedAdverts = hideRelatedAdverts;

// NO DEBUG BUTTON FUNCTION - completely removed