// Configuration - USE PROXY SERVER (works on both localhost and production)
const API_BASE_URL = '/api';  // This works on both localhost and app.wineandbubblesnow.co.za

// State
let currentWineFarm = null;

// DOM Elements
const wineFarmDetailContainer = document.getElementById('wineFarmDetailContainer');
const videoModal = document.getElementById('videoModal');
const closeVideoModal = document.getElementById('closeVideoModal');
const farmVideo = document.getElementById('farmVideo');
const playPauseBtn = document.getElementById('playPauseBtn');
const videoSeek = document.getElementById('videoSeek');
const videoProgressBar = document.getElementById('videoProgressBar');
const videoTime = document.getElementById('videoTime');
const muteBtn = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const videoTitle = document.getElementById('videoTitle');

// Video state
let isVideoPlaying = false;
let isVideoMuted = false;
let videoDuration = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🍇 Wine Farm detail page loaded');
  console.log('🔧 Using API URL:', API_BASE_URL);
  
  // Get wine farm ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const farmId = urlParams.get('id');
  
  if (!farmId) {
    showError('No wine farm ID provided');
    return;
  }
  
  fetchWineFarmDetail(farmId);
  setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
  // Close video modal
  if (closeVideoModal) {
    closeVideoModal.addEventListener('click', closeVideoPlayer);
  }
  
  // Close modal when clicking outside
  if (videoModal) {
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        closeVideoPlayer();
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal.classList.contains('show')) {
      closeVideoPlayer();
    }
  });
  
  // Setup video controls
  setupVideoControls();
}

// Setup video controls
function setupVideoControls() {
  if (!farmVideo) return;
  
  // Play/Pause button
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (farmVideo.paused) {
        farmVideo.play();
      } else {
        farmVideo.pause();
      }
    });
  }
  
  // Video seek
  if (videoSeek) {
    videoSeek.addEventListener('input', (e) => {
      const seekTime = (e.target.value / 100) * farmVideo.duration;
      farmVideo.currentTime = seekTime;
    });
  }
  
  // Mute button
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      farmVideo.muted = !farmVideo.muted;
      updateMuteButton();
    });
  }
  
  // Volume slider
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      farmVideo.volume = e.target.value / 100;
      if (farmVideo.muted && farmVideo.volume > 0) {
        farmVideo.muted = false;
        updateMuteButton();
      }
    });
  }
  
  // Fullscreen button
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }
  
  // Video events
  farmVideo.addEventListener('timeupdate', updateVideoProgress);
  farmVideo.addEventListener('loadedmetadata', () => {
    videoDuration = farmVideo.duration;
    updateVideoTime();
  });
  farmVideo.addEventListener('play', () => {
    isVideoPlaying = true;
    updatePlayPauseButton();
  });
  farmVideo.addEventListener('pause', () => {
    isVideoPlaying = false;
    updatePlayPauseButton();
  });
  farmVideo.addEventListener('volumechange', () => {
    isVideoMuted = farmVideo.muted;
    updateMuteButton();
    volumeSlider.value = farmVideo.volume * 100;
  });
  farmVideo.addEventListener('ended', () => {
    isVideoPlaying = false;
    updatePlayPauseButton();
  });
  farmVideo.addEventListener('error', (e) => {
    console.error('Video error:', farmVideo.error);
    showVideoError();
  });
}

// Update video progress
function updateVideoProgress() {
  if (!farmVideo.duration) return;
  
  const progress = (farmVideo.currentTime / farmVideo.duration) * 100;
  
  if (videoProgressBar) {
    videoProgressBar.style.width = `${progress}%`;
  }
  
  if (videoSeek) {
    videoSeek.value = progress;
  }
  
  updateVideoTime();
}

// Update video time display
function updateVideoTime() {
  if (!videoTime) return;
  
  const currentTime = formatTime(farmVideo.currentTime);
  const duration = formatTime(farmVideo.duration || videoDuration);
  
  videoTime.textContent = `${currentTime} / ${duration}`;
}

// Format time (seconds to MM:SS)
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update play/pause button
function updatePlayPauseButton() {
  if (!playPauseBtn) return;
  
  const icon = playPauseBtn.querySelector('i');
  if (icon) {
    icon.className = isVideoPlaying ? 'fas fa-pause' : 'fas fa-play';
  }
}

// Update mute button
function updateMuteButton() {
  if (!muteBtn) return;
  
  const icon = muteBtn.querySelector('i');
  if (icon) {
    icon.className = farmVideo.muted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    if (videoModal.requestFullscreen) {
      videoModal.requestFullscreen();
    } else if (videoModal.webkitRequestFullscreen) {
      videoModal.webkitRequestFullscreen();
    } else if (videoModal.msRequestFullscreen) {
      videoModal.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Show video error
function showVideoError() {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'video-error';
  errorDiv.innerHTML = `
    <i class="fas fa-exclamation-triangle"></i>
    <h4>Unable to play video</h4>
    <p>The video file could not be loaded. Please check the video URL or try again later.</p>
  `;
  
  const container = document.querySelector('.video-player-container');
  if (container) {
    // Remove existing error
    const existingError = container.querySelector('.video-error');
    if (existingError) {
      existingError.remove();
    }
    
    container.appendChild(errorDiv);
  }
}

// Fetch wine farm detail
async function fetchWineFarmDetail(farmId) {
  try {
    showLoading();
    
    console.log(`🌐 Fetching wine farm detail for ID: ${farmId}...`);
    
    // Try admin endpoint first to get isActive status
    let apiUrl = `${API_BASE_URL}/winefarms/admin/all?_=${Date.now()}`;
    console.log('📡 Fetching from:', apiUrl);
    
    let response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    let farm = null;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        farm = data.data.find(f => f._id === farmId || f.id === farmId);
      }
    }
    
    // If not found in admin endpoint, try single farm endpoint
    if (!farm) {
      apiUrl = `${API_BASE_URL}/winefarms/${farmId}?_=${Date.now()}`;
      console.log('📡 Trying single endpoint:', apiUrl);
      
      response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          farm = data.data;
        }
      }
    }
    
    if (!farm) {
      throw new Error('Wine farm not found');
    }
    
    console.log('✅ Wine farm detail received:', farm);
    console.log('   - isActive:', farm.isActive);
    
    currentWineFarm = farm;
    renderWineFarmDetail(farm);
    
  } catch (error) {
    console.error('Error:', error);
    showError(`Failed to load wine farm details: ${error.message}`);
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

// Fix video URL
function fixVideoUrl(videoUrl) {
  if (!videoUrl) return null;
  
  if (videoUrl.startsWith('../assets/')) {
    return videoUrl;
  }
  
  if (videoUrl.startsWith('assets/')) {
    return '../' + videoUrl;
  }
  
  if (videoUrl.startsWith('http') || videoUrl.startsWith('/')) {
    return videoUrl;
  }
  
  return '../assets/' + videoUrl;
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Render wine farm detail with Coming Soon support
function renderWineFarmDetail(farm) {
  const isComingSoon = !farm.isActive;
  const imageUrl = fixImageUrl(farm.imageUrl);
  const videoUrl = fixVideoUrl(farm.videoUrl);
  const hasVideo = videoUrl && videoUrl.trim() !== '' && !isComingSoon;
  const hasContactInfo = (farm.phoneNumber || farm.email) && !isComingSoon;
  const featuredWines = farm.featuredWines || [];
  
  let template = `
    <div class="wine-farm-detail-card">
      <div class="wine-farm-detail-image-container">
        <img src="${imageUrl}" 
             alt="${escapeHtml(farm.name)}" 
             class="wine-farm-detail-image"
             loading="lazy"
             onerror="this.onerror=null; this.src='../assets/images/default_farm.jpg';">
        ${isComingSoon ? `
          <div class="coming-soon-overlay-large">
            <span>COMING SOON</span>
          </div>
        ` : ''}
      </div>
      <div class="wine-farm-detail-content">
        <h1 class="wine-farm-detail-name" style="${isComingSoon ? 'color: #999;' : ''}">${escapeHtml(farm.name)}</h1>
        <div class="wine-farm-detail-location">
          <i class="fas fa-map-marker-alt"></i>
          ${escapeHtml(farm.location)}
        </div>
        <div class="wine-farm-detail-description">
          ${isComingSoon ? 'Coming soon - check back later!' : escapeHtml(farm.description)}
        </div>
  `;
  
  // Contact Information (only for active farms)
  if (hasContactInfo) {
    template += `
      <div class="wine-farm-contact-info">
        <h3>Contact Information</h3>
        <div class="contact-info-grid">
    `;
    
    if (farm.phoneNumber) {
      template += `
        <div class="contact-info-item">
          <i class="fas fa-phone"></i>
          <span>${escapeHtml(farm.phoneNumber)}</span>
        </div>
      `;
    }
    
    if (farm.email) {
      template += `
        <div class="contact-info-item">
          <i class="fas fa-envelope"></i>
          <span>${escapeHtml(farm.email)}</span>
        </div>
      `;
    }
    
    template += `
        </div>
      </div>
    `;
  }
  
  // Video Button (only for active farms with video)
  if (hasVideo) {
    template += `
      <button class="wine-farm-video-button" id="watchVideoBtn">
        <i class="fas fa-video"></i>
        Watch Vineyard Tour
      </button>
    `;
  }
  
  // Coming Soon Badge for inactive farms
  if (isComingSoon) {
    template += `
      <div class="coming-soon-message">
        <i class="fas fa-hourglass-half"></i>
        <p>This wine bar is coming soon! Check back later for more information.</p>
      </div>
    `;
  }
  
  template += `
      </div>
    </div>
  `;
  
  // Featured Wines Section (only for active farms)
  if (!isComingSoon && featuredWines.length > 0) {
    template += `
      <div class="featured-wines-section">
        <h3>Featured Wines</h3>
        <div class="wine-grid">
    `;
    
    featuredWines.slice(0, 6).forEach(wine => {
      const wineImageUrl = fixImageUrl(wine.imageUrl);
      const winePrice = wine.price || 0;
      const wineType = wine.type || 'Wine';
      
      template += `
        <div class="wine-card" onclick="navigateToWineDetail('${wine._id || wine.id}')">
          <div class="wine-image-container">
            <img src="${wineImageUrl}" 
                 alt="${escapeHtml(wine.name)}" 
                 class="wine-image"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='../assets/wines/default_wine.png';">
          </div>
          <div class="wine-label">
            <div class="wine-title">${escapeHtml(wine.name)}</div>
            <div class="wine-sub">${escapeHtml(wineType)}</div>
            <div class="wine-price">R${winePrice.toFixed(2)}</div>
          </div>
        </div>
      `;
    });
    
    template += `
        </div>
      </div>
    `;
  }
  
  wineFarmDetailContainer.innerHTML = template;
  
  // Add event listener for video button
  if (hasVideo) {
    const videoBtn = document.getElementById('watchVideoBtn');
    if (videoBtn) {
      videoBtn.addEventListener('click', () => {
        playVideo(videoUrl, farm.name);
      });
    }
  }
}

// Play video
function playVideo(videoUrl, farmName) {
  if (!videoUrl) {
    alert('Video tour not available for this wine farm.');
    return;
  }
  
  console.log('🎬 Playing video:', videoUrl);
  
  // Set video title
  if (videoTitle && farmName) {
    videoTitle.textContent = `${farmName} - Vineyard Tour`;
  }
  
  // Reset video state
  farmVideo.pause();
  farmVideo.currentTime = 0;
  farmVideo.muted = false;
  farmVideo.volume = 1;
  
  // Clear any existing error
  const existingError = document.querySelector('.video-error');
  if (existingError) {
    existingError.remove();
  }
  
  // Set video source
  farmVideo.src = videoUrl;
  
  // Reset controls
  if (videoProgressBar) {
    videoProgressBar.style.width = '0%';
  }
  if (videoSeek) {
    videoSeek.value = 0;
  }
  if (volumeSlider) {
    volumeSlider.value = 100;
  }
  
  // Update buttons
  updatePlayPauseButton();
  updateMuteButton();
  updateVideoTime();
  
  // Show modal
  videoModal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // Try to play video
  const playPromise = farmVideo.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.log('Video autoplay prevented:', error);
      // User needs to click play button
    });
  }
}

// Close video player
function closeVideoPlayer() {
  farmVideo.pause();
  farmVideo.currentTime = 0;
  farmVideo.src = '';
  
  videoModal.classList.remove('show');
  document.body.style.overflow = 'auto';
  
  // Clear any error messages
  const existingError = document.querySelector('.video-error');
  if (existingError) {
    existingError.remove();
  }
}

// Navigate to wine detail
function navigateToWineDetail(wineId) {
  console.log(`🍷 Navigating to wine detail: ${wineId}`);
  window.location.href = `../wine/wine_detail.html?id=${wineId}`;
}

// UI States
function showLoading() {
  wineFarmDetailContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading wine farm details...</p>
    </div>
  `;
}

function showError(message) {
  wineFarmDetailContainer.innerHTML = `
    <div class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <h3>Error</h3>
      <p>${escapeHtml(message)}</p>
      <button onclick="window.location.href='wine_farm.html'" class="btn-fill">
        Back to Wine Bars
      </button>
    </div>
  `;
}

// Make functions available globally
window.navigateToWineDetail = navigateToWineDetail;