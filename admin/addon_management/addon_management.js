// Add-On Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allAddOns = [];
let searchQuery = '';

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
        return '../../assets/images/default_addon.png';
    }
    if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
        return imageUrl;
    }
    if (imageUrl.startsWith('assets/')) {
        return '../../' + imageUrl;
    }
    return '../../assets/images/' + imageUrl;
}

// ========== FETCH ADD-ONS ==========
async function fetchAddOns() {
    const container = document.getElementById('addonsContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading add-ons...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/addons`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allAddOns = data;
        } else if (data.addOns && Array.isArray(data.addOns)) {
            allAddOns = data.addOns;
        } else if (data.data && Array.isArray(data.data)) {
            allAddOns = data.data;
        } else {
            allAddOns = [];
        }
        
        console.log(`✅ Loaded ${allAddOns.length} add-ons`);
        renderAddOns();
        
    } catch (error) {
        console.error('Error fetching add-ons:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading add-ons: ${error.message}</p><button class="btn-primary" onclick="fetchAddOns()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER ADD-ONS ==========
function renderAddOns() {
    const container = document.getElementById('addonsContainer');
    
    let filtered = allAddOns.filter(addon => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!addon.name.toLowerCase().includes(q) && !addon.category.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-gift" style="font-size:48px; margin-bottom:16px;"></i><p>No add-ons found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="addons-grid">
            ${filtered.map(addon => `
                <div class="addon-card" onclick="showAddOnActions(${addon.id})">
                    <div class="addon-image">
                        <img src="${getImageUrl(addon.imageUrl)}" alt="${escapeHtml(addon.name)}" onerror="this.src='../../assets/images/default_addon.png'">
                        <div class="category-badge">${escapeHtml(addon.category).toUpperCase()}</div>
                    </div>
                    <div class="addon-info">
                        <div class="addon-name">${escapeHtml(addon.name)}</div>
                        <div class="addon-category">${escapeHtml(addon.category)}</div>
                        <div class="addon-description">${escapeHtml(addon.description?.substring(0, 80) || 'No description')}${addon.description?.length > 80 ? '...' : ''}</div>
                        <div class="addon-price">R${(addon.price || 0).toFixed(2)}</div>
                        <div class="addon-actions" onclick="event.stopPropagation()">
                            <button class="icon-btn" onclick="editAddOn(${addon.id})" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="icon-btn" onclick="deleteAddOnPrompt(${addon.id}, '${escapeHtml(addon.name)}')" title="Delete" style="color:#d32f2f;"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = gridHtml;
}

// ========== ADD-ON ACTIONS ==========
function showAddOnActions(addonId) {
    const addon = allAddOns.find(a => a.id == addonId);
    if (!addon) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="addonActionsModal">
            <div class="modal-content">
                <h3><i class="fas fa-gift"></i> ${escapeHtml(addon.name)}</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Category:</strong> ${escapeHtml(addon.category)}</p>
                    <p><strong>Price:</strong> R${(addon.price || 0).toFixed(2)}</p>
                    <p><strong>Description:</strong> ${escapeHtml(addon.description || 'No description')}</p>
                </div>
                <div style="display: flex; gap: 12px; flex-direction: column;">
                    <button class="btn-primary" onclick="editAddOn(${addonId})" style="width:100%;"><i class="fas fa-edit"></i> Edit Add-On</button>
                    <button class="btn-primary" onclick="deleteAddOnPrompt(${addonId}, '${escapeHtml(addon.name)}')" style="width:100%; background:#d32f2f;"><i class="fas fa-trash-alt"></i> Delete Add-On</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px; border-radius:40px; cursor:pointer; width:100%;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('addonActionsModal');
    if (modal) modal.remove();
}

window.editAddOn = function(addonId) {
    closeModal();
    window.location.href = `addon_add_edit_screen.html?id=${addonId}`;
};

window.deleteAddOnPrompt = function(addonId, addonName) {
    closeModal();
    if (confirm(`⚠️ Permanently delete "${addonName}"?\n\nThis action cannot be undone.`)) {
        deleteAddOn(addonId);
    }
};

async function deleteAddOn(addonId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/addons/${addonId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Add-on deleted successfully', 'success');
        fetchAddOns();
    } catch (error) {
        showToast('Failed to delete add-on', 'error');
    }
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
    renderAddOns();
});

document.getElementById('addAddOnBtn')?.addEventListener('click', () => {
    window.location.href = 'addon_add_edit_screen.html';
});

if (checkAuth()) {
    fetchAddOns();
}