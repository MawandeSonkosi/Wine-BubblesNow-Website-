// Wine Detail JavaScript - MATCHING FLUTTER APP
// Configuration - USE EXACT SAME API AS FLUTTER
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';

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
  
  // Add debug button
  addDebugButton();
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
    
    // Use EXACT SAME ENDPOINT as Flutter: https://www.wineandbubblesnow.co.za/api/wines/{id}
    const apiUrl = `${API_BASE_URL}/wines/${wineId}`;
    
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
    
    // Fetch all wines for related wines section - USING FLUTTER'S getWines()
    await fetchAllWines();
    
    // Render wine detail
    renderWineDetail(wine);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine details: ${error.message}`);
  }
}

// Fetch all wines for related wines - EXACTLY LIKE FLUTTER'S getWines()
async function fetchAllWines() {
  try {
    // Use EXACT SAME ENDPOINT as Flutter: https://www.wineandbubblesnow.co.za/api/wines?all=true
    const apiUrl = `${API_BASE_URL}/wines?all=true`;
    
    console.log('📡 Fetching all wines from (EXACT FLUTTER URL):', apiUrl);
    
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

// Helper to fix image URLs - SAME AS FLUTTER
function fixImageUrl(imageUrl) {
  if (!imageUrl) {
    return '../assets/wines/breakfast/Noir.png';
  }
  
  // If starts with assets/, keep as is (relative to current page)
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  // If already has proper path or is absolute URL, return as-is
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Otherwise, assume it's relative to assets folder
  return '../assets/' + imageUrl;
}

// Render wine detail - SIMILAR TO FLUTTER'S WineDetailScreen
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
        <div class="wine-detail-price">R${price.toFixed(2)} per bottle</div>
        
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
          
          <!-- Add case option - SIMILAR TO FLUTTER ADD-ONS -->
          <div class="case-option" style="margin: 15px 0; padding: 10px; background: #f8f8f8; border-radius: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
              <input type="checkbox" id="caseCheckbox" onchange="toggleCaseOption()">
              <span style="margin-left: 10px; font-weight: 500;">
                Add as case of 6 bottles (R${(price * 6).toFixed(2)})
                <br><small style="font-size: 12px; color: #666;">Save 10% vs buying individually</small>
              </span>
            </label>
          </div>
        ` : ''}
        
        <button class="add-to-cart-btn" id="addToCartBtn" onclick="addToCart()" ${!isInStock ? 'disabled' : ''}>
          ${isInStock ? `Add ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} to Cart (R${(price * quantity).toFixed(2)})` : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

// Toggle case option
function toggleCaseOption() {
  const caseCheckbox = document.getElementById('caseCheckbox');
  const addToCartBtn = document.getElementById('addToCartBtn');
  
  if (!caseCheckbox || !addToCartBtn || !currentWine) return;
  
  const price = currentWine.price || 0;
  
  if (caseCheckbox.checked) {
    // Calculate case price (6 bottles)
    const casePrice = price * 6;
    addToCartBtn.textContent = `Add ${quantity} case${quantity > 1 ? 's' : ''} to Cart (R${(casePrice * quantity).toFixed(2)})`;
  } else {
    addToCartBtn.textContent = `Add ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} to Cart (R${(price * quantity).toFixed(2)})`;
  }
}

// Quantity controls - SIMILAR TO FLUTTER'S _increment() and _decrement()
function incrementQuantity() {
  if (quantity < 10) { // Limit to max 10 items (matches Flutter's limit)
    quantity++;
    updateQuantityDisplay();
    toggleCaseOption(); // Update button text with new price
  }
}

function decrementQuantity() {
  if (quantity > 1) {
    quantity--;
    updateQuantityDisplay();
    toggleCaseOption(); // Update button text with new price
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

// Add to cart - USING CORRECT CARTUTILS METHODS (matches Flutter's _addToCart())
function addToCart() {
  if (!currentWine) {
    console.error('❌ No current wine data');
    showToast('No wine data available', 'error');
    return;
  }
  
  if (currentWine.stockCount <= 0) {
    showToast(`${currentWine.name} is out of stock`, 'error');
    return;
  }
  
  const caseCheckbox = document.getElementById('caseCheckbox');
  const isCase = caseCheckbox ? caseCheckbox.checked : false;
  
  // Create cart item with correct structure
  const cartItem = {
    id: currentWine.id.toString(),
    name: currentWine.name,
    price: isCase ? currentWine.price * 6 : currentWine.price, // Price for case or single bottle
    pricePerBottle: currentWine.price, // Store original bottle price for case calculations
    imageUrl: currentWine.imageUrl,
    type: 'wine', // Must match CartUtils type checking
    category: currentWine.category || '',
    description: currentWine.description || '',
    quantity: quantity,
    isCase: isCase // Important flag for case vs bottle
  };
  
  console.log('🛒 Attempting to add item to cart:', cartItem);
  console.log('📦 CartUtils available:', !!window.CartUtils);
  
  // Add to cart using unified cart system
  if (window.CartUtils && typeof window.CartUtils.addItem === 'function') {
    try {
      console.log('📝 Calling CartUtils.addItem()');
      const updatedCart = window.CartUtils.addItem(cartItem);
      console.log('✅ Item added successfully! Updated cart:', updatedCart);
      
      // Show success message - SIMILAR TO FLUTTER'S SnackBar
      let successMessage;
      if (isCase) {
        successMessage = `Added ${quantity} case${quantity > 1 ? 's' : ''} of ${currentWine.name} to cart`;
      } else {
        successMessage = `Added ${quantity} ${quantity === 1 ? 'bottle' : 'bottles'} of ${currentWine.name} to cart`;
      }
      
      showToast(successMessage, 'success');
      
      // Reset quantity
      quantity = 1;
      updateQuantityDisplay();
      
      // Reset case checkbox
      if (caseCheckbox) {
        caseCheckbox.checked = false;
        toggleCaseOption();
      }
      
      // Update cart badge
      window.CartUtils.updateCartBadge();
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      showToast('Failed to add item to cart: ' + error.message, 'error');
    }
  } else {
    console.error('❌ CartUtils not available or missing addItem method');
    console.log('CartUtils object:', window.CartUtils);
    showToast('Cart system is not available. Please refresh the page.', 'error');
  }
}

// Show related wines - SIMILAR TO FLUTTER'S search functionality
function showRelatedWines() {
  if (!allWines.length) return;
  
  // Filter wines
  let related = allWines.filter(wine => {
    // Exclude current wine
    if (currentWine && wine.id === currentWine.id) return false;
    
    // Apply search filter - SIMILAR TO FLUTTER'S search logic
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

// Toast notification - SIMILAR TO FLUTTER'S SnackBar
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
function debugCart() {
  console.log('=== DEBUG CART ===');
  console.log('CartUtils available:', !!window.CartUtils);
  console.log('CartUtils methods:', Object.keys(window.CartUtils || {}));
  
  if (window.CartUtils) {
    const cart = window.CartUtils.getCart();
    console.log('Cart contents:', cart);
    console.log('Cart count:', window.CartUtils.getCartCount());
    console.log('Cart items:', cart.items);
    console.log('LocalStorage cart:', localStorage.getItem('wine_cart'));
  }
  
  console.log('Current wine:', currentWine);
  console.log('Current quantity:', quantity);
  
  const caseCheckbox = document.getElementById('caseCheckbox');
  console.log('Is case:', caseCheckbox?.checked);
  
  console.log('=================');
}

// Add debug button
function addDebugButton() {
  const debugBtn = document.createElement('button');
  debugBtn.textContent = 'Debug Cart';
  debugBtn.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #6b0d2b;
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    z-index: 10000;
    cursor: pointer;
    font-size: 12px;
  `;
  debugBtn.onclick = debugCart;
  document.body.appendChild(debugBtn);
}

// Make functions available globally
window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.navigateToWineDetail = navigateToWineDetail;
window.hideRelatedWines = hideRelatedWines;
window.toggleCaseOption = toggleCaseOption;
window.debugCart = debugCart;