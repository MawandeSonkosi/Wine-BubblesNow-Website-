// Marketing Management Detail JavaScript - Fetches assigned adverts properly

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
            console.log(`✅ Loaded ${allAdverts.length} total adverts`);
        } else {
            console.error('Failed to fetch adverts:', response.status);
            allAdverts = [];
        }
    } catch (error) {
        console.error('Error fetching adverts:', error);
        allAdverts = [];
    }
}

// ========== EXTRACT ADVERT IDS FROM MARKETING DATA ==========
function extractAdvertIds(marketing) {
    var ids = [];
    
    // Check different possible locations for advert IDs
    if (marketing.advertIds && Array.isArray(marketing.advertIds)) {
        for (var i = 0; i < marketing.advertIds.length; i++) {
            var item = marketing.advertIds[i];
            if (typeof item === 'string') {
                ids.push(item);
            } else if (typeof item === 'object' && item !== null) {
                // Handle object with _id or id field
                if (item._id) ids.push(item._id);
                else if (item.id) ids.push(item.id);
            }
        }
    }
    
    // Also check for populated adverts array
    if (marketing.adverts && Array.isArray(marketing.adverts)) {
        for (var i = 0; i < marketing.adverts.length; i++) {
            var advert = marketing.adverts[i];
            if (advert._id) ids.push(advert._id);
            else if (advert.id) ids.push(advert.id);
        }
    }
    
    console.log('📋 Extracted advert IDs:', ids);
    return ids;
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
        
        // Fetch all marketing companies (admin endpoint) - try both possible endpoints
        let url = `${API_BASE}/api/marketing?page=1&limit=100`;
        console.log('📡 Fetching marketing companies from:', url);
        
        let response = await fetch(url, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        // If first endpoint fails, try the alternative
        if (!response.ok) {
            console.log('Trying alternative endpoint...');
            url = `${API_BASE}/api/marketing`;
            response = await fetch(url, {
                method: 'GET',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Marketing response:', data);
        
        // Extract companies array
        let companies = [];
        if (data.success === true && Array.isArray(data.data)) {
            companies = data.data;
        } else if (Array.isArray(data)) {
            companies = data;
        } else {
            throw new Error('Invalid response format');
        }
        
        // Find the specific marketing company
        let foundCompany = null;
        for (var i = 0; i < companies.length; i++) {
            var company = companies[i];
            var companyId = company.id || company._id;
            if (companyId == marketingId) {
                foundCompany = company;
                break;
            }
        }
        
        if (!foundCompany) {
            throw new Error('Marketing company not found');
        }
        
        marketingData = foundCompany;
        
        // Extract assigned advert IDs using the helper function
        assignedAdvertIds = extractAdvertIds(marketingData);
        
        console.log('✅ Marketing company loaded:', marketingData.companyName);
        console.log('📋 Assigned advert IDs count:', assignedAdvertIds.length);
        console.log('📋 Assigned advert IDs:', assignedAdvertIds);
        
        // Now fetch the actual advert details for assigned adverts
        await fetchAssignedAdvertDetails();
        
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching marketing company:', error);
        if (container) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading marketing company: ' + error.message + '</p><button class="btn-primary" onclick="fetchMarketingCompany()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href=\'marketing_management_screen.html\'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>';
        }
    }
}

// ========== FETCH ASSIGNED ADVERT DETAILS ==========
async function fetchAssignedAdvertDetails() {
    if (!assignedAdvertIds || assignedAdvertIds.length === 0) {
        console.log('No assigned adverts to fetch');
        return;
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Fetch each assigned advert by ID
        for (var i = 0; i < assignedAdvertIds.length; i++) {
            var advertId = assignedAdvertIds[i];
            try {
                const response = await fetch(`${API_BASE}/api/adverts/${advertId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const advertData = await response.json();
                    const advert = advertData.data || advertData;
                    
                    // Check if already in allAdverts
                    var exists = false;
                    for (var j = 0; j < allAdverts.length; j++) {
                        if (allAdverts[j]._id == advertId || allAdverts[j].id == advertId) {
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        allAdverts.push(advert);
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch advert ${advertId}:`, err);
            }
        }
        console.log(`✅ Fetched details for ${assignedAdvertIds.length} assigned adverts`);
    } catch (error) {
        console.error('Error fetching assigned adverts:', error);
    }
}

// ========== GET ASSIGNED ADVERTS ==========
function getAssignedAdverts() {
    if (!allAdverts.length) return [];
    
    var result = [];
    for (var i = 0; i < assignedAdvertIds.length; i++) {
        var targetId = assignedAdvertIds[i];
        for (var j = 0; j < allAdverts.length; j++) {
            var advert = allAdverts[j];
            var advertId = advert._id || advert.id;
            if (advertId == targetId) {
                result.push(advert);
                break;
            }
        }
    }
    return result;
}

// ========== GET AVAILABLE ADVERTS ==========
function getAvailableAdverts() {
    if (!allAdverts.length) return [];
    
    var available = [];
    for (var i = 0; i < allAdverts.length; i++) {
        var advert = allAdverts[i];
        var advertId = advert._id || advert.id;
        var isAssigned = false;
        for (var j = 0; j < assignedAdvertIds.length; j++) {
            if (assignedAdvertIds[j] == advertId) {
                isAssigned = true;
                break;
            }
        }
        if (!isAssigned) {
            available.push(advert);
        }
    }
    
    if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var filtered = [];
        for (var i = 0; i < available.length; i++) {
            var advert = available[i];
            if ((advert.title && advert.title.toLowerCase().indexOf(q) !== -1) || 
                (advert.subtitle && advert.subtitle.toLowerCase().indexOf(q) !== -1)) {
                filtered.push(advert);
            }
        }
        available = filtered;
    }
    
    return available;
}

// ========== RENDER DETAIL ==========
function renderDetail() {
    var container = document.getElementById('detailContent');
    if (!container || !marketingData) return;
    
    var statusClass = marketingData.isActive ? 'active' : 'inactive';
    var assignedAdverts = getAssignedAdverts();
    var availableAdverts = getAvailableAdverts();
    
    console.log('🎨 Rendering - Assigned adverts count:', assignedAdverts.length);
    console.log('🎨 Rendering - Available adverts count:', availableAdverts.length);
    
    container.innerHTML = `
    <div class="detail-card">
        <div class="detail-header">
            <div class="detail-title">
                <i class="fas fa-chart-line"></i>
                ${escapeHtml(marketingData.companyName)}
            </div>
            <div class="header-actions">
                <button class="btn-icon" onclick="window.location.href='marketing_management_screen.html'">
                    <i class="fas fa-arrow-left"></i> Back
                </button>
                <button class="btn-icon" onclick="editMarketing()">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
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
    var searchInput = document.getElementById('advertSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchQuery = e.target.value;
            updateAvailableAdverts();
        });
    }
}

function renderAssignedAdverts(adverts) {
    if (!adverts || adverts.length === 0) {
        return '<div class="empty-state" style="grid-column:1/-1; padding:40px;"><i class="fas fa-ad" style="font-size:48px; margin-bottom:16px; opacity:0.5;"></i><p>No adverts assigned to this company</p></div>';
    }
    
    var html = '';
    for (var i = 0; i < adverts.length; i++) {
        var advert = adverts[i];
        var advertId = advert._id || advert.id;
        html += `
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
                    <button class="remove-btn" onclick="removeAdvert('${advertId}')" title="Remove from company"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `;
    }
    return html;
}

function renderAvailableAdverts(adverts) {
    if (!adverts || adverts.length === 0) {
        return '<div class="empty-state" style="padding:40px;"><i class="fas fa-check-circle" style="font-size:48px; margin-bottom:16px; color:#2e7d32;"></i><p>No adverts available' + (searchQuery ? ' matching your search' : '') + '</p></div>';
    }
    
    var html = '';
    for (var i = 0; i < adverts.length; i++) {
        var advert = adverts[i];
        var advertId = advert._id || advert.id;
        html += `
            <div class="available-advert-item" onclick="addAdvert('${advertId}')">
                <div class="available-advert-image">
                    ${getAdvertImageHtml(advert, 'small')}
                </div>
                <div class="available-advert-info">
                    <div class="available-advert-name">${escapeHtml(advert.title)}</div>
                    <div class="available-advert-meta">R${(advert.price || 0).toFixed(2)} • ${escapeHtml(advert.type || 'Advert')}</div>
                </div>
                <button class="add-advert-btn" onclick="event.stopPropagation(); addAdvert('${advertId}')">+ Add</button>
            </div>
        `;
    }
    return html;
}

function getAdvertImageHtml(advert, size) {
    size = size || 'normal';
    var title = escapeHtml(advert.title || 'Advert');
    var type = advert.productType || advert.type || 'advert';
    
    // Determine appropriate icon
    var icon = 'fa-ad';
    if (type === 'marketing_banner' || type === 'marketing') icon = 'fa-bullhorn';
    if (type === 'wine' || type === 'wine_banner') icon = 'fa-wine-bottle';
    if (type === 'sponsored_content') icon = 'fa-star';
    if (type === 'featured_ad') icon = 'fa-crown';
    
    if (advert.imageUrl && advert.imageUrl.trim() !== '') {
        var imgUrl = getImageUrl(advert.imageUrl);
        return '<img src="' + imgUrl + '" alt="' + title + '" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML=\'<div class=\\\'advert-image-placeholder\\\'><i class=\\\'fas ' + icon + '\\\'></i><span>' + title + '</span></div>\'">';
    }
    return '<div class="advert-image-placeholder"><i class="fas ' + icon + '"></i><span>' + title + '</span></div>';
}

function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('/') === 0) return imageUrl;
    if (imageUrl.indexOf('assets/') === 0) return '/' + imageUrl;
    return '/assets/images/' + imageUrl;
}

function updateAvailableAdverts() {
    var container = document.getElementById('availableAdvertsContainer');
    if (container) {
        var availableAdverts = getAvailableAdverts();
        container.innerHTML = renderAvailableAdverts(availableAdverts);
    }
}

function updateAssignedAdverts() {
    var container = document.getElementById('assignedAdvertsContainer');
    if (container) {
        var assignedAdverts = getAssignedAdverts();
        container.innerHTML = renderAssignedAdverts(assignedAdverts);
    }
}

// ========== ADD ADVERT TO COMPANY ==========
window.addAdvert = async function(advertId) {
    if (isLoading) return;
    
    isLoading = true;
    
    try {
        var token = localStorage.getItem('wineBubbles_token');
        var response = await fetch(API_BASE + '/api/marketing/' + marketingId + '/adverts/' + advertId, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add advert');
        }
        
        // Update local data
        var alreadyExists = false;
        for (var i = 0; i < assignedAdvertIds.length; i++) {
            if (assignedAdvertIds[i] == advertId) {
                alreadyExists = true;
                break;
            }
        }
        if (!alreadyExists) {
            assignedAdvertIds.push(advertId);
            
            // Fetch the advert details
            var advertResponse = await fetch(API_BASE + '/api/adverts/' + advertId, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (advertResponse.ok) {
                var advertData = await advertResponse.json();
                var newAdvert = advertData.data || advertData;
                allAdverts.push(newAdvert);
            }
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
        var token = localStorage.getItem('wineBubbles_token');
        var response = await fetch(API_BASE + '/api/marketing/' + marketingId + '/adverts/' + advertId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove advert');
        }
        
        // Update local data
        var newAssignedIds = [];
        for (var i = 0; i < assignedAdvertIds.length; i++) {
            if (assignedAdvertIds[i] != advertId) {
                newAssignedIds.push(assignedAdvertIds[i]);
            }
        }
        assignedAdvertIds = newAssignedIds;
        
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
    window.location.href = 'marketing_management_add_edit.html?id=' + marketingId;
};

// ========== HELPER FUNCTIONS ==========
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        var d = new Date(dateStr);
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

function showToast(message, type) {
    type = type || 'success';
    var existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:' + (type === 'success' ? '#2e7d32' : '#d32f2f') + '; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    document.body.appendChild(toast);
    setTimeout(function() { 
        if (toast && toast.parentNode) toast.remove(); 
    }, 3000);
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchAllAdverts();
    fetchMarketingCompany();
}