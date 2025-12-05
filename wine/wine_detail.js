// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

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
  
  setupEventListeners();
  updateCartBadge();
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
}

// Fetch wine detail
async function fetchWineDetail(wineId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching wine detail for ID: ${wineId}`);
    
    // Use CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/wines/${wineId}`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/wines?all=true`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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

// Render wine detail
function renderWineDetail(wine) {
  const imageUrl = fixImageUrl(wine.imageUrl);
  const price = wine.price || 0;
  const type = wine.type || 'Wine';
  const category = wine.category || 'Uncategorized';
  const description = wine.description || 'No description available.';
  const stockCount = wine.stockCount || 0;
  const isInStock = stockCount > 0;
  
  wineDetailContainer.innerHTML = `
    <div class="wine-detail-card">
      <div class="wine-detail-image-container">
        <img src="${imageUrl}" 
             alt="${wine.name}" 
             class="wine-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
      </div>
      <div class="wine-detail-content">
        <h1 class="wine-detail-name">${wine.name}</h1>
        <div class="wine-detail-type">${type}</div>
        <div class="wine-detail-price">R${price.toFixed(2)}</div>
        
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
        
        <div class="stock-status ${isInStock ? 'stock-in' : 'stock-out'}">
          ${isInStock ? 'In Stock' : 'Out of Stock'}
        </div>
        
        <p class="wine-detail-description">${description}</p>
        
        ${isInStock ? `
          <div class="quantity-selector">
            <button class="quantity-btn" onclick="decrementQuantity()" ${quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <div class="quantity-display" id="quantityDisplay">${quantity}</div>
            <button class="quantity-btn" onclick="incrementQuantity()" ${quantity >= 10 ? 'disabled' : ''}>
              <i class="fas fa-plus"></i>
            </button>
          </div>
        ` : ''}
        
        <button class="add-to-cart-btn" onclick="addToCart()" ${!isInStock ? 'disabled' : ''}>
          ${isInStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

// Quantity controls
function incrementQuantity() {
  if (quantity < 10) { // Limit to max 10 items
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
  if (quantityDisplay) {
    quantityDisplay.textContent = quantity;
  }
  
  // Update button states
  const minusBtn = document.querySelector('.quantity-btn:first-child');
  const plusBtn = document.querySelector('.quantity-btn:last-child');
  
  if (minusBtn) {
    minusBtn.disabled = quantity <= 1;
  }
  if (plusBtn) {
    plusBtn.disabled = quantity >= 10; // Max 10 items
  }
}

// Add to cart
function addToCart() {
  if (!currentWine) return;
  
  if (currentWine.stockCount <= 0) {
    showToast(`${currentWine.name} is out of stock`, 'error');
    return;
  }
  
  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('wine_cart') || '[]');
  
  // Check if wine already in cart
  const existingIndex = cart.findIndex(item => item.id === currentWine.id);
  
  if (existingIndex > -1) {
    // Update quantity
    cart[existingIndex].quantity += quantity;
  } else {
    // Add new item
    cart.push({
      id: currentWine.id,
      name: currentWine.name,
      price: currentWine.price,
      imageUrl: currentWine.imageUrl,
      type: currentWine.type,
      category: currentWine.category,
      quantity: quantity
    });
  }
  
  // Save to localStorage
  localStorage.setItem('wine_cart', JSON.stringify(cart));
  
  // Update cart badge in top navigation
  updateCartBadge();
  
  // Show success message
  showToast(`Added ${quantity} ${currentWine.name} to cart`);
  
  // Reset quantity
  quantity = 1;
  updateQuantityDisplay();
}

// Update cart badge in top navigation
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('wine_cart') || '[]');
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Update cart badges in top navigation
  const cartBadges = document.querySelectorAll('.cart-badge');
  cartBadges.forEach(badge => {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  });
}

// Show related wines
function showRelatedWines() {
  if (!allWines.length) return;
  
  // Filter wines
  let related = allWines.filter(wine => {
    // Exclude current wine
    if (currentWine && wine.id === currentWine.id) return false;
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
      
      if (!(matchesName || matchesType || matchesDescription)) return false;
    }
    
    // Apply type filter
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
    // Limit to 6 wines
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
            <div class="wine-sub">R${price.toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Show the section
  relatedWinesSection.style.display = 'block';
}

// Hide related wines
function hideRelatedWines() {
  relatedWinesSection.style.display = 'none';
  searchInput.value = '';
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

// Make functions available globally
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.navigateToWineDetail = navigateToWineDetail;
window.hideRelatedWines = hideRelatedWines;