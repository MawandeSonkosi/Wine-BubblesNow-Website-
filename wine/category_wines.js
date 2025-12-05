// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

// State
let allWines = [];
let filteredWines = [];
let currentCategoryType = '';
let searchQuery = '';

// DOM Elements
const wineGrid = document.getElementById('wineGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// Available category types (these should match your homepage icons)
const categoryTypes = [
  'Red Wine',
  'White Wine',
  'Champagne',
  'Whiskey',
  'Gin',
  'Cognac'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍷 Category Wines page loaded');
  
  // Get category type from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentCategoryType = urlParams.get('type') || '';
  
  if (currentCategoryType) {
    pageTitle.textContent = currentCategoryType;
    pageSubtitle.textContent = `Browse our curated collection of ${currentCategoryType.toLowerCase()}`;
    
    // Update filter button text to show current category
    if (filterBtn) {
      filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${currentCategoryType}`;
      filterBtn.classList.add('has-filter');
    }
    
    console.log(`🎯 Filtering by category type: ${currentCategoryType}`);
  }
  
  fetchWines();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Search input
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterWines();
    });
  }
}

// Populate filter dropdown with category types
function populateFilterDropdown() {
  if (!filterDropdown) return;
  
  console.log('📊 Populating filter dropdown with category types:', categoryTypes);
  
  // Clear existing content
  filterDropdown.innerHTML = '';
  
  // Add each category type
  categoryTypes.forEach(categoryType => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.category = categoryType;
    link.textContent = categoryType;
    
    // Highlight current category type
    if (categoryType === currentCategoryType) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (categoryType !== currentCategoryType) {
        // Navigate to category_wines.html with new category type
        window.location.href = `category_wines.html?type=${encodeURIComponent(categoryType)}`;
      }
    });
    filterDropdown.appendChild(link);
  });
  
  // Show dropdown on hover
  filterBtn.parentElement.addEventListener('mouseenter', () => {
    filterDropdown.style.display = 'block';
  });
  
  filterBtn.parentElement.addEventListener('mouseleave', () => {
    setTimeout(() => {
      filterDropdown.style.display = 'none';
    }, 300);
  });
}

// Fetch wines
async function fetchWines() {
  try {
    showLoading();
    
    console.log('🌐 Fetching wines from API...');
    
    // Use CORS proxy
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
    console.log(`✅ Success! Received ${wines.length} wines`);
    
    allWines = wines;
    
    // Filter by category type if specified
    if (currentCategoryType) {
      // Filter wines by type OR category matching the category type
      filteredWines = wines.filter(wine => {
        // Exclude wine cases
        if (wine.isCase) return false;
        
        // Check both type and category for matching
        const matchesType = wine.type && 
                           wine.type.toLowerCase() === currentCategoryType.toLowerCase();
        const matchesCategory = wine.category && 
                               wine.category.toLowerCase() === currentCategoryType.toLowerCase();
        
        return matchesType || matchesCategory;
      });
      
      console.log(`📊 Filtered to ${filteredWines.length} wines for category type "${currentCategoryType}"`);
    } else {
      // No category type specified, show all non-case wines
      filteredWines = wines.filter(wine => !wine.isCase);
    }
    
    if (filteredWines.length === 0) {
      showEmptyState(`No ${currentCategoryType} found`);
    } else {
      populateFilterDropdown();
      renderWines();
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wines: ${error.message}`);
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

// Render wines
function renderWines() {
  console.log(`🎨 Rendering ${filteredWines.length} wines...`);
  
  if (filteredWines.length === 0) {
    showEmptyState(`No ${currentCategoryType} found matching "${searchQuery}"`);
    return;
  }
  
  // Filter by search query if applicable
  let winesToShow = filteredWines;
  if (searchQuery) {
    winesToShow = filteredWines.filter(wine => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (searchLower === '') return true;
      
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      const matchesCategory = (wine.category || '').toLowerCase().includes(searchLower);
      const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
      
      return matchesName || matchesType || matchesCategory || matchesDescription;
    });
  }
  
  if (winesToShow.length === 0) {
    showEmptyState(`No ${currentCategoryType} found matching "${searchQuery}"`);
    return;
  }
  
  wineGrid.innerHTML = winesToShow.map(wine => {
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const category = wine.category || '';
    
    // Same card layout as all_wines.html
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
  
  console.log('✅ Render complete!');
}

// Filter wines (only for search, not for type filtering)
function filterWines() {
  console.log(`🔍 Filtering: search="${searchQuery}"`);
  renderWines();
}

// Navigate to wine detail page
function navigateToWineDetail(wineId) {
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
  wineGrid.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-wine-bottle"></i>
      <h3>${message}</h3>
      <p>Try changing your search or filter</p>
      <button onclick="resetSearch()" class="btn-fill" style="margin-top: 20px;">
        Clear Search
      </button>
    </div>
  `;
}

// Reset search
function resetSearch() {
  searchQuery = '';
  if (searchInput) searchInput.value = '';
  renderWines();
}

// Make functions available globally
window.fetchWines = fetchWines;
window.resetSearch = resetSearch;
window.navigateToWineDetail = navigateToWineDetail;

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  if (filterDropdown && !event.target.closest('.filter-dropdown')) {
    filterDropdown.style.display = 'none';
  }
});