// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

// State
let currentPairing = null;
let relatedPairings = [];
let quantity = 1;
let cartCount = 0;

// DOM Elements
const pairingDetailContainer = document.getElementById('pairingDetailContainer');
const pairingCategory = document.getElementById('pairingCategory');
const relatedPairingsSection = document.getElementById('relatedPairingsSection');
const relatedPairingsGrid = document.getElementById('relatedPairingsGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const cartBadge = document.getElementById('cartBadge');
const cartIcon = document.getElementById('cartIcon');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🥂 Pairing detail page loaded');
  
  // Get pairing ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const pairingId = urlParams.get('id');
  
  if (!pairingId) {
    showError('No pairing ID provided');
    return;
  }
  
  fetchPairingDetail(parseInt(pairingId));
  setupEventListeners();
  loadCartCount();
});

// Event Listeners
function setupEventListeners() {
  // Search input for related pairings
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterRelatedPairings(e.target.value.toLowerCase());
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (filterDropdown && !event.target.closest('.filter-dropdown')) {
      filterDropdown.style.display = 'none';
    }
  });
}

// Load cart count from localStorage
function loadCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('wine_cart') || '[]');
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    updateCartBadge();
  } catch (error) {
    console.error('Error loading cart:', error);
  }
}

// Update cart badge
function updateCartBadge() {
  if (cartBadge) {
    cartBadge.textContent = cartCount;
    cartBadge.style.display = cartCount > 0 ? 'flex' : 'none';
  }
}

// Fetch pairing detail
async function fetchPairingDetail(pairingId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching pairing detail for ID: ${pairingId}...`);
    
    // Use CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/addons/${pairingId}`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const pairing = await response.json();
    console.log('✅ Pairing detail received:', pairing);
    
    currentPairing = pairing;
    
    // Update category header
    if (pairingCategory) {
      pairingCategory.textContent = pairing.category || 'Pairing';
    }
    
    // Render pairing details
    renderPairingDetail(pairing);
    
    // Fetch related pairings
    fetchRelatedPairings(pairing.category);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load pairing details: ${error.message}`);
  }
}

// Fix image URLs
function fixImageUrl(imageUrl) {
  if (!imageUrl) {
    return '../assets/images/default_addon.png';
  }
  
  if (imageUrl.startsWith('../assets/')) {
    return imageUrl;
  }
  
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return '../assets/' + imageUrl;
}

// Render pairing detail
function renderPairingDetail(pairing) {
  const imageUrl = fixImageUrl(pairing.imageUrl);
  const price = pairing.price || 0;
  const category = pairing.category || 'Add-On';
  
  const template = `
    <div class="pairing-detail-card">
      <div class="pairing-detail-image-container">
        <img src="${imageUrl}" 
             alt="${pairing.name}" 
             class="pairing-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/images/default_addon.png';">
      </div>
      <div class="pairing-detail-content">
        <h1 class="pairing-detail-name">${pairing.name}</h1>
        <div class="pairing-detail-category">${category}</div>
        <div class="pairing-detail-price">R${price.toFixed(2)}</div>
        
        <!-- Quantity Selector -->
        <div class="quantity-selector">
          <button class="quantity-btn" id="decrementBtn" ${quantity <= 1 ? 'disabled' : ''}>
            <i class="fas fa-minus"></i>
          </button>
          <div class="quantity-display" id="quantityDisplay">${quantity}</div>
          <button class="quantity-btn" id="incrementBtn">
            <i class="fas fa-plus"></i>
          </button>
        </div>
        
        <!-- Add to Cart Button -->
        <button class="add-to-cart-btn" id="addToCartBtn">
          Add to Cart
        </button>
      </div>
    </div>
  `;
  
  pairingDetailContainer.innerHTML = template;
  
  // Setup quantity buttons
  document.getElementById('decrementBtn').addEventListener('click', decrementQuantity);
  document.getElementById('incrementBtn').addEventListener('click', incrementQuantity);
  document.getElementById('addToCartBtn').addEventListener('click', addToCart);
}

// Quantity controls
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
  const decrementBtn = document.getElementById('decrementBtn');
  
  if (quantityDisplay) {
    quantityDisplay.textContent = quantity;
  }
  
  if (decrementBtn) {
    decrementBtn.disabled = quantity <= 1;
  }
}

// Add to cart
function addToCart() {
  if (!currentPairing) return;
  
  try {
    // Get current cart from localStorage
    const cart = JSON.parse(localStorage.getItem('wine_cart') || '[]');
    
    // Check if pairing already exists in cart
    const existingIndex = cart.findIndex(item => 
      item.type === 'pairing' && item.id === currentPairing.id
    );
    
    if (existingIndex !== -1) {
      // Update quantity
      cart[existingIndex].quantity += quantity;
    } else {
      // Add new item
      cart.push({
        type: 'pairing',
        id: currentPairing.id,
        name: currentPairing.name,
        price: currentPairing.price,
        imageUrl: currentPairing.imageUrl,
        category: currentPairing.category,
        quantity: quantity
      });
    }
    
    // Save to localStorage
    localStorage.setItem('wine_cart', JSON.stringify(cart));
    
    // Update cart count
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    updateCartBadge();
    
    // Show success message
    showToast(`${quantity} × ${currentPairing.name} added to cart`);
    
    // Reset quantity
    quantity = 1;
    updateQuantityDisplay();
    
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Failed to add to cart', 'error');
  }
}

// Fetch related pairings
async function fetchRelatedPairings(category) {
  try {
    console.log(`🌐 Fetching related pairings for category: ${category}...`);
    
    // Use CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/addons`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const allPairings = await response.json();
    
    // Filter by same category (excluding current pairing)
    relatedPairings = allPairings.filter(pairing => 
      pairing.category === category && 
      pairing.id !== currentPairing.id
    ).slice(0, 6); // Limit to 6 related items
    
    console.log(`✅ Found ${relatedPairings.length} related pairings`);
    
    if (relatedPairings.length > 0) {
      // Show related pairings section
      relatedPairingsSection.style.display = 'block';
      
      // Populate filter dropdown
      populateFilterDropdown(allPairings);
      
      // Render related pairings
      renderRelatedPairings(relatedPairings);
    }
    
  } catch (error) {
    console.error('Error fetching related pairings:', error);
  }
}

// Populate filter dropdown
function populateFilterDropdown(pairings) {
  if (!filterDropdown) return;
  
  const categories = new Set(['All']);
  pairings.forEach(pairing => {
    if (pairing.category && pairing.category.trim() !== '') {
      categories.add(pairing.category);
    }
  });
  
  filterDropdown.innerHTML = '';
  
  Array.from(categories).sort().forEach(category => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = category === 'All' ? '' : category;
    link.textContent = category;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const filterValue = category === 'All' ? '' : category;
      filterRelatedPairingsByCategory(filterValue);
      filterDropdown.style.display = 'none';
    });
    filterDropdown.appendChild(link);
  });
}

// Filter related pairings by category
function filterRelatedPairingsByCategory(category) {
  let filtered = [];
  
  if (category === '') {
    // Show all related pairings
    filtered = relatedPairings.filter(pairing => pairing.id !== currentPairing.id);
  } else {
    // Filter by category
    filtered = relatedPairings.filter(pairing => 
      pairing.category === category && 
      pairing.id !== currentPairing.id
    );
  }
  
  renderRelatedPairings(filtered);
  
  // Update filter button
  if (filterBtn) {
    filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${category === '' ? 'Filter' : category}`;
  }
}

// Filter related pairings by search query
function filterRelatedPairings(searchQuery) {
  if (!searchQuery) {
    renderRelatedPairings(relatedPairings);
    return;
  }
  
  const filtered = relatedPairings.filter(pairing => {
    const matchesName = (pairing.name || '').toLowerCase().includes(searchQuery);
    const matchesCategory = (pairing.category || '').toLowerCase().includes(searchQuery);
    return matchesName || matchesCategory;
  });
  
  renderRelatedPairings(filtered);
}

// Render related pairings
function renderRelatedPairings(pairings) {
  if (!relatedPairingsGrid) return;
  
  if (pairings.length === 0) {
    relatedPairingsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1">
        <i class="fas fa-wine-bottle"></i>
        <h3>No related pairings found</h3>
        <p>Try changing your search or filter</p>
      </div>
    `;
    return;
  }
  
  relatedPairingsGrid.innerHTML = pairings.map(pairing => {
    const imageUrl = fixImageUrl(pairing.imageUrl);
    const price = pairing.price || 0;
    const category = pairing.category || 'Add-On';
    
    return `
      <div class="wine-card" onclick="window.location.href='pairings_detail.html?id=${pairing.id}'">
        <div class="wine-image-container">
          <img src="${imageUrl}" 
               alt="${pairing.name}" 
               class="wine-image"
               loading="lazy"
               onerror="this.onerror=null; this.src='../assets/images/default_addon.png';">
        </div>
        <div class="wine-label">
          <div class="wine-title">${pairing.name}</div>
          <div class="wine-sub">${category}</div>
          <div class="wine-price">R${price.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// UI States
function showLoading() {
  pairingDetailContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading pairing details...</p>
    </div>
  `;
}

function showError(message) {
  pairingDetailContainer.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="window.location.href='pairings.html'" class="btn-fill">
        Back to Pairings
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
  toast.className = `toast-notification ${type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `
    <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 3000);
}

// Make functions available globally
window.filterRelatedPairingsByCategory = filterRelatedPairingsByCategory;