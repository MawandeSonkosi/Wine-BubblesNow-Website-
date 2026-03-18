// Configuration - EXACTLY like Flutter app
const API_BASE_URL = '/api'; // Use relative URL through proxy

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
        filterDropdown.style.display = 'none';
      }
    }
  });
  
  // Toggle filter dropdown on button click
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (filterDropdown) {
        const isVisible = filterDropdown.style.display === 'block';
        filterDropdown.style.display = isVisible ? 'none' : 'block';
      }
    });
  }
}

// Extract wine types - EXACTLY like Flutter's filterTypes list
function extractWineTypes(wines) {
  // Match Flutter's filterTypes list
  const defaultTypes = [
    'All',
    'White Wine',
    'Red Wine',
    'Champagne',
    'Whiskey',
    'Gin',
    'Cognac'
  ];
  
  // Get unique types from wines
  const uniqueTypes = new Set();
  wines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '') {
      uniqueTypes.add(wine.type);
    }
  });
  
  // Combine with default types and sort
  const allTypes = [...new Set([...defaultTypes.filter(t => t !== 'All'), ...uniqueTypes])].sort();
  return ['All', ...allTypes];
}

// Populate filter dropdown - MATCHES FLUTTER'S FILTER MENU
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
      
      // Show snackbar-like notification (matching Flutter)
      if (wineType !== 'All') {
        showToast(`Filtering by: ${wineType}`, 'info');
      }
      
      // Close dropdown
      filterDropdown.style.display = 'none';
    });
    filterDropdown.appendChild(link);
  });
}

// Fetch wines - EXACTLY like Flutter's getWines()
async function fetchWines() {
  try {
    showLoading();
    
    // Use EXACT same endpoint as Flutter: /api/wines?all=true
    const apiUrl = `${API_BASE_URL}/wines?all=true&_=${Date.now()}`; // Cache busting
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
      throw new Error(`Failed to fetch wines: ${response.status}`);
    }
    
    const wines = await response.json();
    console.log(`✅ Received ${wines.length} wines`);
    
    // Log wine details like Flutter does
    console.log('📊 ALL WINES LOADED:', wines.length);
    for (var i = 0; i < wines.length && i < 5; i++) {
      console.log(`  - ${wines[i].name}: isCase=${wines[i].isCase || false}, type=${wines[i].type}`);
    }
    
    // Print all wine types like Flutter
    const allTypes = [...new Set(wines.map(w => w.type).filter(Boolean))];
    console.log('📋 Available wine types:', allTypes);
    
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

// Fix image URLs - MATCHES FLUTTER'S _buildWineImage
function fixImageUrl(imageUrl) {
  if (!imageUrl) {
    return '../assets/wines/breakfast/Noir.png';
  }
  
  // Flutter uses startsWith('assets/') check
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  if (imageUrl.startsWith('../assets/') || imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return '../assets/' + imageUrl;
}

// Render wines - MATCHING FLUTTER'S _buildWineCard layout
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
    
    // MATCH FLUTTER'S LAYOUT:
    // - Image at top
    // - Name and type
    // - Description (truncated)
    // - Price and stock badge
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
          <div class="wine-description">${wine.description || ''}</div>
          <div class="wine-price-row">
            <span class="wine-price">R${price.toFixed(2)}</span>
            ${!isInStock ? '<span class="out-of-stock-badge">Out of Stock</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Render complete');
}

// Filter wines - MATCHES FLUTTER'S SEARCH LOGIC
function filterWines() {
  filteredWines = allWines.filter(wine => {
    // Apply type filter
    if (currentFilter && wine.type !== currentFilter) {
      return false;
    }
    
    // Apply search filter (matches Flutter's search logic)
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
}

// Show toast notification (matching Flutter's SnackBar)
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
        <p style="font-size: 12px; color: #999; margin-top: 10px;">
          Available types: ${allTypes.join(', ')}
        </p>
      </div>
      <button onclick="resetFilters()" class="btn-fill" style="margin-top: 20px;">
        Show All Wines
      </button>
    </div>
  `;
}

// Reset filters
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