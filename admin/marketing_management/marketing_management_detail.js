// Marketing Management Detail JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const marketingId = urlParams.get('id');

let marketingData = null;
let allAdverts = [];
let assignedAdvertIds = [];
let searchQuery = '';
let isLoading = false;

// ========== AUTHENTICATION ==========
function checkAuth() {
    const token = localStorage.getItem('wineBubbles_token');
    const isAdmin = localStorage.getItem('wineBubbles_isAdmin') === 'true';
    
    if (!token || !isAdmin) {
        alert('Admin access required');
        window.location.href = '../../login/login.html';
        return false;
    }
    
    const userData = localStorage.getItem('wineBubbles_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userIcon = document.getElementById('userIcon');
            if (userIcon) {
                userIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleUserDropdown(user);
                });
            }
        } catch(e) {}
    }
    return true;
}

function toggleUserDropdown(user) {
    const existing = document.querySelector('.user-dropdown');
    if (existing) { existing.remove(); return; }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.style.cssText = 'position:absolute; top:100px; right:20px; background:white; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.12); padding:16px; min-width:220px; z-index:1000; border:1px solid #eae3da;';
    dropdown.innerHTML = `
        <div style="margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #eee;">
            <div style="font-weight:bold; margin-bottom:4px;">${escapeHtml(user.fullName || user.email)} <span class="badge badge-admin">ADMIN</span></div>
            <div style="font-size:13px; color:#6d6d6d;">${escapeHtml(user.email)}</div>
        </div>
        <a href="../../user/profile.html" style="display:flex; align-items:center; gap:10px; padding:10px 0; color:#1b1b1b; text-decoration:none;"><i class="fas fa-user"></i> My Profile</a>
        <button id="logoutBtn" style="margin-top:12px; padding:10px; background:#6b0d2b; color:white; border:none; border-radius:8px; width:100%; cursor:pointer; font-weight:600;">Logout</button>
    `;
    document.body.appendChild(dropdown);
    
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('wineBubbles_token');
        localStorage.removeItem('wineBubbles_token_timestamp');
        localStorage.removeItem('wineBubbles_user');
        localStorage.removeItem('wineBubbles_isAdmin');
        localStorage.removeItem('wineBubbles_isDriver');
        window.location.href = '../../login/login.html';
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !document.getElementById('userIcon')?.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// ========== FETCH ALL ADVERTS ==========
async function fetchAllAdverts() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/adverts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                allAdverts = data;
            } else if (data.adverts && Array.isArray(data.adverts)) {
                allAdverts = data.adverts;
            } else if (data.data && Array.isArray(data.data)) {
                allAdverts = data.data;
            } else {
                allAdverts = [];
            }
            console.log(`✅ Loaded ${allAdverts.length} adverts`);
        } else {
            console.error('Failed to fetch adverts:', response.status);
            allAdverts = [];
        }
    } catch (error) {
        console.error('Error fetching adverts:', error);
        allAdverts = [];
    }
}

// ========== FETCH MARKETING COMPANY ==========
async function fetchMarketingCompany() {
    if (!marketingId) {
        showError('No marketing ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading marketing company details...</p></div>';
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${marketingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        marketingData = data.data || data;
        assignedAdvertIds = marketingData.advertIds || [];
        
        console.log('✅ Marketing company loaded:', marketingData.companyName);
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching marketing company:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading marketing company: ${error.message}</p><button class="btn-primary" onclick="fetchMarketingCompany()" style="margin-top:16px;">Retry</button></div>`;
        }
    }
}

// ========== GET ASSIGNED ADVERTS ==========
function getAssignedAdverts() {
    if (!allAdverts.length) return [];
    return allAdverts.filter(advert => assignedAdvertIds.includes(advert.id));
}

// ========== GET AVAILABLE ADVERTS ==========
function getAvailableAdverts() {
    if (!allAdverts.length) return [];
    
    let available = allAdverts.filter(advert => !assignedAdvertIds.includes(advert.id));
    
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        available = available.filter(advert => 
            (advert.title && advert.title.toLowerCase().includes(q)) || 
            (advert.subtitle && advert.subtitle.toLowerCase().includes(q))
        );
    }
    
    return available;
}

// ========== RENDER DETAIL ==========
function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !marketingData) return;
    
    const statusClass = marketingData.isActive ? 'active' : 'inactive';
    const assignedAdverts = getAssignedAdverts();
    const availableAdverts = getAvailableAdverts();
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-chart-line"></i>
                    ${escapeHtml(marketingData.companyName)}
                </div>
                <div class="status-badge ${statusClass}">${marketingData.isActive ? 'ACTIVE' : 'INACTIVE'}</div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-info-circle"></i> Company Information</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${escapeHtml(marketingData.email || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Phone:</div><div class="info-value">${escapeHtml(marketingData.phoneNumber || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Contact Person:</div><div class="info-value">${escapeHtml(marketingData.contactPerson || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Address:</div><div class="info-value">${escapeHtml(marketingData.address || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Created:</div><div class="info-value">${formatDate(marketingData.createdAt)}</div></div>
                    <div class="info-row"><div class="info-label">Last Login:</div><div class="info-value">${formatDate(marketingData.lastLogin) || 'Never'}</div></div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-ad"></i> Assigned Adverts (${assignedAdverts.length})</h3>
                <div id="assignedAdvertsContainer" class="adverts-grid">
                    ${renderAssignedAdverts(assignedAdverts)}
                </div>
            </div>
            
            <div class="detail-section">
                <div class="add-advert-header">
                    <h3 class="section-title" style="margin-bottom:0;"><i class="fas fa-plus-circle"></i> Available Adverts</h3>
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="advertSearch" placeholder="Search adverts...">
                    </div>
                </div>
                <div id="availableAdvertsContainer" class="available-adverts-list">
                    ${renderAvailableAdverts(availableAdverts)}
                </div>
            </div>
            
            <div class="detail-section" style="display: flex; gap: 16px; justify-content: flex-end; border-bottom: none;">
                <button class="btn-secondary" onclick="window.location.href='marketing_management_screen.html'"><i class="fas fa-arrow-left"></i> Back</button>
                <button class="btn-primary" onclick="editMarketing()"><i class="fas fa-edit"></i> Edit Company</button>
            </div>
        </div>
    `;
    
    // Setup search listener
    const searchInput = document.getElementById('advertSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            updateAvailableAdverts();
        });
    }
}

function renderAssignedAdverts(adverts) {
    if (!adverts || adverts.length === 0) {
        return '<div class="empty-state" style="grid-column:1/-1; padding:40px;"><i class="fas fa-ad" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i><p>No adverts assigned to this company</p></div>';
    }
    
    return adverts.map(advert => `
        <div class="advert-card">
            <div class="advert-image">
                ${getAdvertImageHtml(advert)}
            </div>
            <div class="advert-title">${escapeHtml(advert.title)}</div>
            <div class="advert-subtitle">${escapeHtml(advert.subtitle || 'No description')}</div>
            <div class="advert-details">
                <div>
                    <span class="advert-price">R${(advert.price || 0).toFixed(2)}</span>
                    <span class="advert-type"> • ${escapeHtml(advert.type || 'Advert')}</span>
                </div>
                <button class="remove-btn" onclick="removeAdvert('${advert.id}')" title="Remove from company"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('');
}

function renderAvailableAdverts(adverts) {
    if (!adverts || adverts.length === 0) {
        return '<div class="empty-state" style="padding:40px;"><i class="fas fa-check-circle" style="font-size:48px; margin-bottom:16px; color:#2e7d32;"></i><p>No adverts available' + (searchQuery ? ' matching your search' : '') + '</p></div>';
    }
    
    return adverts.map(advert => `
        <div class="available-advert-item" onclick="addAdvert('${advert.id}')">
            <div class="available-advert-image">
                ${getAdvertImageHtml(advert, 'small')}
            </div>
            <div class="available-advert-info">
                <div class="available-advert-name">${escapeHtml(advert.title)}</div>
                <div class="available-advert-meta">R${(advert.price || 0).toFixed(2)} • ${escapeHtml(advert.type || 'Advert')}</div>
            </div>
            <button class="add-advert-btn" onclick="event.stopPropagation(); addAdvert('${advert.id}')">+ Add</button>
        </div>
    `).join('');
}

function getAdvertImageHtml(advert, size = 'normal') {
    if (advert.imageUrl && advert.imageUrl.trim() !== '') {
        const imgUrl = getImageUrl(advert.imageUrl);
        return `<img src="${imgUrl}" alt="${escapeHtml(advert.title)}" onerror="this.parentElement.innerHTML='<div class=\\'advert-image-placeholder\\'><i class=\\'fas fa-ad\\'></i></div>'">`;
    }
    return '<div class="advert-image-placeholder"><i class="fas fa-ad"></i></div>';
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('assets/')) return '../../' + imageUrl;
    return '../../assets/images/' + imageUrl;
}

function updateAvailableAdverts() {
    const container = document.getElementById('availableAdvertsContainer');
    if (container) {
        const availableAdverts = getAvailableAdverts();
        container.innerHTML = renderAvailableAdverts(availableAdverts);
    }
}

function updateAssignedAdverts() {
    const container = document.getElementById('assignedAdvertsContainer');
    if (container) {
        const assignedAdverts = getAssignedAdverts();
        container.innerHTML = renderAssignedAdverts(assignedAdverts);
    }
}

// ========== ADD ADVERT TO COMPANY ==========
window.addAdvert = async function(advertId) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${marketingId}/adverts/${advertId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add advert');
        }
        
        // Update local data
        if (!assignedAdvertIds.includes(advertId)) {
            assignedAdvertIds.push(advertId);
        }
        
        // Update UI
        updateAssignedAdverts();
        updateAvailableAdverts();
        
        showToast('Advert added successfully', 'success');
        
    } catch (error) {
        console.error('Add advert error:', error);
        showToast('Failed to add advert: ' + error.message, 'error');
    } finally {
        isLoading = false;
    }
};

// ========== REMOVE ADVERT FROM COMPANY ==========
window.removeAdvert = async function(advertId) {
    if (isLoading) return;
    
    if (!confirm('Remove this advert from the marketing company?')) return;
    
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${marketingId}/adverts/${advertId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove advert');
        }
        
        // Update local data
        assignedAdvertIds = assignedAdvertIds.filter(id => id !== advertId);
        
        // Update UI
        updateAssignedAdverts();
        updateAvailableAdverts();
        
        showToast('Advert removed successfully', 'success');
        
    } catch (error) {
        console.error('Remove advert error:', error);
        showToast('Failed to remove advert: ' + error.message, 'error');
    } finally {
        isLoading = false;
    }
};

// ========== EDIT MARKETING ==========
window.editMarketing = function() {
    window.location.href = `marketing_management_add_edit.html?id=${marketingId}`;
};

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch(e) { 
        return '—';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(function() { 
        if (toast && toast.parentNode) toast.remove(); 
    }, 3000);
}

function showError(message) {
    showToast(message, 'error');
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchAllAdverts().then(function() {
        fetchMarketingCompany();
    }).catch(function(error) {
        console.error('Initialization error:', error);
        fetchMarketingCompany();
    });
}