// Wine Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allWines = [];
let searchQuery = '';
let currentFilter = 'all';

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

// Helper function to get correct image URL
function getImageUrl(imageUrl) {
    if (!imageUrl) {
        return '../../assets/wines/default_wine.png';
    }
    // If it's already a full URL or starts with http, use as is
    if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
        return imageUrl;
    }
    // If it starts with 'assets/', remove the 'assets/' prefix and add '../../assets/'
    if (imageUrl.startsWith('assets/')) {
        return '../../' + imageUrl;
    }
    // Otherwise, assume it's in assets/wines/
    return '../../assets/wines/' + imageUrl;
}

// ========== FETCH WINES ==========
async function fetchWines() {
    const container = document.getElementById('winesContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading wines...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines?all=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allWines = data;
        } else if (data.wines && Array.isArray(data.wines)) {
            allWines = data.wines;
        } else if (data.data && Array.isArray(data.data)) {
            allWines = data.data;
        } else {
            allWines = [];
        }
        
        console.log(`✅ Loaded ${allWines.length} wines`);
        renderWines();
        
    } catch (error) {
        console.error('Error fetching wines:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading wines: ${error.message}</p><button class="btn-primary" onclick="fetchWines()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER WINES ==========
function renderWines() {
    const container = document.getElementById('winesContainer');
    
    let filtered = allWines.filter(wine => {
        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!wine.name.toLowerCase().includes(q) && !wine.type.toLowerCase().includes(q)) {
                return false;
            }
        }
        
        // Category/type filter
        if (currentFilter !== 'all' && currentFilter !== 'All') {
            if (wine.type !== currentFilter) return false;
        }
        
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-wine-bottle" style="font-size:48px; margin-bottom:16px;"></i><p>No wines found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    container.innerHTML = filtered.map(wine => `
        <div class="wine-card" onclick="showWineActions(${wine.id})">
            <div class="wine-image">
                <img src="${getImageUrl(wine.imageUrl)}" alt="${escapeHtml(wine.name)}" onerror="this.src='../../assets/wines/default_wine.png'">
                <div class="wine-badges">
                    ${wine.isFeatured ? '<span class="wine-badge badge-featured">FEATURED</span>' : ''}
                    ${wine.isGifting ? '<span class="wine-badge badge-gift">GIFT</span>' : ''}
                    ${wine.isEvent ? '<span class="wine-badge badge-event">EVENT</span>' : ''}
                    ${wine.isCase ? '<span class="wine-badge badge-case">CASE</span>' : ''}
                </div>
                <div class="${getStockClass(wine.stockCount)}">${getStockText(wine.stockCount)}</div>
            </div>
            <div class="wine-info">
                <div class="wine-name">${escapeHtml(wine.name)}</div>
                <div class="wine-type">${escapeHtml(wine.type)}</div>
                <div class="wine-description">${escapeHtml(wine.description?.substring(0, 80) || '')}${wine.description?.length > 80 ? '...' : ''}</div>
                <div class="wine-price">R${(wine.price || 0).toFixed(2)}</div>
                <div class="wine-actions" onclick="event.stopPropagation()">
                    <button class="icon-btn" onclick="editWine(${wine.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="icon-btn" onclick="deleteWinePrompt(${wine.id}, '${escapeHtml(wine.name)}')" title="Delete" style="color:#d32f2f;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}

function getStockClass(stockCount) {
    if (stockCount > 10) return 'stock-badge stock-in';
    if (stockCount > 0) return 'stock-badge stock-low';
    return 'stock-badge stock-out';
}

function getStockText(stockCount) {
    if (stockCount > 10) return `${stockCount} left`;
    if (stockCount > 0) return `Only ${stockCount} left`;
    return 'OUT OF STOCK';
}

// ========== WINE ACTIONS ==========
function showWineActions(wineId) {
    const wine = allWines.find(w => w.id == wineId);
    if (!wine) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="wineActionsModal">
            <div class="modal-content">
                <h3><i class="fas fa-wine-bottle"></i> ${escapeHtml(wine.name)}</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Type:</strong> ${escapeHtml(wine.type)}</p>
                    <p><strong>Price:</strong> R${(wine.price || 0).toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${wine.stockCount} units</p>
                    <p><strong>Status:</strong> ${wine.isActive ? 'Active' : 'Inactive'}</p>
                </div>
                <div style="display: flex; gap: 12px; flex-direction: column;">
                    <button class="btn-primary" onclick="editWine(${wineId})" style="width:100%;"><i class="fas fa-edit"></i> Edit Wine</button>
                    <button class="btn-primary" onclick="deleteWinePrompt(${wineId}, '${escapeHtml(wine.name)}')" style="width:100%; background:#d32f2f;"><i class="fas fa-trash-alt"></i> Delete Wine</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px; border-radius:40px; cursor:pointer; width:100%;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('wineActionsModal');
    if (modal) modal.remove();
}

window.editWine = function(wineId) {
    closeModal();
    window.location.href = `wine_add_edit_screen.html?id=${wineId}`;
};

window.deleteWinePrompt = function(wineId, wineName) {
    closeModal();
    if (confirm(`⚠️ Permanently delete "${wineName}"?\n\nThis action cannot be undone.`)) {
        deleteWine(wineId);
    }
};

async function deleteWine(wineId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines/${wineId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Wine deleted successfully', 'success');
        fetchWines();
    } catch (error) {
        showToast('Failed to delete wine', 'error');
    }
}

// ========== FILTER FUNCTIONS ==========
function showFilterModal() {
    const filterTypes = ['All', 'Red Wine', 'White Wine', 'Champagne'];
    
    const modalHtml = `
        <div class="modal-overlay" id="filterModal">
            <div class="modal-content">
                <h3><i class="fas fa-filter"></i> Filter by Type</h3>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${filterTypes.map(type => `
                        <button class="filter-option" data-filter="${type}" style="padding: 12px; text-align: left; background: none; border: none; border-radius: 8px; cursor: pointer; font-family: 'Montserrat', sans-serif; ${currentFilter === type ? 'background: #6b0d2b; color: white;' : 'color: #1b1b1b;'}" onclick="selectFilter('${type}')">${type}</button>
                    `).join('')}
                </div>
                <button onclick="closeFilterModal()" style="margin-top: 16px; padding: 12px; background: #f0f0f0; border: none; border-radius: 40px; cursor: pointer; width: 100%;">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.selectFilter = function(filterType) {
    currentFilter = filterType === 'All' ? 'all' : filterType;
    closeFilterModal();
    renderWines();
};

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) modal.remove();
}

// ========== HELPER FUNCTIONS ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#2e7d32' : '#d32f2f'}; color:white; padding:12px 24px; border-radius:40px; z-index:10002; font-family:Montserrat; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.15);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== INITIALIZE ==========
document.getElementById('searchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderWines();
});

document.getElementById('filterBtn')?.addEventListener('click', showFilterModal);
document.getElementById('addWineBtn')?.addEventListener('click', () => {
    window.location.href = 'wine_add_edit_screen.html';
});

if (checkAuth()) {
    fetchWines();
}