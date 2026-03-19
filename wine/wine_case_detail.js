// Configuration - USE RELATIVE URL FOR CLOUDFLARE
const API_BASE_URL = '/api'; // This works on both localhost and app.wineandbubblesnow.co.za

// List of wine types to include for wine cases
const allowedTypes = ['Red Wine', 'White Wine', 'Champagne'];

// State
let currentWine = null;
let allWines = [];
let filteredWines = [];
let searchQuery = '';
let currentFilter = '';
let quantity = 1;

// DOM Elements
const wineCaseDetailContainer = document.getElementById('wineCaseDetailContainer');
const relatedWineCasesSection = document.getElementById('relatedWineCasesSection');
const relatedWineCasesGrid = document.getElementById('relatedWineCasesGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const wineCaseTypeElement = document.getElementById('wineCaseType');

// Cart Utilities
let cartUtils = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Wine Case Detail page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  
  // Initialize cart utils
  waitForCartUtils(() => {
    cartUtils = window.CartUtils;
    console.log('✅ CartUtils loaded successfully');
    updateCartBadge();
  });
  
  // Get wine ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const wineId = urlParams.get('id') || '';
  
  if (wineId) {
    console.log(`🎯 Loading wine case with ID: ${wineId}`);
    fetchWineCaseDetail(wineId);
  } else {
    showError('No wine case ID provided in URL');
  }
  
  setupEventListeners();
});

// Wait for CartUtils to load
function waitForCartUtils(callback) {
  const maxAttempts = 20;
  let attempts = 0;
  
  const check = () => {
    attempts++;
    if (window.CartUtils && typeof window.CartUtils.getCart === 'function') {
      console.log('✅ CartUtils loaded successfully after', attempts, 'attempts');
      callback();
    } else if (attempts >= maxAttempts) {
      console.error('❌ CartUtils failed to load after', maxAttempts, 'attempts');
    } else {
      console.log(`⏳ Waiting for CartUtils... (attempt ${attempts})`);
      setTimeout(check, 250);
    }
  };
  
  check();
}

// Event Listeners
function setupEventListeners() {
  // Search input
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchQuery = searchInput.value.trim();
        if (searchQuery) {
          // Navigate to wine cases list with search query
          window.location.href = `wine_cases_list.html?search=${encodeURIComponent(searchQuery)}`;
        }
      }
    });
  }
  
  // Toggle filter dropdown on button click
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle('show');
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (filterDropdown && !event.target.closest('.filter-dropdown')) {
      filterDropdown.classList.remove('show');
    }
  });
  
  // Listen for cart updates
  window.addEventListener('cartUpdated', () => {
    updateCartBadge();
  });
}

// Extract wine types for filter
function extractWineTypes(wines) {
  const types = new Set(['All Wine Cases']);
  
  // Filter to only allowed types
  const filteredWines = wines.filter(wine => allowedTypes.includes(wine.type));
  
  filteredWines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '') {
      types.add(wine.type);
    }
  });
  
  return Array.from(types).sort();
}

// Populate filter dropdown
function populateFilterDropdown(wines) {
  if (!filterDropdown) return;
  
  const wineTypes = extractWineTypes(wines);
  console.log('Wine types for cases filter:', wineTypes);
  
  filterDropdown.innerHTML = '';
  
  wineTypes.forEach(wineType => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = wineType === 'All Wine Cases' ? '' : wineType;
    link.textContent = wineType;
    
    // Highlight current filter if it matches current wine type
    if (currentWine && wineType === currentWine.type) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const filterValue = wineType === 'All Wine Cases' ? '' : wineType;
      
      // Navigate to wine_cases_list with the selected filter
      if (filterValue) {
        window.location.href = `wine_cases_list.html?type=${encodeURIComponent(filterValue)}`;
      } else {
        window.location.href = 'wine_cases_list.html';
      }
      
      filterDropdown.classList.remove('show');
    });
    filterDropdown.appendChild(link);
  });
}

// Update filter button to show current wine type
function updateFilterButton() {
  if (filterBtn && currentWine) {
    filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${currentWine.type || 'Filter'}`;
    filterBtn.classList.add('has-filter');
  }
}

// Fetch wine case detail
async function fetchWineCaseDetail(wineId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching wine case detail for ID: ${wineId}`);
    
    // Use relative URL through your proxy server
    const apiUrl = `${API_BASE_URL}/wines/${wineId}?_=${Date.now()}`;
    console.log('📡 Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const wine = await response.json();
    console.log('✅ Wine case detail received:', wine);
    
    // Check if this wine type should be included
    if (!allowedTypes.includes(wine.type)) {
      showError('This item is not available as a wine case');
      return;
    }
    
    currentWine = wine;
    
    // Update page title and wine type
    if (wineCaseTypeElement) {
      wineCaseTypeElement.textContent = `${wine.type} Case`;
    }
    
    // Update page title
    document.title = `Wine & Bubbles — ${wine.name} Case`;
    
    // Fetch all wines for related wine cases section
    await fetchAllWines();
    
    // Update filter button to show current wine type
    updateFilterButton();
    
    // Render wine case detail
    renderWineCaseDetail(wine);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine case details: ${error.message}`);
  }
}

// Fetch all wines for related wine cases
async function fetchAllWines() {
  try {
    const apiUrl = `${API_BASE_URL}/wines?all=true&_=${Date.now()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const wines = await response.json();
    
    // Filter to only allowed types for wine cases
    allWines = wines.filter(wine => allowedTypes.includes(wine.type));
    console.log(`✅ All wine cases received: ${allWines.length} wines (${allowedTypes.join(', ')})`);
    
    // Populate filter dropdown
    populateFilterDropdown(allWines);
    
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

// Render wine case detail
function renderWineCaseDetail(wine) {
  const imageUrl = fixImageUrl(wine.imageUrl);
  const price = wine.price || 0;
  const type = wine.type || 'Wine';
  const description = wine.description || 'No description available.';
  const stockCount = wine.stockCount || 0;
  const isInStock = stockCount > 0;
  const casePrice = (price * 6).toFixed(2); // 6 bottles per case
  const savings = (price * 0.6).toFixed(2); // 10% discount on case
  
  wineCaseDetailContainer.innerHTML = `
    <div class="wine-case-detail-card">
      <div class="wine-case-detail-image-container">
        <img src="${imageUrl}" 
             alt="${wine.name}" 
             class="wine-case-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
      </div>
      <div class="wine-case-detail-content">
        <div class="case-size-badge">
          <i class="fas fa-box"></i> Case of 6 Bottles
        </div>
        
        <h1 class="wine-case-detail-name">${wine.name}</h1>
        <div class="wine-case-detail-type">Wine Case • ${type}</div>
        <div class="wine-case-detail-price">R${casePrice}</div>
        
        <div class="wine-case-detail-meta">
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">Single Bottle Price</div>
            <div class="wine-case-meta-value">R${price.toFixed(2)}</div>
          </div>
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">You Save</div>
            <div class="wine-case-meta-value" style="color: #27ae60; font-weight: bold;">R${savings}</div>
          </div>
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">Type</div>
            <div class="wine-case-meta-value">${type}</div>
          </div>
        </div>
        
        <div class="stock-status ${isInStock ? 'stock-in' : 'stock-out'}">
          ${isInStock ? 'In Stock' : 'Out of Stock'}
        </div>
        
        <p class="wine-case-detail-description">${description}</p>
        
        <p class="wine-case-detail-description" style="font-style: italic; color: #666;">
          This wine case contains 6 bottles of ${wine.name} ${type}. Perfect for events, gifting, or stocking your wine collection.
        </p>
        
        ${isInStock ? `
          <div class="quantity-selector">
            <button class="quantity-btn" onclick="decrementQuantity()" ${quantity <= 1 ? 'disabled' : ''}>
              <i class="fas fa-minus"></i>
            </button>
            <div class="quantity-display" id="quantityDisplay">${quantity}</div>
            <button class="quantity-btn" onclick="incrementQuantity()">
              <i class="fas fa-plus"></i>
            </button>
          </div>
        ` : ''}
        
        <button class="add-to-cart-btn" onclick="addToCart()" ${!isInStock ? 'disabled' : ''}>
          ${isInStock ? 'Add Case to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  `;
}

// Quantity controls - NO LIMITS
function incrementQuantity() {
  quantity++;
  updateQuantityDisplay();
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
  
  if (minusBtn) {
    minusBtn.disabled = quantity <= 1;
  }
  // Plus button is never disabled - NO LIMIT
}

// Add to cart (as wine case)
function addToCart() {
  if (!currentWine) return;
  
  if (!cartUtils) {
    showToast('Cart system not available', 'error');
    return;
  }
  
  if (currentWine.stockCount <= 0) {
    showToast(`${currentWine.name} case is out of stock`, 'error');
    return;
  }
  
  // Calculate case price (6 bottles per case)
  const casePrice = (currentWine.price * 6).toFixed(2);
  
  // Create wine case item with CartUtils compatible structure
  const wineCaseItem = {
    id: `case_${currentWine.id}`,
    name: `${currentWine.name} Case`,
    price: parseFloat(casePrice),
    type: 'wine',
    category: currentWine.category,
    imageUrl: currentWine.imageUrl,
    description: currentWine.description || `Case of 6 bottles of ${currentWine.name}`,
    quantity: quantity,
    isCase: true,
    pricePerBottle: currentWine.price
  };
  
  // Add to cart using CartUtils
  cartUtils.addItem(wineCaseItem);
  
  // Show success message
  showToast(`Added ${quantity} ${currentWine.name} case${quantity > 1 ? 's' : ''} to cart (${6 * quantity} bottles total)`, 'success');
  
  // Reset quantity
  quantity = 1;
  updateQuantityDisplay();
}

// Update cart badge in top navigation
function updateCartBadge() {
  if (cartUtils) {
    cartUtils.updateCartBadge();
  }
}

// Show related wine cases (optional)
function showRelatedWineCases() {
  if (!allWines.length) return;
  
  // Filter wine cases
  let related = allWines.filter(wine => {
    // Exclude current wine
    if (currentWine && wine.id === currentWine.id) return false;
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      
      if (!(matchesName || matchesType)) return false;
    }
    
    // Apply type filter
    if (currentFilter && wine.type !== currentFilter) return false;
    
    return true;
  });
  
  if (related.length === 0) {
    relatedWineCasesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No related wine cases found</h3>
        <p>Try changing your search or filter</p>
      </div>
    `;
  } else {
    // Limit to 6 wine cases
    related = related.slice(0, 6);
    
    relatedWineCasesGrid.innerHTML = related.map(wine => {
      const imageUrl = fixImageUrl(wine.imageUrl);
      const price = wine.price || 0;
      const type = wine.type || 'Wine';
      const casePrice = (price * 6).toFixed(2);
      
      return `
        <div class="wine-card" onclick="navigateToWineCaseDetail(${wine.id})">
          <div class="wine-image-container">
            <img src="${imageUrl}" 
                 alt="${wine.name}" 
                 class="wine-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
          </div>
          <div class="wine-label">
            <div class="wine-title">${wine.name}</div>
            <div class="wine-sub">Wine Case • ${type}</div>
            <div class="wine-price">R${casePrice}</div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Show the section
  relatedWineCasesSection.style.display = 'block';
}

// Hide related wine cases
function hideRelatedWineCases() {
  relatedWineCasesSection.style.display = 'none';
  searchInput.value = '';
  searchQuery = '';
  currentFilter = '';
  if (filterBtn) {
    filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
  }
}

// Navigate to wine case detail
function navigateToWineCaseDetail(wineId) {
  window.location.href = `wine_cases_detail.html?id=${wineId}`;
}

// UI States
function showLoading() {
  wineCaseDetailContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine case details...</p>
    </div>
  `;
}

function showError(message) {
  wineCaseDetailContainer.innerHTML = `
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
window.navigateToWineCaseDetail = navigateToWineCaseDetail;
window.hideRelatedWineCases = hideRelatedWineCases;