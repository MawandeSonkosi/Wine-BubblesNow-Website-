// Configuration - USE PROXY SERVER (works on both localhost and production)
const API_BASE_URL = '/api';

// State
let allWineFarms = [];
let filteredWineFarms = [];
let searchQuery = '';

// DOM Elements
const wineFarmsGrid = document.getElementById('wineFarmsGrid');
const searchInput = document.getElementById('searchInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍷 Wine Bars page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  fetchWineFarms();
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      filterWineFarms();
    });
  }
}

// Fetch wine farms from backend
async function fetchWineFarms() {
  try {
    showLoading();
    
    console.log('🌐 Fetching wine bars from API...');
    
    // Use the admin/all endpoint to get ALL farms (including inactive for Coming Soon)
    const endpoint = `${API_BASE_URL}/winefarms/admin/all?_=${Date.now()}`;
    
    console.log(`📡 Trying endpoint: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      // Fallback to regular endpoint if admin endpoint fails
      const fallbackEndpoint = `${API_BASE_URL}/winefarms?_=${Date.now()}`;
      console.log(`📡 Trying fallback endpoint: ${fallbackEndpoint}`);
      const fallbackResponse = await fetch(fallbackEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!fallbackResponse.ok) {
        throw new Error('No working endpoint found for wine bars');
      }
      
      const fallbackData = await fallbackResponse.json();
      processWineFarmsData(fallbackData, fallbackEndpoint);
      return;
    }
    
    const data = await response.json();
    processWineFarmsData(data, endpoint);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine bars: ${error.message}`);
  }
}

function processWineFarmsData(data, endpoint) {
  console.log('📦 API Response:', data);
  
  // Handle different response formats
  let wineFarms = [];
  if (data.success && Array.isArray(data.data)) {
    wineFarms = data.data;
  } else if (Array.isArray(data)) {
    wineFarms = data;
  } else if (data.wineFarms && Array.isArray(data.wineFarms)) {
    wineFarms = data.wineFarms;
  } else if (data.data && Array.isArray(data.data)) {
    wineFarms = data.data;
  } else {
    wineFarms = [];
  }
  
  console.log(`✅ Success! Received ${wineFarms.length} wine bars`);
  
  // Log each farm's active status
  wineFarms.forEach(farm => {
    console.log(`   - ${farm.name}: isActive = ${farm.isActive}`);
  });
  
  allWineFarms = wineFarms;
  filteredWineFarms = wineFarms;
  
  if (wineFarms.length === 0) {
    showEmptyState('No wine bars found');
  } else {
    renderWineFarms();
  }
}

// Fix image URLs - ensure images display properly
function fixImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === '') {
    return '../assets/images/default_wine_bar.jpg';
  }
  
  // If it's already a full URL
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // If it starts with assets/
  if (imageUrl.startsWith('assets/')) {
    return '../' + imageUrl;
  }
  
  // If it starts with ../assets/
  if (imageUrl.startsWith('../assets/')) {
    return imageUrl;
  }
  
  // If it starts with /
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  // Default: prepend ../assets/
  return '../assets/' + imageUrl;
}

// Truncate description
function truncateDescription(description, maxLength = 100) {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render wine farms with Coming Soon support
function renderWineFarms() {
  console.log(`🎨 Rendering ${filteredWineFarms.length} wine bars...`);
  
  if (filteredWineFarms.length === 0) {
    showEmptyState('No wine bars match your search');
    return;
  }
  
  wineFarmsGrid.innerHTML = filteredWineFarms.map(farm => {
    const isComingSoon = !farm.isActive;
    const imageUrl = fixImageUrl(farm.imageUrl);
    const description = truncateDescription(farm.description, 80);
    const hasVideo = farm.videoUrl && farm.videoUrl.trim() !== '';
    const hasContactInfo = farm.phoneNumber || farm.email;
    const comingSoonClass = isComingSoon ? 'coming-soon' : '';
    
    return `
      <div class="wine-farm-card ${comingSoonClass}" onclick="navigateToWineFarmDetail('${farm._id || farm.id}')">
        <div class="wine-farm-image-container">
          <img src="${imageUrl}" 
               alt="${escapeHtml(farm.name)}" 
               class="wine-farm-image"
               loading="lazy"
               onerror="this.onerror=null; this.src='../assets/images/default_wine_bar.jpg';">
          ${hasVideo && !isComingSoon ? `
            <div class="video-indicator">
              <i class="fas fa-video"></i>
              <span>Video Tour</span>
            </div>
          ` : ''}
          ${isComingSoon ? `
            <div class="coming-soon-overlay">
              <span>COMING SOON</span>
            </div>
          ` : ''}
        </div>
        <div class="wine-farm-label">
          <div class="wine-farm-title">${escapeHtml(farm.name)}</div>
          <div class="wine-farm-location">
            <i class="fas fa-map-marker-alt"></i>
            ${escapeHtml(farm.location)}
          </div>
          ${description ? `
            <div class="wine-farm-description">
              ${isComingSoon ? 'Coming soon - check back later!' : escapeHtml(description)}
            </div>
          ` : ''}
          ${!isComingSoon && hasContactInfo ? `
            <div class="wine-farm-contact">
              ${farm.phoneNumber ? `
                <div class="contact-item">
                  <i class="fas fa-phone"></i>
                  <span>${escapeHtml(farm.phoneNumber)}</span>
                </div>
              ` : ''}
              ${farm.email ? `
                <div class="contact-item">
                  <i class="fas fa-envelope"></i>
                  <span>${escapeHtml(farm.email)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
          ${isComingSoon ? `
            <div class="coming-soon-badge">COMING SOON</div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Render complete!');
}

// Navigate to wine farm detail page
function navigateToWineFarmDetail(farmId) {
  console.log(`📱 Navigating to wine bar detail: ${farmId}`);
  window.location.href = `wine_farm_detail.html?id=${farmId}`;
}

// Filter wine farms
function filterWineFarms() {
  if (!searchQuery) {
    filteredWineFarms = [...allWineFarms];
  } else {
    filteredWineFarms = allWineFarms.filter(farm => {
      const searchLower = searchQuery.toLowerCase().trim();
      
      const matchesName = (farm.name || '').toLowerCase().includes(searchLower);
      const matchesLocation = (farm.location || '').toLowerCase().includes(searchLower);
      const matchesDescription = (farm.description || '').toLowerCase().includes(searchLower);
      
      return matchesName || matchesLocation || matchesDescription;
    });
  }
  
  console.log(`🔍 Filtered to ${filteredWineFarms.length} wine bars`);
  renderWineFarms();
}

// UI States
function showLoading() {
  wineFarmsGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine bars...</p>
    </div>
  `;
}

function showError(message) {
  wineFarmsGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
      <button onclick="fetchWineFarms()" class="btn-fill">
        Try Again
      </button>
    </div>
  `;
}

function showEmptyState(message) {
  wineFarmsGrid.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-wine-bottle"></i>
      <h3>${escapeHtml(message)}</h3>
      <p>Try changing your search</p>
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
  filteredWineFarms = [...allWineFarms];
  renderWineFarms();
}

// Make functions available globally
window.fetchWineFarms = fetchWineFarms;
window.resetSearch = resetSearch;
window.navigateToWineFarmDetail = navigateToWineFarmDetail;