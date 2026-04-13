// Configuration - USE RELATIVE URL FOR CLOUDFLARE
const API_BASE_URL = '/api'; // This works on both localhost and app.wineandbubblesnow.co.za

// State
let allWines = [];
let filteredWines = [];
let currentFilter = '';
let searchQuery = '';

// List of wine types to include for wine cases
const allowedTypes = ['Red Wine', 'White Wine', 'Champagne'];

// DOM Elements
const wineCasesGrid = document.getElementById('wineCasesGrid');
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterDropdown = document.getElementById('filterDropdown');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('📦 Wine Cases page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const typeParam = urlParams.get('type');
  
  if (searchParam) {
    searchQuery = searchParam.toLowerCase();
    if (searchInput) searchInput.value = searchParam;
  }
  
  if (typeParam) {
    currentFilter = typeParam;
    updateFilterButton();
  }
  
  fetchWineCases();
  setupEventListeners();
});

function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterWineCases();
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
}

function extractWineTypes(wines) {
  const types = new Set(['All']);
  
  wines.forEach(wine => {
    if (wine.type && wine.type.trim() !== '' && allowedTypes.includes(wine.type)) {
      types.add(wine.type);
    }
  });
  
  return Array.from(types).sort();
}

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
    
    if (wineType === (currentFilter || 'All')) {
      link.classList.add('active-category');
    }
    
    link.addEventListener('click', (e) => {
      e.preventDefault();
      currentFilter = wineType === 'All' ? '' : wineType;
      updateFilterButton();
      filterWineCases();
      filterDropdown.classList.remove('show');
    });
    filterDropdown.appendChild(link);
  });
}

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

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Fetch wine cases
async function fetchWineCases() {
  try {
    showLoading();
    
    console.log('🌐 Fetching wine cases from API...');
    
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
        throw new Error(`HTTP ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      processWinesData(fallbackData);
      return;
    }
    
    const data = await response.json();
    processWinesData(data);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine cases: ${error.message}`);
  }
}

function processWinesData(data) {
  console.log('📦 API Response:', data);
  
  let wines = [];
  if (data.success && Array.isArray(data.data)) {
    wines = data.data;
  } else if (Array.isArray(data)) {
    wines = data;
  } else {
    wines = [];
  }
  
  console.log(`📦 Received ${wines.length} wines total`);
  
  // Log each wine's active status
  wines.forEach(wine => {
    if (allowedTypes.includes(wine.type)) {
      console.log(`   - ${wine.name}: isActive = ${wine.isActive}`);
    }
  });
  
  // Filter to only include allowed types for wine cases
  allWines = wines.filter(wine => allowedTypes.includes(wine.type));
  console.log(`📦 Filtered to ${allWines.length} wine cases (${allowedTypes.join(', ')})`);
  
  if (allWines.length === 0) {
    showEmptyState('No wine cases found');
  } else {
    populateFilterDropdown(allWines);
    filterWineCases();
  }
}

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

function navigateToWineCaseDetail(wineId) {
  console.log(`📱 Navigating to wine case detail: ${wineId}`);
  window.location.href = `wine_cases_detail.html?id=${wineId}`;
}

// Render wine cases with Coming Soon support
function renderWineCases() {
  console.log(`🎨 Rendering ${filteredWines.length} wine cases...`);
  
  if (filteredWines.length === 0) {
    showEmptyState('No wine cases match your criteria');
    return;
  }
  
  wineCasesGrid.innerHTML = filteredWines.map(wine => {
    const isComingSoon = !wine.isActive;
    const imageUrl = fixImageUrl(wine.imageUrl);
    const price = wine.price || 0;
    const type = wine.type || 'Wine';
    const isOutOfStock = (wine.stockCount || 0) <= 0;
    const casePrice = (price * 6).toFixed(2);
    const comingSoonClass = isComingSoon ? 'coming-soon' : '';
    
    return `
      <div class="wine-card ${!isComingSoon && isOutOfStock ? 'out-of-stock' : ''} ${comingSoonClass}" onclick="navigateToWineCaseDetail(${wine.id})">
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
          ${!isComingSoon && isOutOfStock ? `
            <div class="out-of-stock-overlay">
              <span>OUT OF STOCK</span>
            </div>
          ` : ''}
        </div>
        <div class="wine-label">
          <div class="wine-title">${escapeHtml(wine.name)}</div>
          <div class="wine-sub">Wine Case • ${escapeHtml(type)}</div>
          ${!isComingSoon ? `<div class="wine-price">R${casePrice}</div>` : '<div class="wine-price coming-soon-price">Coming Soon</div>'}
          ${isComingSoon ? '<div class="coming-soon-badge">COMING SOON</div>' : ''}
          ${!isComingSoon && isOutOfStock ? '<div class="out-of-stock-badge">OUT OF STOCK</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Wine cases render complete!');
}

function filterWineCases() {
  console.log(`🔍 Filtering wine cases: filter="${currentFilter}", search="${searchQuery}"`);
  
  filteredWines = [...allWines];
  
  if (currentFilter) {
    filteredWines = filteredWines.filter(wine => wine.type === currentFilter);
  }
  
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
      <p>${escapeHtml(message)}</p>
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
      <h3>${escapeHtml(message)}</h3>
      <p>Try changing your search or filter</p>
      <button onclick="resetFilters()" class="btn-fill" style="margin-top: 20px;">
        Show All Wine Cases
      </button>
    </div>
  `;
}

function resetFilters() {
  currentFilter = '';
  searchQuery = '';
  
  if (searchInput) searchInput.value = '';
  
  window.history.replaceState({}, document.title, window.location.pathname);
  
  updateFilterButton();
  filterWineCases();
}

window.fetchWineCases = fetchWineCases;
window.resetFilters = resetFilters;
window.navigateToWineCaseDetail = navigateToWineCaseDetail;