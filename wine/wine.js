// Configuration - USE RELATIVE URL FOR CLOUDFLARE
const API_BASE_URL = '/api'; // This works on both localhost and app.wineandbubblesnow.co.za

// State
let allWines = [];
let filteredWines = [];
let currentFilter = '';
let searchQuery = '';

// DOM Elements
const wineGrid = document.getElementById('wineGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍷 Wine page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  fetchWines();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterWines();
    });
  }
  
  // Close filter dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!filterBtn?.contains(e.target) && !filterDropdown?.contains(e.target)) {
      if (filterDropdown) {
        filterDropdown.classList.remove('show');
      }
    }
  });
  
  // Toggle filter dropdown on button click
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filterDropdown) {
        filterDropdown.classList.toggle('show');
      }
    });
  }
}

// Extract wine types - REMOVED "White Wine" completely
function extractWineTypes(wines) {
  const defaultTypes = [
    'All',
    'Red Wine',
    'Champagne',
    'Whiskey',
    'Gin',
    'Cognac'
  ];
  
  const uniqueTypes = new Set();
  wines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '') {
      // Only add if it's not "White Wine"
      if (wine.type !== 'White Wine') {
        uniqueTypes.add(wine.type);
      }
    }
  });
  
  const allTypes = [...new Set([...defaultTypes.filter(t => t !== 'All'), ...uniqueTypes])].sort();
  return ['All', ...allTypes];
}

// Check if item is a wine (not a banner or advert)
function isWine(item) {
  // Check if it has a valid wine type
  const validWineTypes = ['Red Wine', 'White Wine', 'Champagne', 'Sparkling', 'Rosé', 'Rose', 'Dessert Wine'];
  
  // Check if it has a price (adverts might have price but different structure)
  const hasPrice = item.price && item.price > 0;
  
  // Check if it has a valid wine type
  const hasValidType = item.type && validWineTypes.some(type => 
    item.type.toLowerCase().includes(type.toLowerCase())
  );
  
  // Check if it has a wine-like name (not "Special Offer", "Advertisement", etc.)
  const hasWineName = item.name && 
                     !item.name.toLowerCase().includes('special') &&
                     !item.name.toLowerCase().includes('offer') &&
                     !item.name.toLowerCase().includes('advert');
  
  // Check if it has a description that suggests it's a wine
  const hasWineDescription = item.description && 
                            (item.description.toLowerCase().includes('wine') ||
                             item.description.toLowerCase().includes('vintage') ||
                             item.description.toLowerCase().includes('bottle'));
  
  // Return true if it meets wine criteria
  return hasPrice && (hasValidType || hasWineName || hasWineDescription);
}

// Populate filter dropdown
function populateFilterDropdown(wines) {
  if (!filterDropdown) return;
  
  const wineTypes = extractWineTypes(wines);
  console.log('🍷 Wine types found:', wineTypes);
  
  filterDropdown.innerHTML = '';
  
  wineTypes.forEach(wineType => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = wineType === 'All' ? '' : wineType;
    link.textContent = wineType;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = wineType === 'All' ? '' : wineType;
      if (filterBtn) {
        filterBtn.innerHTML = wineType === 'All' 
          ? '<i class="fas fa-filter"></i> Filter'
          : `<i class="fas fa-filter"></i> ${wineType}`;
      }
      filterWines();
      
      // Show toast notification
      if (wineType !== 'All') {
        showToast(`Filtering by: ${wineType}`, 'info');
      }
      
      // Close dropdown
      filterDropdown.classList.remove('show');
    });
    filterDropdown.appendChild(link);
  });
}

// Fetch wines - USING PROXY SERVER (NO CORS PROXY)
async function fetchWines() {
  try {
    showLoading();
    
    // Use relative URL through your proxy server - NO CORS PROXY
    const apiUrl = `${API_BASE_URL}/wines?all=true&_=${Date.now()}`;
    console.log('🌐 Fetching wines from:', apiUrl);
    
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
    
    const items = await response.json();
    console.log(`✅ Received ${items.length} items from API`);
    
    // Filter out non-wine items (banners, adverts, etc.)
    const wines = items.filter(item => isWine(item));
    
    console.log(`🍷 Filtered to ${wines.length} actual wines`);
    
    // Log what was filtered out for debugging
    const filteredOut = items.length - wines.length;
    if (filteredOut > 0) {
      console.log(`🚫 Filtered out ${filteredOut} non-wine items`);
    }
    
    allWines = wines;
    filteredWines = wines;
    
    if (wines.length === 0) {
      showEmptyState('No wines found');
    } else {
      populateFilterDropdown(wines);
      renderWines();
    }
    
  } catch (error) {
    console.error('❌ Error fetching wines:', error);
    showError(`Failed to load wines: ${error.message}`);
  }
}

// Fix image URLs
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

// Render wines
function renderWines() {
  console.log('🎨 Rendering wines...');
  
  if (filteredWines.length === 0) {
    showEmptyState('No wines match your criteria');
    return;
  }
  
  wineGrid.innerHTML = filteredWines.map(wine => {
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const isInStock = (wine.stockCount || 0) > 0;
    
    return `
      <div class="wine-card ${!isInStock ? 'out-of-stock' : ''}" onclick="navigateToWineDetail(${wine.id})">
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
          ${wine.description ? `<div class="wine-description">${wine.description.substring(0, 100)}${wine.description.length > 100 ? '...' : ''}</div>` : ''}
          <div class="wine-price">R${price.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Render complete');
}

// Filter wines based on search and filter
function filterWines() {
  filteredWines = allWines.filter(wine => {
    // Apply type filter
    if (currentFilter && wine.type !== currentFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      if (searchLower === '') return true;
      
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
      
      return matchesName || matchesType || matchesDescription;
    }
    
    return true;
  });
  
  renderWines();
  
  // Update results count if element exists
  const resultsCount = document.querySelector('.results-count');
  if (resultsCount) {
    resultsCount.textContent = `Showing ${filteredWines.length} of ${allWines.length} wines`;
  }
}

// Show toast notification (like Flutter's SnackBar)
function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast-notification ${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'info' ? 'fa-info-circle' : 'fa-check-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Navigate to wine detail page
function navigateToWineDetail(wineId) {
  console.log(`📱 Navigating to wine detail: ${wineId}`);
  window.location.href = `wine_detail.html?id=${wineId}`;
}

// UI States
function showLoading() {
  wineGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wines...</p>
    </div>
  `;
}

function showError(message) {
  wineGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="fetchWines()" class="btn-fill">
        Try Again
      </button>
    </div>
  `;
}

function showEmptyState(message) {
  const allTypes = [...new Set(allWines.map(w => w.type).filter(Boolean))];
  
  wineGrid.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-wine-bottle"></i>
      <h3>${message}</h3>
      <p>Try changing your search or filter</p>
      <div class="available-types">
        <p>Available types: ${allTypes.join(', ')}</p>
      </div>
      <button onclick="resetFilters()" class="btn-fill" style="margin-top: 20px;">
        Show All Wines
      </button>
    </div>
  `;
}

// Reset all filters
function resetFilters() {
  currentFilter = '';
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  if (filterBtn) filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
  filteredWines = allWines;
  renderWines();
}

// Make functions available globally
window.fetchWines = fetchWines;
window.resetFilters = resetFilters;
window.navigateToWineDetail = navigateToWineDetail;