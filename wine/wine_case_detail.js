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

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Wine Case Detail page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  
  waitForCartUtils(() => {
    cartUtils = window.CartUtils;
    console.log('✅ CartUtils loaded successfully');
    updateCartBadge();
  });
  
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

function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchQuery = searchInput.value.trim();
        if (searchQuery) {
          window.location.href = `wine_cases_list.html?search=${encodeURIComponent(searchQuery)}`;
        }
      }
    });
  }
  
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.classList.toggle('show');
    });
  }
  
  document.addEventListener('click', (event) => {
    if (filterDropdown && !event.target.closest('.filter-dropdown')) {
      filterDropdown.classList.remove('show');
    }
  });
  
  window.addEventListener('cartUpdated', () => {
    updateCartBadge();
  });
}

function extractWineTypes(wines) {
  const types = new Set(['All Wine Cases']);
  const filteredWines = wines.filter(wine => allowedTypes.includes(wine.type));
  
  filteredWines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '') {
      types.add(wine.type);
    }
  });
  
  return Array.from(types).sort();
}

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
    
    if (currentWine && wineType === currentWine.type) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const filterValue = wineType === 'All Wine Cases' ? '' : wineType;
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
    
    // Use admin endpoint to get ALL wines (including inactive)
    const apiUrl = `${API_BASE_URL}/wines/admin/all?_=${Date.now()}`;
    console.log('📡 Fetching from:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    let wine = null;
    
    if (response.ok) {
      const data = await response.json();
      let wines = [];
      if (data.success && Array.isArray(data.data)) {
        wines = data.data;
      } else if (Array.isArray(data)) {
        wines = data;
      }
      wine = wines.find(w => w.id == wineId);
    }
    
    // Fallback to single endpoint
    if (!wine) {
      const singleUrl = `${API_BASE_URL}/wines/${wineId}?_=${Date.now()}`;
      console.log('📡 Trying single endpoint:', singleUrl);
      const singleResponse = await fetch(singleUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (singleResponse.ok) {
        wine = await singleResponse.json();
      }
    }
    
    if (!wine) {
      throw new Error('Wine case not found');
    }
    
    console.log('✅ Wine case detail received:', wine);
    console.log('   - isActive:', wine.isActive);
    
    if (!allowedTypes.includes(wine.type)) {
      showError('This item is not available as a wine case');
      return;
    }
    
    currentWine = wine;
    
    if (wineCaseTypeElement) {
      wineCaseTypeElement.textContent = `${wine.type} Case`;
    }
    
    document.title = `Wine & Bubbles — ${wine.name} Case`;
    
    await fetchAllWines();
    updateFilterButton();
    renderWineCaseDetail(wine);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine case details: ${error.message}`);
  }
}

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
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const wines = await response.json();
    allWines = wines.filter(wine => allowedTypes.includes(wine.type));
    console.log(`✅ All wine cases received: ${allWines.length} wines`);
    populateFilterDropdown(allWines);
    
  } catch (error) {
    console.error('Error fetching all wines:', error);
  }
}

function fixImageUrl(imageUrl) {
  if (!imageUrl) return '../assets/wines/breakfast/Noir.png';
  if (imageUrl.startsWith('assets/')) return '../' + imageUrl;
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl;
  return '../assets/' + imageUrl;
}

// Render wine case detail with Coming Soon support
function renderWineCaseDetail(wine) {
  const isComingSoon = !wine.isActive;
  const imageUrl = fixImageUrl(wine.imageUrl);
  const price = wine.price || 0;
  const type = wine.type || 'Wine';
  const category = wine.category || 'Uncategorized';
  const description = wine.description || 'No description available.';
  const stockCount = wine.stockCount || 0;
  const isInStock = stockCount > 0 && !isComingSoon;
  const casePrice = price * 6;
  
  wineCaseDetailContainer.innerHTML = `
    <div class="wine-case-detail-card">
      <div class="wine-case-detail-image-container">
        <img src="${imageUrl}" 
             alt="${escapeHtml(wine.name)}" 
             class="wine-case-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
        ${isComingSoon ? `
          <div class="coming-soon-overlay-large">
            <span>COMING SOON</span>
          </div>
        ` : ''}
      </div>
      <div class="wine-case-detail-content">
        <div class="case-size-badge">
          <i class="fas fa-box"></i> Case of 6 Bottles
        </div>
        
        <h1 class="wine-case-detail-name" style="${isComingSoon ? 'color: #999;' : ''}">${escapeHtml(wine.name)} (Case of 6)</h1>
        <div class="wine-case-detail-type">${escapeHtml(type)} • Case</div>
        ${!isComingSoon ? `<div class="wine-case-detail-price">R${casePrice.toFixed(2)}</div>` : '<div class="wine-case-detail-price coming-soon-price">Coming Soon</div>'}
        ${!isComingSoon ? `<p class="wine-case-detail-subprice">(R${price.toFixed(2)} per bottle)</p>` : ''}
        
        <div class="wine-case-detail-meta">
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">Category</div>
            <div class="wine-case-meta-value">${escapeHtml(category)}</div>
          </div>
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">Type</div>
            <div class="wine-case-meta-value">${escapeHtml(type)}</div>
          </div>
          <div class="wine-case-meta-item">
            <div class="wine-case-meta-label">Package</div>
            <div class="wine-case-meta-value">Case of 6 bottles</div>
          </div>
        </div>
        
        ${!isComingSoon ? `
          <div class="stock-status ${isInStock ? 'stock-in' : 'stock-out'}">
            ${isInStock ? 'In Stock' : 'Out of Stock'}
          </div>
        ` : ''}
        
        <p class="wine-case-detail-description">
          ${isComingSoon ? 'Coming soon - check back later!' : escapeHtml(description)}
        </p>
        
        ${!isComingSoon && isInStock ? `
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
        
        <button class="add-to-cart-btn" onclick="addToCart()" ${(!isInStock || isComingSoon) ? 'disabled' : ''}>
          ${isComingSoon ? 'Coming Soon' : (isInStock ? 'Add Case to Cart' : 'Out of Stock')}
        </button>
      </div>
    </div>
  `;
}

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
  const minusBtn = document.querySelector('.quantity-btn:first-child');
  if (minusBtn) {
    minusBtn.disabled = quantity <= 1;
  }
}

function addToCart() {
  if (!currentWine) return;
  if (!cartUtils) {
    showToast('Cart system not available', 'error');
    return;
  }
  
  if (!currentWine.isActive) {
    showToast(`${currentWine.name} case is coming soon`, 'error');
    return;
  }
  
  if (currentWine.stockCount <= 0) {
    showToast(`${currentWine.name} case is out of stock`, 'error');
    return;
  }
  
  const cartItem = {
    id: currentWine.id,
    name: currentWine.name + ' (Case of 6)',
    price: currentWine.price,
    imageUrl: currentWine.imageUrl,
    type: 'wine',
    category: currentWine.category || '',
    description: 'Case of 6 bottles',
    quantity: quantity,
    isCase: true
  };
  
  if (window.CartUtils) {
    window.CartUtils.addWineCase(cartItem);
    showToast(`Added ${quantity} case${quantity === 1 ? '' : 's'} of ${currentWine.name} to cart`);
    quantity = 1;
    updateQuantityDisplay();
  } else {
    showToast('Cart system not available', 'error');
  }
}

function updateCartBadge() {
  if (cartUtils) {
    cartUtils.updateCartBadge();
  }
}

function showRelatedWineCases() {
  if (!allWines.length) return;
  
  let related = allWines.filter(wine => {
    if (currentWine && wine.id === currentWine.id) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      if (!(matchesName || matchesType)) return false;
    }
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
    related = related.slice(0, 6);
    relatedWineCasesGrid.innerHTML = related.map(wine => {
      const imageUrl = fixImageUrl(wine.imageUrl);
      const price = wine.price || 0;
      const type = wine.type || 'Wine';
      const category = wine.category || '';
      const casePrice = price * 6;
      const isComingSoon = !wine.isActive;
      
      return `
        <div class="wine-card ${isComingSoon ? 'coming-soon' : ''}" onclick="navigateToWineCaseDetail(${wine.id})">
          <div class="wine-image-container">
            <img src="${imageUrl}" 
                 alt="${escapeHtml(wine.name)}" 
                 class="wine-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
            ${isComingSoon ? `<div class="coming-soon-overlay"><span>COMING SOON</span></div>` : ''}
          </div>
          <div class="wine-label">
            <div class="wine-title">${escapeHtml(wine.name)}</div>
            <div class="wine-sub">${escapeHtml(type)} • Case</div>
            <div class="wine-sub">${escapeHtml(category)}</div>
            ${!isComingSoon ? `<div class="wine-sub">R${casePrice.toFixed(2)}</div>` : '<div class="coming-soon-badge">COMING SOON</div>'}
          </div>
        </div>
      `;
    }).join('');
  }
  
  relatedWineCasesSection.style.display = 'block';
}

function hideRelatedWineCases() {
  relatedWineCasesSection.style.display = 'none';
  searchInput.value = '';
  searchQuery = '';
  currentFilter = '';
  if (filterBtn) {
    filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
  }
}

function navigateToWineCaseDetail(wineId) {
  window.location.href = `wine_cases_detail.html?id=${wineId}`;
}

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
      <p>${escapeHtml(message)}</p>
      <button onclick="window.history.back()" class="btn-fill" style="margin-top: 20px;">
        Go Back
      </button>
    </div>
  `;
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i><span>${message}</span>`;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

window.incrementQuantity = incrementQuantity;
window.decrementQuantity = decrementQuantity;
window.addToCart = addToCart;
window.navigateToWineCaseDetail = navigateToWineCaseDetail;
window.hideRelatedWineCases = hideRelatedWineCases;