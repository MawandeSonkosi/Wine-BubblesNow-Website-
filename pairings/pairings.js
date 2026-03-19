// Configuration - USE PROXY SERVER
const API_BASE_URL = '/api';  // This works on both localhost and app.wineandbubblesnow.co.za

// State
let allPairings = [];
let filteredPairings = [];
let currentFilter = '';
let searchQuery = '';

// DOM Elements
const pairingsGrid = document.getElementById('pairingsGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🥂 Pairings page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  fetchPairings();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterPairings();
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
}

// Extract pairing categories
function extractPairingCategories(pairings) {
  const categories = new Set(['All']);
  pairings.forEach(pairing => {
    if (pairing.category && pairing.category.trim() !== '') {
      categories.add(pairing.category);
    }
  });
  return Array.from(categories).sort();
}

// Populate filter dropdown
function populateFilterDropdown(pairings) {
  if (!filterDropdown) return;
  
  const pairingCategories = extractPairingCategories(pairings);
  console.log('Pairing categories found:', pairingCategories);
  
  filterDropdown.innerHTML = '';
  
  pairingCategories.forEach(category => {
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = category === 'All' ? '' : category;
    link.textContent = category;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = category === 'All' ? '' : category;
      if (filterBtn) {
        filterBtn.innerHTML = `<i class="fas fa-filter"></i> ${category === 'All' ? 'Filter' : category}`;
      }
      filterPairings();
      filterDropdown.classList.remove('show');
    });
    filterDropdown.appendChild(link);
  });
}

// Fetch pairings from backend - USING PROXY SERVER
async function fetchPairings() {
  try {
    showLoading();
    
    console.log('🌐 Fetching pairings from API...');
    
    // Use your proxy server - NO CORS PROXY NEEDED
    const apiUrl = `${API_BASE_URL}/addons?all=true&_=${Date.now()}`;
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
    
    const pairings = await response.json();
    console.log(`✅ Success! Received ${pairings.length} pairings`);
    
    allPairings = pairings;
    filteredPairings = pairings;
    
    if (pairings.length === 0) {
      showEmptyState('No pairings found');
    } else {
      populateFilterDropdown(pairings);
      renderPairings();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    showError(`Failed to load pairings: ${error.message}`);
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

// Render pairings
function renderPairings() {
  console.log(`🎨 Rendering ${filteredPairings.length} pairings...`);
  
  if (filteredPairings.length === 0) {
    showEmptyState('No pairings match your criteria');
    return;
  }
  
  pairingsGrid.innerHTML = filteredPairings.map(pairing => {
    const imageUrl = fixImageUrl(pairing.imageUrl);
    const price = pairing.price || 0;
    const category = pairing.category || 'Add-On';
    
    return `
      <div class="wine-card" onclick="navigateToPairingDetail(${pairing.id})">
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
  
  console.log('✅ Render complete!');
}

// Navigate to pairing detail page
function navigateToPairingDetail(pairingId) {
  console.log(`📱 Navigating to pairing detail: ${pairingId}`);
  window.location.href = `pairings_detail.html?id=${pairingId}`;
}

// Filter pairings
function filterPairings() {
  filteredPairings = allPairings.filter(pairing => {
    if (currentFilter && pairing.category !== currentFilter) {
      return false;
    }
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase().trim();
      if (searchLower === '') return true;
      
      const matchesName = (pairing.name || '').toLowerCase().includes(searchLower);
      const matchesCategory = (pairing.category || '').toLowerCase().includes(searchLower);
      const matchesDescription = (pairing.description || '').toLowerCase().includes(searchLower);
      
      return matchesName || matchesCategory || matchesDescription;
    }
    
    return true;
  });
  
  renderPairings();
}

// UI States
function showLoading() {
  pairingsGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading pairings...</p>
    </div>
  `;
}

function showError(message) {
  pairingsGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
      <button onclick="fetchPairings()" class="btn-fill">
        Try Again
      </button>
    </div>
  `;
}

function showEmptyState(message) {
  pairingsGrid.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-wine-bottle"></i>
      <h3>${message}</h3>
      <p>Try changing your search or filter</p>
      <button onclick="resetFilters()" class="btn-fill" style="margin-top: 20px;">
        Show All Pairings
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
  filteredPairings = allPairings;
  renderPairings();
}

// Make functions available globally
window.fetchPairings = fetchPairings;
window.resetFilters = resetFilters;
window.navigateToPairingDetail = navigateToPairingDetail;