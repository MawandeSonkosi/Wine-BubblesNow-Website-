// Supplier Management JavaScript - Matches Flutter functionality

const API_BASE = window.location.origin;
let allSuppliers = [];
let allWines = [];
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

// ========== FETCH WINES ==========
async function fetchWines() {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/wines?all=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                allWines = data;
            } else if (data.wines && Array.isArray(data.wines)) {
                allWines = data.wines;
            } else if (data.data && Array.isArray(data.data)) {
                allWines = data.data;
            }
            console.log(`✅ Loaded ${allWines.length} wines`);
        }
    } catch (error) {
        console.error('Error fetching wines:', error);
    }
}

// ========== FETCH SUPPLIERS ==========
async function fetchSuppliers() {
    const container = document.getElementById('suppliersContainer');
    container.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>Loading suppliers...</p></div>';
    
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allSuppliers = data;
        } else if (data.suppliers && Array.isArray(data.suppliers)) {
            allSuppliers = data.suppliers;
        } else if (data.data && Array.isArray(data.data)) {
            allSuppliers = data.data;
        } else {
            allSuppliers = [];
        }
        
        console.log(`✅ Loaded ${allSuppliers.length} suppliers`);
        renderSuppliers();
        renderStats();
        
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle" style="font-size:48px; margin-bottom:16px; color:#d32f2f;"></i><p>Error loading suppliers: ${error.message}</p><button class="btn-primary" onclick="fetchSuppliers()" style="margin-top:16px;">Retry</button></div>`;
    }
}

function renderStats() {
    const container = document.getElementById('statsContainer');
    const total = allSuppliers.length;
    const active = allSuppliers.filter(s => s.status === 'active').length;
    const verified = allSuppliers.filter(s => s.isVerified).length;
    const totalWines = allSuppliers.reduce((sum, s) => sum + (s.wineIds?.length || 0), 0);
    
    container.innerHTML = `
        <div class="stat-box"><i class="fas fa-truck"></i><div class="stat-box-info"><div class="stat-box-value">${total}</div><div class="stat-box-label">Total Suppliers</div></div></div>
        <div class="stat-box"><i class="fas fa-check-circle" style="color:#2e7d32;"></i><div class="stat-box-info"><div class="stat-box-value">${active}</div><div class="stat-box-label">Active</div></div></div>
        <div class="stat-box"><i class="fas fa-verified" style="color:#2196f3;"></i><div class="stat-box-info"><div class="stat-box-value">${verified}</div><div class="stat-box-label">Verified</div></div></div>
        <div class="stat-box"><i class="fas fa-wine-bottle"></i><div class="stat-box-info"><div class="stat-box-value">${totalWines}</div><div class="stat-box-label">Total Wines</div></div></div>
    `;
}

function getWineNames(wineIds) {
    if (!wineIds || wineIds.length === 0) return [];
    return wineIds.map(id => {
        const wine = allWines.find(w => w.id == id);
        return wine ? wine.name : null;
    }).filter(name => name);
}

function getStatusClass(status) {
    switch(status) {
        case 'active': return 'active';
        case 'inactive': return 'inactive';
        case 'pending': return 'pending';
        default: return 'inactive';
    }
}

function renderSuppliers() {
    const container = document.getElementById('suppliersContainer');
    
    let filtered = allSuppliers.filter(supplier => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!supplier.name.toLowerCase().includes(q) && !supplier.email.toLowerCase().includes(q)) {
                return false;
            }
        }
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-truck" style="font-size:48px; margin-bottom:16px;"></i><p>No suppliers found${searchQuery ? ' matching your search' : ''}</p></div>`;
        return;
    }
    
    const gridHtml = `
        <div class="suppliers-grid">
            ${filtered.map(supplier => {
                const wineNames = getWineNames(supplier.wineIds);
                const statusClass = getStatusClass(supplier.status);
                return `
                    <div class="supplier-card" onclick="showSupplierActions('${supplier.id}')">
                        <div class="supplier-header">
                            <span class="supplier-name">${escapeHtml(supplier.name)}</span>
                            <span class="status-badge ${statusClass}">${supplier.status.toUpperCase()}</span>
                        </div>
                        <div class="supplier-body">
                            <div class="supplier-contact">
                                <p><i class="fas fa-envelope"></i> ${escapeHtml(supplier.email)}</p>
                                <p><i class="fas fa-phone"></i> ${escapeHtml(supplier.phone)}</p>
                            </div>
                            <div>
                                <span class="wine-count"><i class="fas fa-wine-bottle"></i> ${supplier.wineIds?.length || 0} Wines</span>
                                ${supplier.isVerified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' : ''}
                            </div>
                            <div class="supplier-actions" onclick="event.stopPropagation()">
                                <button class="icon-btn" onclick="editSupplier('${supplier.id}')" title="Edit Supplier"><i class="fas fa-edit"></i> Edit</button>
                                <button class="icon-btn danger" onclick="deleteSupplierPrompt('${supplier.id}', '${escapeHtml(supplier.name)}')" title="Delete Supplier"><i class="fas fa-trash-alt"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    container.innerHTML = gridHtml;
}

// ========== SUPPLIER ACTIONS ==========
function showSupplierActions(supplierId) {
    const supplier = allSuppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    const modalHtml = `
        <div class="modal-overlay" id="supplierActionsModal">
            <div class="modal-content">
                <h3><i class="fas fa-truck"></i> ${escapeHtml(supplier.name)}</h3>
                <div style="margin-bottom: 20px;">
                    <p><strong>Email:</strong> ${escapeHtml(supplier.email)}</p>
                    <p><strong>Phone:</strong> ${escapeHtml(supplier.phone)}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${getStatusClass(supplier.status)}">${supplier.status.toUpperCase()}</span></p>
                    <p><strong>Verified:</strong> ${supplier.isVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Wines:</strong> ${supplier.wineIds?.length || 0} assigned</p>
                </div>
                <div style="display: flex; gap: 12px; flex-direction: column;">
                    <button class="btn-primary" onclick="editSupplier('${supplierId}')" style="width:100%;"><i class="fas fa-edit"></i> Edit Supplier</button>
                    <button class="btn-primary" onclick="deleteSupplierPrompt('${supplierId}', '${escapeHtml(supplier.name)}')" style="width:100%; background:#d32f2f;"><i class="fas fa-trash-alt"></i> Delete Supplier</button>
                    <button onclick="closeModal()" style="background:#f0f0f0; border:none; padding:12px; border-radius:40px; cursor:pointer; width:100%;">Cancel</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function closeModal() {
    const modal = document.getElementById('supplierActionsModal');
    if (modal) modal.remove();
}

window.editSupplier = function(supplierId) {
    closeModal();
    window.location.href = `supplier_management_add_edit.html?id=${supplierId}`;
};

window.deleteSupplierPrompt = function(supplierId, supplierName) {
    closeModal();
    if (confirm(`⚠️ Permanently delete "${supplierName}"?\n\nThis action cannot be undone.`)) {
        deleteSupplier(supplierId);
    }
};

async function deleteSupplier(supplierId) {
    try {
        const token = localStorage.getItem('wineBubbles_token');
        const response = await fetch(`${API_BASE}/api/suppliers/${supplierId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to delete');
        
        showToast('Supplier deleted successfully', 'success');
        fetchSuppliers();
    } catch (error) {
        showToast('Failed to delete supplier', 'error');
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
    renderSuppliers();
});

document.getElementById('addSupplierBtn')?.addEventListener('click', () => {
    window.location.href = 'supplier_management_add_edit.html';
});

if (checkAuth()) {
    fetchWines().then(() => fetchSuppliers());
}