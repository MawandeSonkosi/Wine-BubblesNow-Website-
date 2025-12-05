// Configuration
const API_BASE_URL = 'https://www.wineandbubblesnow.co.za/api';
const CORS_PROXY = 'https://corsproxy.io/?';

// State
let allWineFarms = [];
let filteredWineFarms = [];
let searchQuery = '';

// DOM Elements
const wineFarmsGrid = document.getElementById('wineFarmsGrid');
const searchInput = document.getElementById('searchInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍇 Wine Farms page loaded');
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
    
    console.log('🌐 Fetching wine farms from API...');
    
    // Use CORS proxy
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(`${API_BASE_URL}/winefarms`)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      const wineFarms = data.data;
      console.log(`✅ Success! Received ${wineFarms.length} wine farms`);
      
      allWineFarms = wineFarms;
      filteredWineFarms = wineFarms;
      
      if (wineFarms.length === 0) {
        showEmptyState('No wine farms found');
      } else {
        renderWineFarms();
      }
      
    } else {
      throw new Error(data.message || 'Failed to load wine farms');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine farms: ${error.message}`);
  }
}

// Fix image URLs
function fixImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === '') {
    return '../assets/images/default_farm.jpg';
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

// Truncate description
function truncateDescription(description, maxLength = 100) {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength) + '...';
}

// Render wine farms
function renderWineFarms() {
  console.log(`🎨 Rendering ${filteredWineFarms.length} wine farms...`);
  
  if (filteredWineFarms.length === 0) {
    showEmptyState('No wine farms match your search');
    return;
  }
  
  wineFarmsGrid.innerHTML = filteredWineFarms.map(farm => {
    const imageUrl = fixImageUrl(farm.imageUrl);
    const description = truncateDescription(farm.description, 80);
    const hasVideo = farm.videoUrl && farm.videoUrl.trim() !== '';
    const hasContactInfo = farm.phoneNumber || farm.email;
    
    return `
      <div class="wine-farm-card" onclick="navigateToWineFarmDetail('${farm._id || farm.id}')">
        <div class="wine-farm-image-container">
          <img src="${imageUrl}" 
               alt="${farm.name}" 
               class="wine-farm-image"
               loading="lazy"
               onerror="this.onerror=null; this.src='../assets/images/default_farm.jpg';">
          ${hasVideo ? `
            <div class="video-indicator">
              <i class="fas fa-video"></i>
              <span>Video Tour</span>
            </div>
          ` : ''}
        </div>
        <div class="wine-farm-label">
          <div class="wine-farm-title">${farm.name}</div>
          <div class="wine-farm-location">
            <i class="fas fa-map-marker-alt"></i>
            ${farm.location}
          </div>
          ${description ? `
            <div class="wine-farm-description">
              ${description}
            </div>
          ` : ''}
          ${hasContactInfo ? `
            <div class="wine-farm-contact">
              ${farm.phoneNumber ? `
                <div class="contact-item">
                  <i class="fas fa-phone"></i>
                  <span>${farm.phoneNumber}</span>
                </div>
              ` : ''}
              ${farm.email ? `
                <div class="contact-item">
                  <i class="fas fa-envelope"></i>
                  <span>${farm.email}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  console.log('✅ Render complete!');
}

// Navigate to wine farm detail page
function navigateToWineFarmDetail(farmId) {
  console.log(`📱 Navigating to wine farm detail: ${farmId}`);
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
  
  console.log(`🔍 Filtered to ${filteredWineFarms.length} wine farms`);
  renderWineFarms();
}

// UI States
function showLoading() {
  wineFarmsGrid.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine farms...</p>
    </div>
  `;
}

function showError(message) {
  wineFarmsGrid.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${message}</p>
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
      <h3>${message}</h3>
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