// Configuration - USE PROXY SERVER (works on app.wineandbubblesnow.co.za)
const API_BASE_URL = '/api';  // This works on both localhost and app.wineandbubblesnow.co.za

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

// Available category types (these should match your homepage icons) - ALL TYPES INCLUDED
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
  console.log('🔧 Using API URL:', API_BASE_URL);
  
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
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (event) => {
    if (filterDropdown && !event.target.closest('.filter-dropdown')) {
      filterDropdown.style.display = 'none';
    }
  });
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
    
    // Use the admin/all endpoint to get ALL wines (including inactive for Coming Soon)
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
    
    if (!response.ok) {
      // Fallback to regular endpoint
      const fallbackUrl = `${API_BASE_URL}/wines?all=true&_=${Date.now()}`;
      console.log('📡 Trying fallback endpoint:', fallbackUrl);
      const fallbackResponse = await fetch(fallbackUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      processWinesData(fallbackData);
      return;
    }
    
    const data = await response.json();
    processWinesData(data);
    
  } catch (error) {
    console.error('❌ Error:', error);
    showError(`Failed to load wines: ${error.message}`);
  }
}

function processWinesData(data) {
  console.log('📦 API Response:', data);
  
  // Handle different response formats
  let wines = [];
  if (data.success && Array.isArray(data.data)) {
    wines = data.data;
  } else if (Array.isArray(data)) {
    wines = data;
  } else if (data.wines && Array.isArray(data.wines)) {
    wines = data.wines;
  } else if (data.data && Array.isArray(data.data)) {
    wines = data.data;
  } else {
    wines = [];
  }
  
  console.log(`✅ Success! Received ${wines.length} wines total`);
  
  // Log each wine's active status
  wines.forEach(wine => {
    console.log(`   - ${wine.name}: isActive = ${wine.isActive}`);
  });
  
  allWines = wines;
  
  // Filter by category type if specified
  if (currentCategoryType) {
    // Filter wines by type OR category matching the category type
    filteredWines = wines.filter(wine => {
      // Check both type and category for matching (case insensitive)
      const matchesType = wine.type && 
                         wine.type.toLowerCase() === currentCategoryType.toLowerCase();
      const matchesCategory = wine.category && 
                             wine.category.toLowerCase() === currentCategoryType.toLowerCase();
      
      return matchesType || matchesCategory;
    });
    
    console.log(`📊 Filtered to ${filteredWines.length} wines for category type "${currentCategoryType}"`);
  } else {
    // No category type specified, show all wines (including all types)
    filteredWines = wines;
    console.log(`📊 Showing all ${filteredWines.length} wines`);
  }
  
  if (filteredWines.length === 0) {
    showEmptyState(`No ${currentCategoryType || 'wines'} found`);
  } else {
    populateFilterDropdown();
    renderWines();
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

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render wines with Coming Soon support
function renderWines() {
  console.log(`🎨 Rendering ${filteredWines.length} wines...`);
  
  if (filteredWines.length === 0) {
    showEmptyState(`No ${currentCategoryType || 'wines'} found matching "${searchQuery}"`);
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
    showEmptyState(`No ${currentCategoryType || 'wines'} found matching "${searchQuery}"`);
    return;
  }
  
  wineGrid.innerHTML = winesToShow.map(wine => {
    const isComingSoon = !wine.isActive;
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const category = wine.category || '';
    const isInStock = (wine.stockCount || 0) > 0;
    const comingSoonClass = isComingSoon ? 'coming-soon' : '';
    
    return `
      <div class="wine-card ${!isInStock && !isComingSoon ? 'out-of-stock' : ''} ${comingSoonClass}" onclick="navigateToWineDetail(${wine.id})">
        <div class="wine-image-container">
          <img src="${imageUrl}" 
               alt="${escapeHtml(wine.name)}" 
               class="wine-image"
               loading="lazy"
               onerror="this.onerror=null; this.src='../assets/wines/breakfast/Noir.png';">
          ${isComingSoon ? `
            <div class="coming-soon-overlay">
              <span>COMING SOON</span>
            </div>
          ` : ''}
          ${!isComingSoon && !isInStock ? `
            <div class="out-of-stock-overlay">
              <span>OUT OF STOCK</span>
            </div>
          ` : ''}
        </div>
        <div class="wine-label">
          <div class="wine-title">${escapeHtml(wine.name)}</div>
          <div class="wine-sub">${escapeHtml(type)}</div>
          <div class="wine-sub">${escapeHtml(category)}</div>
          ${!isComingSoon ? `<div class="wine-price">R${price.toFixed(2)}</div>` : '<div class="wine-price coming-soon-price">Coming Soon</div>'}
          ${isComingSoon ? '<div class="coming-soon-badge">COMING SOON</div>' : ''}
          ${!isComingSoon && !isInStock ? '<div class="out-of-stock-badge">OUT OF STOCK</div>' : ''}
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
      <p>${escapeHtml(message)}</p>
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
      <h3>${escapeHtml(message)}</h3>
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