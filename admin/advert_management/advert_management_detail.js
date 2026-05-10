// Advert Management Detail JavaScript

const API_BASE = window.location.origin;
const urlParams = new URLSearchParams(window.location.search);
const advertId = urlParams.get('id');

let advertData = null;
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
            <div style="font-weight:bold; margin-bottom:4px;">${escapeHtml(user.fullName || user.email)} <span class="badge-admin" style="background:#6b0d2b; color:white; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:8px;">ADMIN</span></div>
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

// ========== FETCH ADVERT DETAILS ==========
async function fetchAdvertDetails() {
    if (!advertId) {
        showError('No advert ID provided');
        return;
    }
    
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading advert details...</p></div>';
    }
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/adverts/${advertId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 Advert details:', data);
        
        // Handle response format
        if (data.data && typeof data.data === 'object') {
            advertData = data.data;
        } else if (data._id || data.id) {
            advertData = data;
        } else {
            throw new Error('Invalid response format');
        }
        
        renderDetail();
        
    } catch (error) {
        console.error('Error fetching advert:', error);
        if (container) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading advert: ${error.message}</p><button class="btn-primary" onclick="fetchAdvertDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='advert_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
        }
    }
}

// ========== RENDER DETAIL ==========
function renderDetail() {
    const container = document.getElementById('detailContent');
    if (!container || !advertData) return;
    
    const revenue = (advertData.price || 0) * (advertData.purchases || 0);
    const ctr = (advertData.ctr || 0).toFixed(1);
    const conversionRate = (advertData.conversionRate || 0).toFixed(1);
    const imageUrl = getImageUrl(advertData.imageUrl);
    
    container.innerHTML = `
        <div class="detail-card">
            <div class="detail-header">
                <div class="detail-title">
                    <i class="fas fa-ad"></i>
                    ${escapeHtml(advertData.title)}
                </div>
                <div class="header-actions">
                    <button class="btn-icon" onclick="window.location.href='advert_management_screen.html'">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                    <button class="btn-icon" onclick="editAdvert()">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>
            
            <div class="detail-section">
                <div class="image-container">
                    ${advertData.imageUrl ? 
                        `<img src="${imageUrl}" alt="${escapeHtml(advertData.title)}" onerror="this.parentElement.innerHTML='<div class=\'image-placeholder\'><i class=\'fas fa-ad\'></i><p>Failed to load image</p></div>'">` : 
                        `<div class="image-placeholder"><i class="fas fa-ad"></i><p>No image</p></div>`
                    }
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-info-circle"></i> Advert Information</h3>
                <div class="info-grid">
                    <div class="info-row"><div class="info-label">Title:</div><div class="info-value">${escapeHtml(advertData.title)}</div></div>
                    <div class="info-row"><div class="info-label">Subtitle:</div><div class="info-value">${escapeHtml(advertData.subtitle || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Type:</div><div class="info-value">${escapeHtml(advertData.type || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Category:</div><div class="info-value">${escapeHtml(advertData.category || '—')}</div></div>
                    <div class="info-row"><div class="info-label">Product Type:</div><div class="info-value">${escapeHtml((advertData.productType || 'advert').replace(/_/g, ' '))}</div></div>
                    <div class="info-row"><div class="info-label">Target URL:</div><div class="info-value">${advertData.targetUrl ? `<a href="${escapeHtml(advertData.targetUrl)}" target="_blank" style="color:var(--admin-primary);">${escapeHtml(advertData.targetUrl)}</a>` : '—'}</div></div>
                    <div class="info-row"><div class="info-label">Position:</div><div class="info-value">${advertData.position || 0}</div></div>
                    <div class="info-row"><div class="info-label">Price:</div><div class="info-value">R${(advertData.price || 0).toFixed(2)}</div></div>
                    <div class="info-row"><div class="info-label">Stock:</div><div class="info-value">${advertData.stockCount || 0} placements</div></div>
                    <div class="info-row"><div class="info-label">Status:</div><div class="info-value">
                        <span class="badge ${advertData.isActive ? 'badge-active' : 'badge-inactive'}">${advertData.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        <span class="badge ${advertData.isAvailableForPurchase && advertData.stockCount > 0 ? 'badge-purchasable' : 'badge-display'}" style="margin-left:8px;">${advertData.isAvailableForPurchase && advertData.stockCount > 0 ? 'PURCHASABLE' : 'DISPLAY ONLY'}</span>
                    </div></div>
                    ${advertData.createdAt ? `<div class="info-row"><div class="info-label">Created:</div><div class="info-value">${formatDate(advertData.createdAt)}</div></div>` : ''}
                    ${advertData.updatedAt ? `<div class="info-row"><div class="info-label">Last Updated:</div><div class="info-value">${formatDate(advertData.updatedAt)}</div></div>` : ''}
                </div>
            </div>
            
            <div class="detail-section">
                <h3 class="section-title"><i class="fas fa-chart-line"></i> Performance Analytics</h3>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${formatNumber(advertData.impressions || 0)}</div><div class="stat-label">Impressions</div></div>
                    <div class="stat-card"><div class="stat-value">${formatNumber(advertData.clicks || 0)}</div><div class="stat-label">Clicks</div></div>
                    <div class="stat-card"><div class="stat-value">${formatNumber(advertData.purchases || 0)}</div><div class="stat-label">Purchases</div></div>
                    <div class="stat-card"><div class="stat-value">${ctr}%</div><div class="stat-label">CTR</div></div>
                    <div class="stat-card"><div class="stat-value">${conversionRate}%</div><div class="stat-label">Conversion Rate</div></div>
                    <div class="stat-card"><div class="stat-value">R${revenue.toFixed(2)}</div><div class="stat-label">Revenue Generated</div></div>
                </div>
            </div>
            
            <div class="detail-section" style="display: flex; gap: 16px; justify-content: flex-end; border-bottom: none;">
                <button class="btn-secondary" onclick="window.location.href='advert_management_screen.html'"><i class="fas fa-arrow-left"></i> Back to List</button>
                <button class="btn-primary" onclick="editAdvert()"><i class="fas fa-edit"></i> Edit Advert</button>
                <button class="btn-secondary" style="background: ${advertData.isActive ? '#d32f2f' : '#2e7d32'}; color:white; border:none;" onclick="toggleStatus()">
                    <i class="fas ${advertData.isActive ? 'fa-toggle-off' : 'fa-toggle-on'}"></i> ${advertData.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `;
}

// ========== HELPER FUNCTIONS ==========
function getImageUrl(imageUrl) {
    if (!imageUrl) return '';
    if (imageUrl.indexOf('http') === 0) return imageUrl;
    if (imageUrl.indexOf('assets/') === 0) return '../../' + imageUrl;
    return '../../assets/images/' + imageUrl;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

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
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showError(message) {
    const container = document.getElementById('detailContent');
    if (container) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>${escapeHtml(message)}</p><button class="btn-primary" onclick="fetchAdvertDetails()" style="margin-top:16px;">Retry</button><button class="btn-secondary" onclick="window.location.href='advert_management_screen.html'" style="margin-top:16px; margin-left:8px;">Back to List</button></div>`;
    } else {
        alert(message);
    }
}

function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== ACTIONS ==========
function editAdvert() {
    if (advertId && advertId !== 'undefined' && advertId !== 'null') {
        window.location.href = `advert_management_add_edit.html?id=${advertId}`;
    } else {
        showError('Unable to edit: Invalid advert ID');
    }
}

async function toggleStatus() {
    if (!advertData) return;
    
    if (isLoading) return;
    isLoading = true;
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const updatedAdvert = {
            ...advertData,
            isActive: !advertData.isActive
        };
        
        // Remove internal fields
        delete updatedAdvert.id;
        delete updatedAdvert._id;
        delete updatedAdvert.createdAt;
        delete updatedAdvert.updatedAt;
        
        const response = await fetch(`${API_BASE}/api/adverts/${advertId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedAdvert)
        });
        
        if (!response.ok) throw new Error('Failed to update status');
        
        // Update local data
        advertData.isActive = !advertData.isActive;
        renderDetail();
        
        showToast(`Advert ${advertData.isActive ? 'activated' : 'deactivated'}`, 'success');
        
    } catch (error) {
        console.error('Toggle status error:', error);
        showToast('Failed to update advert status', 'error');
    } finally {
        isLoading = false;
    }
}

// ========== INITIALIZE ==========
if (checkAuth()) {
    fetchAdvertDetails();
}