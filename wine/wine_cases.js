// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

// State
let allWines = [];
let filteredWines = [];
let currentFilter = '';
let searchQuery = '';

// List of wine types to exclude (like your Flutter code)
const excludedTypes = ['Whiskey', 'Cognac', 'Gin'];

// DOM Elements
const wineCasesGrid = document.getElementById('wineCasesGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Wine Cases page loaded');
  
  // Get URL parameters for filtering
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const typeParam = urlParams.get('type');
  const categoryParam = urlParams.get('category');
  
  if (searchParam) {
    searchQuery = searchParam.toLowerCase();
    if (searchInput) searchInput.value = searchParam;
  }
  
  if (typeParam) {
    currentFilter = typeParam;
    updateFilterButton();
  }
  
  if (categoryParam) {
    searchQuery = categoryParam.toLowerCase();
    if (searchInput) searchInput.value = categoryParam;
  }
  
  fetchWineCases();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterWineCases();
    });
  }
  
  // Filter button click
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterDropdown.style.display = filterDropdown.style.display === 'block' ? 'none' : 'block';
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (filterDropdown && !event.target.closest('.filter-dropdown')) {
      filterDropdown.style.display = 'none';
    }
  });
}

// Extract wine types for filter (excluding excluded types)
function extractWineTypes(wines) {
  const types = new Set(['All']);
  
  wines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '' && !excludedTypes.includes(wine.type)) {
      types.add(wine.type);
    }
  });
  
  return Array.from(types).sort();
}

// Populate filter dropdown
function populateFilterDropdown(wines) {
  if (!filterDropdown) return;
  
  const wineTypes = extractWineTypes(wines);
  console.log('Wine types found for cases:', wineTypes);
  
  filterDropdown.innerHTML = '';
  
  wineTypes.forEach(wineType => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = wineType === 'All' ? '' : wineType;
    link.textContent = wineType;
    
    // Highlight current filter
    if (wineType === (currentFilter || 'All')) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = wineType === 'All' ? '' : wineType;
      updateFilterButton();
      filterWineCases();
      filterDropdown.style.display = 'none';
    });
    filterDropdown.appendChild(link);
  });
}

// Update filter button
function updateFilterButton() {
  if (filterBtn) {
    filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${currentFilter || 'Filter'}`;
    if (currentFilter) {
      filterBtn.classList.add('has-filter');
    } else {
      filterBtn.classList.remove('has-filter');
    }
  }
}

// Fetch wine cases
async function fetchWineCases() {
  try {
    showLoading();
    
    console.log('🌐 Fetching wine cases from API...');
    
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
    
    const wines = await response.json();
    console.log(`📦 Received ${wines.length} wines total`);
    
    // Filter out excluded types for wine cases
    allWines = wines.filter(wine => !excludedTypes.includes(wine.type));
    console.log(`📦 Filtered to ${allWines.length} wine cases (excluding ${excludedTypes.join(', ')})`);
    
    if (allWines.length === 0) {
      showEmptyState('No wine cases found');
    } else {
      populateFilterDropdown(allWines);
      filterWineCases();
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine cases: ${error.message}`);
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

// Navigate to wine case detail
function navigateToWineCaseDetail(wineId) {
  console.log(`📱 Navigating to wine case detail: ${wineId}`);
  window.location.href = `wine_cases_detail.html?id=${wineId}`;
}

// Render wine cases
function renderWineCases() {
  console.log(`🎨 Rendering ${filteredWines.length} wine cases...`);
  
  if (filteredWines.length === 0) {
    showEmptyState('No wine cases match your criteria');
    return;
  }
  
  wineCasesGrid.innerHTML = filteredWines.map(wine => {
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const isOutOfStock = wine.stockCount <= 0;
    const casePrice = (price * 6).toFixed(2); // 6 bottles per case
    
    return `
      <div class="wine-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="navigateToWineCaseDetail(${wine.id})">
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
  
  console.log('✅ Wine cases render complete!');
}

// Filter wine cases
function filterWineCases() {
  console.log(`🔍 Filtering wine cases: filter="${currentFilter}", search="${searchQuery}"`);
  
  // Start with all wines (already filtered to exclude excluded types)
  filteredWines = [...allWines];
  
  // Filter by type
  if (currentFilter) {
    filteredWines = filteredWines.filter(wine => wine.type === currentFilter);
  }
  
  // Filter by search query
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase().trim();
    if (searchLower !== '') {
      filteredWines = filteredWines.filter(wine => {
        const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
        const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
        
        return matchesName || matchesType;
      });
    }
  }
  
  console.log(`📊 Filtered to ${filteredWines.length} wine cases`);
  renderWineCases();
}

// UI States
function showLoading() {
  if (!wineCasesGrid) return;
  wineCasesGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine cases...</p>
    </div>
  `;
}

function showError(message) {
  if (!wineCasesGrid) return;
  wineCasesGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="fetchWineCases()" class="btn-fill">
        Try Again
      </button>
    </div>
  `;
}

function showEmptyState(message) {
  if (!wineCasesGrid) return;
  wineCasesGrid.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-wine-bottle"></i>
      <h3>${message}</h3>
      <p>Try changing your search or filter</p>
      <button onclick="resetFilters()" class="btn-fill" style="margin-top: 20px;">
        Show All Wine Cases
      </button>
    </div>
  `;
}

// Reset filters
function resetFilters() {
  currentFilter = '';
  searchQuery = '';
  
  if (searchInput) searchInput.value = '';
  
  // Clear URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);
  
  updateFilterButton();
  filterWineCases();
}

// Make functions available globally
window.fetchWineCases = fetchWineCases;
window.resetFilters = resetFilters;
window.navigateToWineCaseDetail = navigateToWineCaseDetail;