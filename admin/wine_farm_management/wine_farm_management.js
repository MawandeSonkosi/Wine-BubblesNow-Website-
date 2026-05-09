// Wine Farm Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allWineFarms = [];
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
        return '../../assets/images/default_farm.png';
    }
    if (imageUrl.startsWith('http') || imageUrl.startsWith('https')) {
        return imageUrl;
    }
    if (imageUrl.startsWith('assets/')) {
        return '../../' + imageUrl;
    }
    return imageUrl;
}

// ========== FETCH WINE FARMS ==========
async function fetchWineFarms() {
    const container = document.getElementById('wineFarmsContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading wine farms...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/winefarms/admin/all`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
            allWineFarms = data.data;
        } else if (Array.isArray(data)) {
            allWineFarms = data;
        } else if (data.wineFarms && Array.isArray(data.wineFarms)) {
            allWineFarms = data.wineFarms;
        } else {
            allWineFarms = [];
        }
        
        console.log(`✅ Loaded ${allWineFarms.length} wine farms`);
        renderWineFarms();
        
    } catch (error) {
        console.error('Error fetching wine farms:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading wine farms: ${error.message}</p><button class="btn-primary" onclick="fetchWineFarms()" style="margin-top:16px;">Retry</button></div>`;
    }
}

// ========== RENDER WINE FARMS ==========
function renderWineFarms() {
    const container = document.getElementById('wineFarmsContainer');
    
    let filtered = allWineFarms.filter(farm => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!farm.name.toLowerCase().includes(q) && !farm.location.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-landmark" style="font-size:48px; margin-bottom:16px;"></i><p>No wine farms found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="winefarms-grid">
            ${filtered.map(farm => `
                <div class="winefarm-card" onclick="showWineFarmActions('${farm._id || farm.id}')">
                    <div class="winefarm-image">
                        <img src="${getImageUrl(farm.imageUrl)}" alt="${escapeHtml(farm.name)}" onerror="this.src='../../assets/images/default_farm.png'">
                        ${farm.videoUrl ? '<div class="video-badge"><i class="fas fa-video"></i> Video</div>' : ''}
                        <div class="status-badge ${farm.isActive ? 'status-active' : 'status-inactive'}">
                            ${farm.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </div>
                    </div>
                    <div class="winefarm-info">
                        <div class="winefarm-name">${escapeHtml(farm.name)}</div>
                        <div class="winefarm-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(farm.location)}</div>
                        <div class="winefarm-description">${escapeHtml(farm.description?.substring(0, 80) || '')}${farm.description?.length > 80 ? '...' : ''}</div>
                        <div class="winefarm-contact">
                            ${farm.phoneNumber ? `<span><i class="fas fa-phone"></i> ${escapeHtml(farm.phoneNumber)}</span>` : ''}
                            ${farm.email ? `<span><i class="fas fa-envelope"></i> ${escapeHtml(farm.email)}</span>` : ''}
                        </div>
                        <div class="winefarm-actions" onclick="event.stopPropagation()">
                            <button class="icon-btn" onclick="editWineFarm('${farm._id || farm.id}')" title="Edit"><i class="fas fa-edit"></i></button>
                            <button class="icon-btn" onclick="deleteWineFarmPrompt('${farm._id || farm.id}', '${escapeHtml(farm.name)}')" title="Delete" style="color:#d32f2f;"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = gridHtml;
}

// ========== WINE FARM ACTIONS ==========
function showWineFarmActions(farmId) {
    const farm = allWineFarms.find(f => (f._id === farmId || f.id == farmId));
    if (!farm) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="wineFarmActionsModal">
            <div class="modal-content">
                <h3><i class="fas fa-landmark"></i> ${escapeHtml(farm.name)}</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Location:</strong> ${escapeHtml(farm.location)}</p>
                    <p><strong>Status:</strong> ${farm.isActive ? 'Active' : 'Inactive'}</p>
                    ${farm.phoneNumber ? `<p><strong>Phone:</strong> ${escapeHtml(farm.phoneNumber)}</p>` : ''}
                    ${farm.email ? `<p><strong>Email:</strong> ${escapeHtml(farm.email)}</p>` : ''}
                    ${farm.videoUrl ? `<p><strong>Video:</strong> <a href="${farm.videoUrl}" target="_blank">Watch</a></p>` : ''}
                </div>
                <div style="display: flex; gap: 12px; flex-direction: column;">
                    <button class="btn-primary" onclick="editWineFarm('${farm._id || farm.id}')" style="width:100%;"><i class="fas fa-edit"></i> Edit Wine Farm</button>
                    <button class="btn-primary" onclick="deleteWineFarmPrompt('${farm._id || farm.id}', '${escapeHtml(farm.name)}')" style="width:100%; background:#d32f2f;"><i class="fas fa-trash-alt"></i> Delete Wine Farm</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px; border-radius:40px; cursor:pointer; width:100%;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('wineFarmActionsModal');
    if (modal) modal.remove();
}

window.editWineFarm = function(farmId) {
    closeModal();
    window.location.href = `wine_farm_add_edit_screen.html?id=${farmId}`;
};

window.deleteWineFarmPrompt = function(farmId, farmName) {
    closeModal();
    if (confirm(`⚠️ Permanently delete "${farmName}"?\n\nThis action cannot be undone.`)) {
        deleteWineFarm(farmId);
    }
};

async function deleteWineFarm(farmId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/winefarms/${farmId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Wine farm deleted successfully', 'success');
        fetchWineFarms();
    } catch (error) {
        showToast('Failed to delete wine farm', 'error');
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
    renderWineFarms();
});

document.getElementById('addWineFarmBtn')?.addEventListener('click', () => {
    window.location.href = 'wine_farm_add_edit_screen.html';
});

if (checkAuth()) {
    fetchWineFarms();
}