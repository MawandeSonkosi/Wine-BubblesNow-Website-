// Wine Detail JavaScript - MATCHING FLUTTER APP WITH COMING SOON SUPPORT
// Configuration - USE EXACT SAME API AS FLUTTER
const API_BASE_URL = '/api';

// State
let currentWine = null;
let allWines = [];
let filteredWines = [];
let searchQuery = '';
let currentFilter = '';
let quantity = 1;

// DOM Elements
const wineDetailContainer = document.getElementById('wineDetailContainer');
const relatedWinesSection = document.getElementById('relatedWinesSection');
const relatedWinesGrid = document.getElementById('relatedWinesGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const wineTypeElement = document.getElementById('wineType');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍷 Wine Detail page loaded');
  
  // Get wine ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const wineId = urlParams.get('id') || '';
  
  if (wineId) {
    console.log(`🎯 Loading wine with ID: ${wineId}`);
    fetchWineDetail(wineId);
  } else {
    showError('No wine ID provided in URL');
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
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      if (searchQuery) {
        showRelatedWines();
      } else {
        hideRelatedWines();
      }
    });
  }
  
  // Filter dropdown
  if (filterDropdown) {
    filterDropdown.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        currentFilter = link.dataset.filter;
        if (filterBtn) {
          filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${currentFilter || 'Filter'}`;
        }
        if (searchQuery) {
          showRelatedWines();
        }
      });
    });
  }
  
  // Close filter dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterBtn?.contains(e.target) && !filterDropdown?.contains(e.target)) {
      if (filterDropdown) {
        filterDropdown.style.display = 'none';
      }
    }
  });
}

// Fetch wine detail - EXACTLY LIKE FLUTTER'S getWineById()
async function fetchWineDetail(wineId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching wine detail for ID: ${wineId}`);
    
    // Use EXACT SAME ENDPOINT as Flutter
    const apiUrl = `${API_BASE_URL}/wines/${wineId}`;
    
    console.log('📡 Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch wine details: ${response.status}`);
    }
    
    const wine = await response.json();
    console.log('✅ Wine detail received:', wine);
    
    currentWine = wine;
    
    // Update page title and wine type
    if (wineTypeElement) {
      wineTypeElement.textContent = wine.type || 'Wine Details';
    }
    
    // Update page title
    document.title = `Wine & Bubbles — ${wine.name}`;
    
    // Fetch all wines for related wines section
    await fetchAllWines();
    
    // Render wine detail
    renderWineDetail(wine);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine details: ${error.message}`);
  }
}

// Fetch all wines for related wines
async function fetchAllWines() {
  try {
    const apiUrl = `${API_BASE_URL}/wines?all=true`;
    
    console.log('📡 Fetching all wines from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
      throw new Error(`Failed to fetch all wines: ${response.status}`);
    }
    
    allWines = await response.json();
    console.log(`✅ All wines received: ${allWines.length} wines`);
    
  } catch (error) {
    console.error('Error fetching all wines:', error);
  }
}

// Helper to fix image URLs
function fixImageUrl(imageUrl) {
  if (!imageUrl) {
    return '../assets/wines/breakfast/Noir.png';
  }
  
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return '../assets/' + imageUrl;
}

// Render wine detail with COMING SOON support
function renderWineDetail(wine) {
  const isComingSoon = !wine.isActive;
  const imageUrl = fixImageUrl(wine.imageUrl);
  const price = wine.price || 0;
  const type = wine.type || 'Wine';
  const category = wine.category || 'Uncategorized';
  const description = wine.description || 'No description available.';
  const stockCount = wine.stockCount || 0;
  const isInStock = stockCount > 0 && !isComingSoon;
  
  wineDetailContainer.innerHTML = `
    <div class="wine-detail-card">
      <div class="wine-detail-image-container">
        <img src="${imageUrl}" 
             alt="${wine.name}" 
             class="wine-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
        ${isComingSoon ? '<div class="coming-soon-overlay-large"><span>COMING SOON</span></div>' : ''}
      </div>
      <div class="wine-detail-content">
        <h1 class="wine-detail-name" style="${isComingSoon ? 'color: #999;' : ''}">${wine.name}</h1>
        <div class="wine-detail-type">${type}</div>
        ${!isComingSoon ? `<div class="wine-detail-price">R${price.toFixed(2)} per bottle</div>` : '<div class="wine-detail-price coming-soon-text">Coming Soon</div>'}
        
        <div class="wine-detail-meta">
          <div class="wine-meta-item">
            <div class="wine-meta-label">Category</div>
            <div class="wine-meta-value">${category}</div>
          </div>
          <div class="wine-meta-item">
            <div class="wine-meta-label">Type</div>
            <div class="wine-meta-value">${type}</div>
          </div>
        </div>
        
        ${!isComingSoon ? `
          <div class="stock-status ${isInStock ? 'stock-in' : 'stock-out'}">
            ${isInStock ? 'In Stock' : 'Out of Stock'}
          </div>
        ` : ''}
        
        <p class="wine-detail-description">${description}</p>
        
        ${!isComingSoon && isInStock ? `
          <div class="quantity-selector">
            <button class="quantity-btn" id="decrementBtn" ${quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <div class="quantity-display" id="quantityDisplay">${quantity}</div>
            <button class="quantity-btn" id="incrementBtn" ${quantity >= 10 ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
        ` : ''}
        
        <button class="add-to-cart-btn" id="addToCartBtn" ${(!isInStock || isComingSoon) ? 'disabled' : ''}>
          ${isComingSoon ? 'Coming Soon' : (isInStock ? `Add ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} to Cart (R${(price * quantity).toFixed(2)})` : 'Out of Stock')}
        </button>
      </div>
    </div>
  `;
  
  // Setup quantity buttons
  if (!isComingSoon && isInStock) {
    const decrementBtn = document.getElementById('decrementBtn');
    const incrementBtn = document.getElementById('incrementBtn');
    const addToCartBtn = document.getElementById('addToCartBtn');
    
    if (decrementBtn) {
      decrementBtn.addEventListener('click', decrementQuantity);
    }
    if (incrementBtn) {
      incrementBtn.addEventListener('click', incrementQuantity);
    }
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', addToCart);
    }
  }
}

// Quantity controls
function incrementQuantity() {
  if (quantity < 10) {
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
  const decrementBtn = document.getElementById('decrementBtn');
  const incrementBtn = document.getElementById('incrementBtn');
  const addToCartBtn = document.getElementById('addToCartBtn');
  
  if (quantityDisplay) {
    quantityDisplay.textContent = quantity;
  }
  
  if (decrementBtn) {
    decrementBtn.disabled = quantity <= 1;
  }
  if (incrementBtn) {
    incrementBtn.disabled = quantity >= 10;
  }
  
  if (addToCartBtn && currentWine && currentWine.isActive) {
    const price = currentWine.price || 0;
    addToCartBtn.textContent = `Add ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} to Cart (R${(price * quantity).toFixed(2)})`;
  }
}

// Add to cart
function addToCart() {
  if (!currentWine) {
    console.error('❌ No current wine data');
    showToast('No wine data available', 'error');
    return;
  }
  
  if (!currentWine.isActive) {
    showToast(`${currentWine.name} is coming soon`, 'error');
    return;
  }
  
  if (currentWine.stockCount <= 0) {
    showToast(`${currentWine.name} is out of stock`, 'error');
    return;
  }
  
  // Create cart item with correct structure
  const cartItem = {
    id: currentWine.id.toString(),
    name: currentWine.name,
    price: currentWine.price,
    imageUrl: currentWine.imageUrl,
    type: 'wine',
    category: currentWine.category || '',
    description: currentWine.description || '',
    quantity: quantity,
    isCase: false
  };
  
  console.log('🛒 Attempting to add item to cart:', cartItem);
  
  if (window.CartUtils && typeof window.CartUtils.addItem === 'function') {
    try {
      window.CartUtils.addItem(cartItem);
      console.log('✅ Item added successfully!');
      
      showToast(`Added ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} of ${currentWine.name} to cart`, 'success');
      
      // Reset quantity
      quantity = 1;
      updateQuantityDisplay();
      
      // Update cart badge
      window.CartUtils.updateCartBadge();
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
    }
  } else {
    console.error('❌ CartUtils not available');
    showToast('Cart system is not available. Please refresh the page.', 'error');
  }
}

// Show related wines (only show active wines)
function showRelatedWines() {
  if (!allWines.length) return;
  
  let related = allWines.filter(wine => {
    if (currentWine && wine.id === currentWine.id) return false;
    // Only show active wines in related section
    if (!wine.isActive) return false;
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
      
      if (!(matchesName || matchesType || matchesDescription)) return false;
    }
    
    if (currentFilter && wine.type !== currentFilter) return false;
    
    return true;
  });
  
  if (related.length === 0) {
    relatedWinesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No related wines found</h3>
        <p>Try changing your search or filter</p>
      </div>
    `;
  } else {
    related = related.slice(0, 6);
    
    relatedWinesGrid.innerHTML = related.map(wine => {
      const imageUrl = fixImageUrl(wine.imageUrl);
      const price = wine.price || 0;
      const type = wine.type || 'Wine';
      const category = wine.category || '';
      
      return `
        <div class="wine-card" onclick="navigateToWineDetail(${wine.id})">
          <div class="wine-image-container">
            <img src="${imageUrl}" 
                 alt="${wine.name}" 
                 class="wine-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
          </div>
          <div class="wine-label">
            <div class="wine-title">${wine.name}</div>
            <div class="wine-sub">${type}</div>
            <div class="wine-sub">${category}</div>
            <div class="wine-price">R${price.toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  relatedWinesSection.style.display = 'block';
}

// Hide related wines
function hideRelatedWines() {
  relatedWinesSection.style.display = 'none';
  if (searchInput) searchInput.value = '';
  searchQuery = '';
  currentFilter = '';
  if (filterBtn) {
    filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
  }
}

// Navigate to wine detail
function navigateToWineDetail(wineId) {
  window.location.href = `wine_detail.html?id=${wineId}`;
}

// UI States
function showLoading() {
  wineDetailContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine details...</p>
    </div>
  `;
}

function showError(message) {
  wineDetailContainer.innerHTML = `
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
  if (existingToast) {
    existingToast.remove();
  }
  
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
window.navigateToWineDetail = navigateToWineDetail;
window.hideRelatedWines = hideRelatedWines;