// Marketing Management JavaScript

const API_BASE = window.location.origin;
let allCompanies = [];
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

// ========== FETCH MARKETING COMPANIES ==========
async function fetchMarketingCompanies() {
    const container = document.getElementById('marketingContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading marketing companies...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        console.log('📦 Marketing response:', data);
        
        if (data.success && Array.isArray(data.data)) {
            allCompanies = data.data;
        } else if (Array.isArray(data)) {
            allCompanies = data;
        } else if (data.companies && Array.isArray(data.companies)) {
            allCompanies = data.companies;
        } else {
            allCompanies = [];
        }
        
        console.log(`✅ Loaded ${allCompanies.length} marketing companies`);
        renderMarketingCompanies();
        renderStats();
        
    } catch (error) {
        console.error('Error fetching marketing companies:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading marketing companies: ${error.message}</p><button class="btn-primary" onclick="fetchMarketingCompanies()" style="margin-top:16px;">Retry</button></div>`;
    }
}

function renderStats() {
    const container = document.getElementById('statsContainer');
    const total = allCompanies.length;
    const active = allCompanies.filter(c => c.isActive === true).length;
    const totalAdverts = allCompanies.reduce((sum, c) => sum + (c.advertIds?.length || 0), 0);
    
    container.innerHTML = `
        <div class="stat-box"><i class="fas fa-chart-line"></i><div class="stat-box-info"><div class="stat-box-value">${total}</div><div class="stat-box-label">Total Companies</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle" style="color:#2e7d32;"></i><div class="stat-box-info"><div class="stat-box-value">${active}</div><div class="stat-box-label">Active</div></div></div>
        <div class="stat-box"><i class="fas fa-ad" style="color:#2196f3;"></i><div class="stat-box-info"><div class="stat-box-value">${totalAdverts}</div><div class="stat-box-label">Total Adverts</div></div></div>
    `;
}

function getStatusClass(isActive) {
    return isActive ? 'active' : 'inactive';
}

function renderMarketingCompanies() {
    const container = document.getElementById('marketingContainer');
    
    let filtered = allCompanies.filter(company => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!company.companyName.toLowerCase().includes(q) && !company.email.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-line" style="font-size:48px; margin-bottom:16px;"></i><p>No marketing companies found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="marketing-grid">
            ${filtered.map(company => {
                const statusClass = getStatusClass(company.isActive);
                return `
                    <div class="marketing-card" onclick="showMarketingActions('${company.id}')">
                        <div class="marketing-header">
                            <span class="company-name">${escapeHtml(company.companyName)}</span>
                            <span class="status-badge ${statusClass}">${company.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                        <div class="marketing-body">
                            <div class="company-contact">
                                <p><i class="fas fa-envelope"></i> ${escapeHtml(company.email)}</p>
                                ${company.phoneNumber ? `<p><i class="fas fa-phone"></i> ${escapeHtml(company.phoneNumber)}</p>` : ''}
                                ${company.contactPerson ? `<p><i class="fas fa-user"></i> ${escapeHtml(company.contactPerson)}</p>` : ''}
                            </div>
                            <div>
                                <span class="advert-count"><i class="fas fa-ad"></i> ${company.advertIds?.length || 0} Adverts</span>
                            </div>
                            <div class="marketing-actions" onclick="event.stopPropagation()">
                                <button class="icon-btn" onclick="editMarketing('${company.id}')" title="Edit"><i class="fas fa-edit"></i> Edit</button>
                                <button class="icon-btn danger" onclick="deleteMarketingPrompt('${company.id}', '${escapeHtml(company.companyName)}')" title="Delete"><i class="fas fa-trash-alt"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = gridHtml;
}

// ========== MARKETING ACTIONS ==========
function showMarketingActions(marketingId) {
    const marketing = allMarketing.find(m => m.id === marketingId || m._id === marketingId);
    if (!marketing) return;
    
    // Get the correct ID
    const companyId = marketing.id || marketing._id;
    
    const modalHtml = `
        <div class="modal-overlay" id="marketingActionsModal">
            <div class="modal-content">
                <h3><i class="fas fa-chart-line"></i> ${escapeHtml(marketing.companyName)}</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Email:</strong> ${escapeHtml(marketing.email)}</p>
                    ${marketing.phoneNumber ? `<p><strong>Phone:</strong> ${escapeHtml(marketing.phoneNumber)}</p>` : ''}
                    ${marketing.contactPerson ? `<p><strong>Contact:</strong> ${escapeHtml(marketing.contactPerson)}</p>` : ''}
                    <p><strong>Status:</strong> ${marketing.isActive ? 'Active' : 'Inactive'}</p>
                    <p><strong>Adverts:</strong> ${marketing.advertIds?.length || 0} assigned</p>
                </div>
                <div style="display: flex; gap: 12px; flex-direction: column;">
                    <button class="btn-primary" onclick="editMarketing('${companyId}')" style="width:100%;"><i class="fas fa-edit"></i> Edit Company</button>
                    <button class="btn-primary" onclick="viewMarketingDetails('${companyId}')" style="width:100%;"><i class="fas fa-eye"></i> View Details</button>
                    <button class="btn-primary" onclick="deleteMarketingPrompt('${companyId}', '${escapeHtml(marketing.companyName)}')" style="width:100%; background:#d32f2f;"><i class="fas fa-trash-alt"></i> Delete Company</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px; border-radius:40px; cursor:pointer; width:100%;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('marketingActionsModal');
    if (modal) modal.remove();
}

window.editMarketing = function(companyId) {
    closeModal();
    // Make sure we're passing a valid ID
    if (companyId && companyId !== 'undefined' && companyId !== 'null') {
        window.location.href = `marketing_management_add_edit.html?id=${companyId}`;
    } else {
        console.error('Invalid company ID:', companyId);
        showToast('Invalid company ID', 'error');
    }
};

window.viewMarketingDetails = function(companyId) {
    closeModal();
    window.location.href = `marketing_management_detail.html?id=${companyId}`;
};

window.deleteMarketingPrompt = function(companyId, companyName) {
    closeModal();
    if (confirm(`⚠️ Permanently delete "${companyName}"?\n\nThis action cannot be undone.`)) {
        deleteMarketing(companyId);
    }
};

async function deleteMarketing(companyId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/marketing/${companyId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Marketing company deleted successfully', 'success');
        fetchMarketingCompanies();
    } catch (error) {
        showToast('Failed to delete marketing company', 'error');
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
    renderMarketingCompanies();
});

document.getElementById('addMarketingBtn')?.addEventListener('click', () => {
    window.location.href = 'marketing_management_add_edit.html';
});

if (checkAuth()) {
    fetchMarketingCompanies();
}