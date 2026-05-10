// Advert Management JavaScript

const API_BASE = window.location.origin;
let allAdverts = [];
let searchQuery = '';
let statusFilter = 'all';
let typeFilter = 'all';
let purchaseFilter = 'all';

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

// ========== FETCH ADVERTS ==========
async function fetchAdverts() {
    const container = document.getElementById('advertContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading adverts...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/adverts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
        const data = await response.json();
        console.log('📦 Adverts response:', data);
        
        if (Array.isArray(data)) {
            allAdverts = data;
        } else if (data.data && Array.isArray(data.data)) {
            allAdverts = data.data;
        } else {
            allAdverts = [];
        }
        
        console.log(`✅ Loaded ${allAdverts.length} adverts`);
        renderAdverts();
        renderStats();
        
    } catch (error) {
        console.error('Error fetching adverts:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading adverts: ${error.message}</p><button class="btn-primary" onclick="fetchAdverts()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER STATS ==========
function renderStats() {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    
    const total = allAdverts.length;
    const active = allAdverts.filter(a => a.isActive === true).length;
    const purchasable = allAdverts.filter(a => a.isAvailableForPurchase === true && a.stockCount > 0).length;
    const totalImpressions = allAdverts.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalClicks = allAdverts.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : 0;
    
    container.innerHTML = `
        <div class="stat-box"><i class="fas fa-ad"></i><div class="stat-box-info"><div class="stat-box-value">${total}</div><div class="stat-box-label">Total Adverts</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle" style="color:#2e7d32;"></i><div class="stat-box-info"><div class="stat-box-value">${active}</div><div class="stat-box-label">Active</div></div></div>
        <div class="stat-box"><i class="fas fa-shopping-cart" style="color:#1976d2;"></i><div class="stat-box-info"><div class="stat-box-value">${purchasable}</div><div class="stat-box-label">Purchasable</div></div></div>
        <div class="stat-box"><i class="fas fa-chart-line" style="color:#ed6c02;"></i><div class="stat-box-info"><div class="stat-box-value">${avgCTR}%</div><div class="stat-box-label">Avg CTR</div></div></div>
    `;
}

// ========== GET ADVERT ID ==========
function getAdvertId(advert) {
    return advert.id || advert._id;
}

// ========== FILTER ADVERTS ==========
function filterAdverts() {
    let filtered = [...allAdverts];
    
    // Search filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(a => 
            (a.title && a.title.toLowerCase().includes(q)) ||
            (a.subtitle && a.subtitle.toLowerCase().includes(q))
        );
    }
    
    // Status filter
    if (statusFilter === 'active') {
        filtered = filtered.filter(a => a.isActive === true);
    } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(a => a.isActive === false);
    }
    
    // Type filter
    if (typeFilter !== 'all') {
        filtered = filtered.filter(a => a.type === typeFilter);
    }
    
    // Purchase filter
    if (purchaseFilter === 'purchasable') {
        filtered = filtered.filter(a => a.isAvailableForPurchase === true && a.stockCount > 0);
    } else if (purchaseFilter === 'display') {
        filtered = filtered.filter(a => a.isAvailableForPurchase === false || a.stockCount === 0);
    }
    
    return filtered;
}

// ========== RENDER ADVERTS ==========
function renderAdverts() {
    const container = document.getElementById('advertContainer');
    if (!container) return;
    
    const filtered = filterAdverts();
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-ad" style="font-size:48px; margin-bottom:16px;"></i><p>No adverts found${searchQuery ? ' matching your search' : ''}</p><button class="btn-primary" onclick="window.location.href='advert_management_add_edit.html'"><i class="fas fa-plus"></i> Create First Advert</button></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="advert-grid">
            ${filtered.map(advert => {
                const advertId = getAdvertId(advert);
                const ctr = (advert.ctr || 0).toFixed(1);
                const conversion = (advert.conversionRate || 0).toFixed(1);
                const imageUrl = getImageUrl(advert.imageUrl);
                
                return `
                    <div class="advert-card" onclick="viewAdvertDetail('${advertId}')">
                        <div class="advert-image">
                            ${advert.imageUrl ? 
                                `<img src="${imageUrl}" alt="${escapeHtml(advert.title)}" onerror="this.parentElement.innerHTML='<div class=\'advert-image-placeholder\'><i class=\'fas fa-ad\'></i></div>'">` : 
                                `<div class="advert-image-placeholder"><i class="fas fa-ad"></i></div>`
                            }
                        </div>
                        <div class="advert-header">
                            <span class="advert-title">${escapeHtml(advert.title)}</span>
                            <div style="display: flex; gap: 4px;">
                                <span class="badge ${advert.isActive ? 'badge-active' : 'badge-inactive'}">${advert.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                                <span class="badge ${advert.isAvailableForPurchase && advert.stockCount > 0 ? 'badge-purchasable' : 'badge-display'}">${advert.isAvailableForPurchase && advert.stockCount > 0 ? 'PURCHASABLE' : 'DISPLAY'}</span>
                            </div>
                        </div>
                        <div class="advert-body">
                            <div class="advert-subtitle">${escapeHtml(advert.subtitle || 'No description')}</div>
                            <div class="advert-stats">
                                <span class="stat-chip"><i class="fas fa-eye"></i> ${formatNumber(advert.impressions || 0)}</span>
                                <span class="stat-chip"><i class="fas fa-mouse-pointer"></i> ${formatNumber(advert.clicks || 0)}</span>
                                <span class="stat-chip"><i class="fas fa-chart-line"></i> ${ctr}% CTR</span>
                            </div>
                            <div class="advert-price">R${(advert.price || 0).toFixed(2)}</div>
                        </div>
                        <div class="advert-actions" onclick="event.stopPropagation()">
                            <button class="icon-btn" onclick="editAdvert('${advertId}')" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                            <button class="icon-btn" onclick="viewAdvertDetail('${advertId}')" title="View Details"><i class="fas fa-chart-simple"></i> Analytics</button>
                            <button class="icon-btn danger" onclick="deleteAdvertPrompt('${advertId}', '${escapeHtml(advert.title)}')" title="Delete"><i class="fas fa-trash-alt"></i> Delete</button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = gridHtml;
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

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
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

// ========== ADVERT ACTIONS ==========
function viewAdvertDetail(advertId) {
    if (advertId && advertId !== 'undefined' && advertId !== 'null') {
        window.location.href = `advert_management_detail.html?id=${advertId}`;
    } else {
        showToast('Unable to view details: Invalid advert ID', 'error');
    }
}

function editAdvert(advertId) {
    if (advertId && advertId !== 'undefined' && advertId !== 'null') {
        window.location.href = `advert_management_add_edit.html?id=${advertId}`;
    } else {
        showToast('Unable to edit: Invalid advert ID', 'error');
    }
}

function deleteAdvertPrompt(advertId, advertTitle) {
    if (confirm(`⚠️ Permanently delete "${advertTitle}"?\n\nThis action cannot be undone.\nThis will also remove this advert from all marketing companies.`)) {
        deleteAdvert(advertId);
    }
}

async function deleteAdvert(advertId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        
        // Show loading indicator
        const deleteBtn = document.activeElement;
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        const response = await fetch(`${API_BASE}/api/adverts/${advertId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete');
        }
        
        showToast('Advert deleted successfully', 'success');
        
        // Refresh the list
        await fetchAdverts();
        
    } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete advert: ' + error.message, 'error');
    }
}

async function toggleAdvertStatus(advertId, currentStatus) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const advert = allAdverts.find(a => getAdvertId(a) === advertId);
        
        if (!advert) return;
        
        const updatedAdvert = {
            ...advert,
            isActive: !currentStatus
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
        
        showToast(`Advert ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        await fetchAdverts();
        
    } catch (error) {
        console.error('Toggle status error:', error);
        showToast('Failed to update advert status', 'error');
    }
}

// ========== FILTER EVENT LISTENERS ==========
function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderAdverts();
        });
    }
    
    const statusFilterEl = document.getElementById('statusFilter');
    if (statusFilterEl) {
        statusFilterEl.addEventListener('change', (e) => {
            statusFilter = e.target.value;
            renderAdverts();
        });
    }
    
    const typeFilterEl = document.getElementById('typeFilter');
    if (typeFilterEl) {
        typeFilterEl.addEventListener('change', (e) => {
            typeFilter = e.target.value;
            renderAdverts();
        });
    }
    
    const purchaseFilterEl = document.getElementById('purchaseFilter');
    if (purchaseFilterEl) {
        purchaseFilterEl.addEventListener('change', (e) => {
            purchaseFilter = e.target.value;
            renderAdverts();
        });
    }
    
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchQuery = '';
            statusFilter = 'all';
            typeFilter = 'all';
            purchaseFilter = 'all';
            
            if (searchInput) searchInput.value = '';
            if (statusFilterEl) statusFilterEl.value = 'all';
            if (typeFilterEl) typeFilterEl.value = 'all';
            if (purchaseFilterEl) purchaseFilterEl.value = 'all';
            
            renderAdverts();
        });
    }
}

// ========== INITIALIZE ==========
document.getElementById('addAdvertBtn')?.addEventListener('click', () => {
    window.location.href = 'advert_management_add_edit.html';
});

if (checkAuth()) {
    setupFilters();
    fetchAdverts();
}