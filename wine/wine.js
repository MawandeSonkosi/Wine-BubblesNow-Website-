// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

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
}

// Extract wine types
function extractWineTypes(wines) {
  const types = new Set();
  wines.forEach(wine => {
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
  console.log('Wine types found:', wineTypes);
  
  filterDropdown.innerHTML = '';
  
  const allLink = document.createElement('a');
  allLink.href = '#';
  allLink.dataset.filter = '';
  allLink.textContent = 'All';
  allLink.addEventListener('click', (e) => {
    e.preventDefault();
    currentFilter = '';
    if (filterBtn) {
      filterBtn.innerHTML = '<i class="fas fa-filter"></i> Filter';
    }
    filterWines();
  });
  filterDropdown.appendChild(allLink);
  
  wineTypes.forEach(wineType => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = wineType;
    link.textContent = wineType;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = wineType;
      if (filterBtn) {
        filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${wineType}`;
      }
      filterWines();
    });
    filterDropdown.appendChild(link);
  });
}

// Fetch wines
async function fetchWines() {
  try {
    showLoading();
    
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
    console.log(`Received ${wines.length} wines`);
    
    allWines = wines;
    filteredWines = wines;
    
    if (wines.length === 0) {
      showEmptyState('No wines found');
    } else {
      populateFilterDropdown(wines);
      renderWines();
    }
    
  } catch (error) {
    console.error('Error:', error);
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

// Render wines - NO STOCK COUNT, NO CATEGORY
function renderWines() {
  console.log('Rendering wines...');
  
  if (filteredWines.length === 0) {
    showEmptyState('No wines match your criteria');
    return;
  }
  
  wineGrid.innerHTML = filteredWines.map(wine => {
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    
    // SIMPLIFIED TEMPLATE: Only Name, Type, Price - NO CATEGORY, NO STOCK
    // ADDED onclick TO NAVIGATE TO WINE DETAIL
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
          <div class="wine-sub">R${price.toFixed(2)}</div>
        </div>
      </div>
    `;
  }).join('');
  
  console.log('Render complete');
}

// Filter wines
function filterWines() {
  filteredWines = allWines.filter(wine => {
    if (currentFilter && wine.type !== currentFilter) {
      return false;
    }
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      if (searchLower === '') return true;
      
      const matchesName = (wine.name || '').toLowerCase().includes(searchLower);
      const matchesType = (wine.type || '').toLowerCase().includes(searchLower);
      const matchesCategory = (wine.category || '').toLowerCase().includes(searchLower);
      const matchesDescription = (wine.description || '').toLowerCase().includes(searchLower);
      
      return matchesName || matchesType || matchesCategory || matchesDescription;
    }
    
    return true;
  });
  
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