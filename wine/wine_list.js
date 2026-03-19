// Configuration - USE PROXY SERVER
const API_BASE_URL = '/api';  // Works on both localhost and app.wineandbubblesnow.co.za

// State
let allWines = [];
let filteredWines = [];
let currentCategory = '';
let searchQuery = '';

// List of wine types to EXCLUDE from wine list
const excludedTypes = ['Whiskey', 'Cognac', 'Gin'];

// DOM Elements
const wineGrid = document.getElementById('wineGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

// Available categories (matching your Flutter app)
const availableCategories = [
  'Breakfast Wines',
  'Lunch Wines',
  'Dinner Wines',
  'Gifting Wines',
  'Event Wines'
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍷 Wine List page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  
  // Get category from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentCategory = urlParams.get('category') || '';
  
  if (currentCategory) {
    pageTitle.textContent = currentCategory;
    pageSubtitle.textContent = `Browse our curated collection of ${currentCategory.toLowerCase()}`;
    
    // Update filter button text to show current category
    if (filterBtn) {
      filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${currentCategory}`;
      filterBtn.classList.add('has-filter');
    }
    
    console.log(`🎯 Filtering by category: ${currentCategory}`);
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

// Populate filter dropdown with categories
function populateFilterDropdown() {
  if (!filterDropdown) return;
  
  console.log('📊 Populating filter dropdown with categories:', availableCategories);
  
  // Clear existing content
  filterDropdown.innerHTML = '';
  
  // Add each category
  availableCategories.forEach(category => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.category = category;
    link.textContent = category;
    
    // Highlight current category
    if (category === currentCategory) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (category !== currentCategory) {
        // Navigate to wine_list.html with new category
        window.location.href = `wine_list.html?category=${encodeURIComponent(category)}`;
      }
    });
    filterDropdown.appendChild(link);
  });
  
  // Show dropdown on hover
  if (filterBtn) {
    const dropdownContainer = filterBtn.parentElement;
    dropdownContainer.addEventListener('mouseenter', () => {
      filterDropdown.style.display = 'block';
    });
    
    dropdownContainer.addEventListener('mouseleave', () => {
      setTimeout(() => {
        filterDropdown.style.display = 'none';
      }, 300);
    });
  }
}

// Fetch wines - USING PROXY SERVER
async function fetchWines() {
  try {
    showLoading();
    
    console.log('🌐 Fetching wines from API...');
    
    // Use your proxy server directly - NO CORS PROXY NEEDED
    const apiUrl = `${API_BASE_URL}/wines?all=true&_=${Date.now()}`;
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const wines = await response.json();
    console.log(`✅ Success! Received ${wines.length} wines total`);
    
    // Filter out excluded types (Whiskey, Cognac, Gin)
    const filteredWinesByType = wines.filter(wine => !excludedTypes.includes(wine.type));
    console.log(`🍷 After excluding ${excludedTypes.join(', ')}: ${filteredWinesByType.length} wines remain`);
    
    allWines = filteredWinesByType;
    
    // Filter by category if specified
    if (currentCategory) {
      // Handle special cases (like in Flutter)
      switch(currentCategory.toLowerCase()) {
        case 'gifting wines':
          filteredWines = filteredWinesByType.filter(wine => wine.isGifting === true);
          console.log(`🎁 Filtered to ${filteredWines.length} gifting wines`);
          break;
        case 'event wines':
          filteredWines = filteredWinesByType.filter(wine => wine.isEvent === true);
          console.log(`🎪 Filtered to ${filteredWines.length} event wines`);
          break;
        default:
          // Filter by category
          filteredWines = filteredWinesByType.filter(wine => 
            wine.category && wine.category.toLowerCase() === currentCategory.toLowerCase()
          );
          console.log(`📊 Filtered to ${filteredWines.length} wines in category "${currentCategory}"`);
      }
    } else {
      // No category specified, show all (excluding Whiskey, Cognac, Gin)
      filteredWines = filteredWinesByType;
    }
    
    if (filteredWines.length === 0) {
      showEmptyState(`No wines found in ${currentCategory || 'this category'}`);
    } else {
      populateFilterDropdown();
      renderWines();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
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

// Render wines - USING SAME CARD LAYOUT AS all_wines.html
function renderWines() {
  console.log(`🎨 Rendering ${filteredWines.length} wines...`);
  
  if (filteredWines.length === 0) {
    showEmptyState(`No wines found matching "${searchQuery}" in ${currentCategory}`);
    return;
  }
  
  // Filter by search query if applicable
  let winesToShow = filteredWines;
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase().trim();
    if (searchLower !== '') {
      winesToShow = filteredWines.filter(wine => {
        const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
        const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
        const matchesCategory = (wine.category || '').toLowerCase().includes(searchLower);
        const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
        
        return matchesName || matchesType || matchesCategory || matchesDescription;
      });
    }
  }
  
  if (winesToShow.length === 0) {
    showEmptyState(`No wines found matching "${searchQuery}" in ${currentCategory || 'this category'}`);
    return;
  }
  
  wineGrid.innerHTML = winesToShow.map(wine => {
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const category = wine.category || '';
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
          <div class="wine-sub">${category}</div>
          <div class="wine-price">R${price.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Render complete!');
}

// Filter wines
function filterWines() {
  console.log(`🔍 Filtering: search="${searchQuery}"`);
  renderWines();
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