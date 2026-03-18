const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = 'https://winebubblesnow-production.up.railway.app';

// Dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const allowedOrigins = [
  'https://www.wineandbubblesnow.co.za',
  'https://wineandbubblesnow.co.za',
  'https://app.wineandbubblesnow.co.za',
  'https://wine-bubblesnow-website.pages.dev',
  'http://localhost:3000',
  'capacitor://localhost',
  'ionic://localhost',
  'https://wine-bubblesnow-website-production.up.railway.app',
  'http://wine-bubblesnow-website-production.up.railway.app',
  'https://store.wineandbubblesnow.co.za',
  'http://store.wineandbubblesnow.co.za'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wine & Bubbles API Server',
    backend: BACKEND_URL,
    timestamp: new Date().toISOString()
  });
});

// Test backend connection
app.get('/api/test-backend', async (req, res) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        res.json({
            success: true,
            backend: data,
            status: response.status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Cannot connect to backend'
        });
    }
});

// ============ AUTH ENDPOINTS ============
// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', req.body.email);
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: req.body.email?.toLowerCase().trim(),
                password: req.body.password
            })
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Login proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('📝 Register attempt:', req.body.email);
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Register proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Verify email
app.post('/api/auth/verify-email', async (req, res) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

// Resend verification
app.post('/api/auth/resend-verification', async (req, res) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/auth/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to resend code' });
    }
});

// Forgot password - send OTP
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        console.log('📧 Forgot password request:', req.body.email);
        const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Forgot password proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        console.log('🔐 Verify OTP request:', req.body.email);
        const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Verify OTP proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
    try {
        console.log('🔄 Reset password request');
        const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Reset password proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// ============ PROFILE ENDPOINTS ============
// Get current user profile
app.get('/api/profile/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Get user profile proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Update user profile
app.put('/api/profile/update', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/update`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Update user profile proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Change password
app.post('/api/profile/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Change password proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Update phone number
app.put('/api/profile/update-phone', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/update-phone`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Update phone proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Get user bookings
app.get('/api/profile/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/bookings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Get bookings proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// Delete user account
app.delete('/api/profile/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const response = await fetch(`${BACKEND_URL}/api/profile/delete-account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('🚨 Delete account proxy error:', error);
        res.status(500).json({ success: false, message: 'Proxy server error', error: error.message });
    }
});

// ============ ADVERTS ENDPOINTS ============
// Get active adverts by type
// Get active adverts by type - DEBUG VERSION
app.get('/api/adverts/active', async (req, res) => {
    try {
        console.log('🎪 ========== ADVERTS DEBUG ==========');
        console.log('🎪 Fetching active adverts via proxy');
        console.log('📡 Query params:', req.query);
        console.log('📡 Headers received:', req.headers);
        
        // Forward query parameters
        const queryParams = new URLSearchParams(req.query).toString();
        const backendUrl = queryParams ? 
            `${BACKEND_URL}/api/adverts/active?${queryParams}` : 
            `${BACKEND_URL}/api/adverts/active`;
        
        console.log('🎪 Backend URL:', backendUrl);
        
        console.log('🎪 Making fetch request to backend...');
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': 'https://www.wineandbubblesnow.co.za'
            },
            timeout: 10000
        });
        
        console.log('🎪 Backend response status:', response.status);
        console.log('🎪 Backend response headers:', response.headers);
        
        if (!response.ok) {
            console.error(`❌ Backend responded with ${response.status}: ${response.statusText}`);
            
            // Try to get error response body
            const errorText = await response.text();
            console.error('❌ Error response body:', errorText);
            
            // Return actual error, not fallback
            return res.status(response.status).json({ 
                error: `Backend error: ${response.status}`,
                message: errorText 
            });
        }
        
        const data = await response.json();
        console.log(`🎪 Adverts response success! Got ${Array.isArray(data) ? data.length : 0} items`);
        
        if (Array.isArray(data) && data.length > 0) {
            console.log('🎪 First advert:', JSON.stringify(data[0], null, 2));
            console.log('🎪 First advert imageUrl:', data[0].imageUrl);
            console.log('🎪 First advert type:', data[0].type);
            console.log('🎪 First advert isActive:', data[0].isActive);
        } else {
            console.log('🎪 No adverts found in response');
        }
        
        console.log('🎪 ========== END ADVERTS DEBUG ==========');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 ========== ADVERTS ERROR ==========');
        console.error('🚨 Adverts proxy error:', error.message);
        console.error('🚨 Error name:', error.name);
        console.error('🚨 Error stack:', error.stack);
        console.error('🚨 ========== END ERROR ==========');
        
        // Return error instead of fallback
        res.status(500).json({ 
            error: 'Proxy server error', 
            message: error.message,
            type: error.name 
        });
    }
});

// Get single advert by ID
app.get('/api/adverts/:id', async (req, res) => {
    try {
        console.log('🎪 Fetching advert by ID:', req.params.id);
        
        const response = await fetch(`${BACKEND_URL}/api/adverts/${req.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Advert by ID proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch advert',
            error: error.message
        });
    }
});

// ============ ADD-ONS ENDPOINTS ============
// Get all add-ons
app.get('/api/addons', async (req, res) => {
    try {
        console.log('📦 Fetching add-ons from backend:', `${BACKEND_URL}/api/addons`);
        
        const response = await fetch(`${BACKEND_URL}/api/addons`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📤 Add-ons response: ${response.status} (${Array.isArray(data) ? data.length : 0} items)`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Add-ons proxy error:', error.message);
        
        // Return fallback data if backend fails
        const fallbackAddons = [
            {
                id: 1,
                name: 'Premium Wine Selection',
                price: 500.00,
                category: 'Wine',
                imageUrl: '/assets/addons/premium-wine.jpg',
                description: 'Premium selection of curated wines'
            },
            {
                id: 2,
                name: 'Champagne Upgrade',
                price: 800.00,
                category: 'Champagne',
                imageUrl: '/assets/addons/champagne.jpg',
                description: 'Upgrade to premium champagne'
            }
        ];
        
        console.log('⚠️ Using fallback add-ons data');
        res.json(fallbackAddons);
    }
});

// Get add-ons by category
app.get('/api/addons/category/:category', async (req, res) => {
    try {
        console.log('📦 Fetching add-ons by category:', req.params.category);
        
        const response = await fetch(`${BACKEND_URL}/api/addons/category/${req.params.category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log(`📤 Add-ons by category response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Add-ons by category proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch add-ons by category',
            error: error.message
        });
    }
});

// ============ WINE ENDPOINTS ============
// Get all wines
app.get('/api/wines', async (req, res) => {
    try {
        console.log('🍷 Fetching all wines');
        
        const queryParams = new URLSearchParams(req.query).toString();
        const backendUrl = queryParams ? 
            `${BACKEND_URL}/api/wines?${queryParams}` : 
            `${BACKEND_URL}/api/wines`;
        
        console.log('🍷 Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`🍷 All wines response: ${response.status} (${Array.isArray(data) ? data.length : 'object'})`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 All wines proxy error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wines',
            error: error.message
        });
    }
});

// Get featured wines - FIXED: Proper endpoint
app.get('/api/wines/featured/featured', async (req, res) => {
    try {
        console.log('🌟 Fetching featured wines via proxy');
        const backendUrl = `${BACKEND_URL}/api/wines/featured/featured`;
        console.log('📡 Backend URL:', backendUrl);
        
        const response = await fetch(backendUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            console.error(`❌ Backend responded with ${response.status}`);
            
            // Try fallback
            const fallbackUrl = `${BACKEND_URL}/api/wines?featured=true&all=true`;
            console.log('🔄 Trying fallback:', fallbackUrl);
            
            const fallbackResponse = await fetch(fallbackUrl);
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                res.json(data);
                return;
            }
            
            throw new Error(`Backend responded with ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`📤 Featured wines response: ${response.status} (${Array.isArray(data) ? data.length : 0} items)`);
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Featured wines proxy error:', error);
        
        // Ultimate fallback
        console.log('⚠️ Using fallback featured wines');
        const fallbackWines = [
            {
                id: 1,
                name: 'The African Diamond Grenache Noir',
                type: 'Red Wine',
                price: 299.99,
                imageUrl: 'assets/wines/breakfast/Noir.png',
                bannerImageUrl: 'assets/wines/breakfast/Noir.png',
                isFeatured: true
            },
            {
                id: 2,
                name: 'The African Diamond Grenache Blanc',
                type: 'White Wine',
                price: 299.99,
                imageUrl: 'assets/wines/breakfast/Blanc.png',
                bannerImageUrl: 'assets/wines/breakfast/Blanc.png',
                isFeatured: true
            },
            {
                id: 3,
                name: 'YBY Crystal Dry',
                type: 'Champagne',
                price: 499.99,
                imageUrl: 'assets/wines/breakfast/YBY.png',
                bannerImageUrl: 'assets/wines/breakfast/YBY.png',
                isFeatured: true
            }
        ];
        res.json(fallbackWines);
    }
});

// Get single wine by ID
app.get('/api/wines/:id', async (req, res) => {
    try {
        console.log('🍷 Fetching wine by ID:', req.params.id);
        
        const response = await fetch(`${BACKEND_URL}/api/wines/${req.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`🍷 Wine by ID response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Wine by ID proxy error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wine',
            error: error.message
        });
    }
});

// Get wines by category
app.get('/api/wines/category/:category', async (req, res) => {
    try {
        console.log('🍷 Fetching wines by category:', req.params.category);
        
        const response = await fetch(`${BACKEND_URL}/api/wines/category/${req.params.category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log(`🍷 Wines by category response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Wines by category proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch wines by category',
            error: error.message
        });
    }
});

// Get gifting wines
app.get('/api/wines/gifting/gifting', async (req, res) => {
    try {
        console.log('🎁 Fetching gifting wines');
        
        const response = await fetch(`${BACKEND_URL}/api/wines/gifting/gifting`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log(`📤 Gifting wines response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Gifting wines proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gifting wines',
            error: error.message
        });
    }
});

// Get event wines
app.get('/api/wines/events/events', async (req, res) => {
    try {
        console.log('🎉 Fetching event wines');
        
        const response = await fetch(`${BACKEND_URL}/api/wines/events/events`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log(`📤 Event wines response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Event wines proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event wines',
            error: error.message
        });
    }
});

// ============ BOOKINGS ENDPOINTS ============
// Create booking
app.post('/api/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📋 Creating booking via proxy');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/bookings`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log(`📤 Booking creation response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Booking creation proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
});

// Get user bookings
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📅 Getting user bookings for user:', req.params.userId);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/bookings/user/${req.params.userId}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`📤 User bookings response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 User bookings proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user bookings',
            error: error.message
        });
    }
});

// Get all bookings (admin)
app.get('/api/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📊 Getting all bookings via proxy');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/bookings`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`📤 All bookings response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 All bookings proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
});

// Get single booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📄 Getting booking by ID:', req.params.id);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/bookings/${req.params.id}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`📤 Booking by ID response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Booking by ID proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
});

// ============ DELIVERY ENDPOINTS ============
// Create delivery
app.post('/api/deliveries', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('🚚 Creating delivery via proxy');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/deliveries`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log(`📤 Delivery creation response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Delivery creation proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create delivery',
            error: error.message
        });
    }
});

// Get user deliveries
app.get('/api/deliveries/user/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📦 Getting user deliveries for user:', req.params.userId);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/deliveries/user/${req.params.userId}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`📤 User deliveries response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 User deliveries proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user deliveries',
            error: error.message
        });
    }
});

// Get single delivery by ID
app.get('/api/deliveries/:id', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📄 Getting delivery by ID:', req.params.id);
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/deliveries/${req.params.id}`, {
            method: 'GET',
            headers: headers
        });
        
        const data = await response.json();
        console.log(`📤 Delivery by ID response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Delivery by ID proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch delivery',
            error: error.message
        });
    }
});

// ============ EMAIL ENDPOINTS ============
// Send delivery confirmation email
app.post('/api/email/send-delivery-confirmation', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📧 Sending delivery confirmation email via proxy');
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BACKEND_URL}/api/email/send-delivery-confirmation-email`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log(`📤 Delivery email response: ${response.status}`);
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Delivery email proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send delivery confirmation email',
            error: error.message
        });
    }
});

// ============ TEST ENDPOINTS ============
// Test add-ons endpoint
app.get('/api/test/addons', async (req, res) => {
    try {
        console.log('🧪 Testing add-ons connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/addons`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            addonsCount: Array.isArray(data) ? data.length : 0,
            sampleAddon: Array.isArray(data) && data.length > 0 ? data[0] : null
        });
        
    } catch (error) {
        console.error('🧪 Add-ons test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend add-ons endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Test featured wines endpoint
app.get('/api/test/featured-wines', async (req, res) => {
    try {
        console.log('🧪 Testing featured wines connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/wines/featured/featured`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            winesCount: Array.isArray(data) ? data.length : 0,
            sampleWine: Array.isArray(data) && data.length > 0 ? data[0] : null
        });
        
    } catch (error) {
        console.error('🧪 Featured wines test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend featured wines endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Test wines endpoint
app.get('/api/test/wines', async (req, res) => {
    try {
        console.log('🧪 Testing wines connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/wines?all=true`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            winesCount: Array.isArray(data) ? data.length : 0,
            sampleWine: Array.isArray(data) && data.length > 0 ? data[0] : null
        });
        
    } catch (error) {
        console.error('🧪 Wines test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend wines endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Test bookings endpoint
app.get('/api/test/bookings', async (req, res) => {
    try {
        console.log('🧪 Testing bookings connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/bookings`);
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            message: 'Backend bookings endpoint is reachable'
        });
        
    } catch (error) {
        console.error('🧪 Bookings test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend bookings endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Test deliveries endpoint
app.get('/api/test/deliveries', async (req, res) => {
    try {
        console.log('🧪 Testing deliveries connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/deliveries/health`);
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            message: 'Backend deliveries endpoint is reachable'
        });
        
    } catch (error) {
        console.error('🧪 Deliveries test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend deliveries endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Test adverts endpoint
app.get('/api/test/adverts', async (req, res) => {
    try {
        console.log('🧪 Testing adverts connection to backend');
        
        const response = await fetch(`${BACKEND_URL}/api/adverts/active?type=homepage`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            backendUrl: BACKEND_URL,
            status: response.status,
            advertsCount: Array.isArray(data) ? data.length : 0,
            sampleAdvert: Array.isArray(data) && data.length > 0 ? data[0] : null
        });
        
    } catch (error) {
        console.error('🧪 Adverts test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Cannot connect to backend adverts endpoint',
            error: error.message,
            backendUrl: BACKEND_URL
        });
    }
});

// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.send();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 Wine & Bubbles API Server
📍 Port: ${PORT}
📡 Backend: ${BACKEND_URL}
🔗 Allowed Origins:
   - https://www.wineandbubblesnow.co.za
   - https://app.wineandbubblesnow.co.za
   - https://wine-bubblesnow-website.pages.dev
   - https://store.wineandbubblesnow.co.za
✅ Ready at: http://localhost:${PORT}
    `);
    console.log('📂 Available Endpoints:');
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Featured Wines: http://localhost:${PORT}/api/wines/featured/featured`);
    console.log(`   Adverts: http://localhost:${PORT}/api/adverts/active?type=homepage`);
});