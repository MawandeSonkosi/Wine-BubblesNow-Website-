const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const BACKEND_URL = 'https://www.wineandbubblesnow.co.za';

// Dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const allowedOrigins = [
  'https://www.wineandbubblesnow.co.za',
  'https://wineandbubblesnow.co.za',
  'http://localhost:3000',
  'capacitor://localhost',
  'ionic://localhost',
  // Add these exact domains:
  'https://wine-bubblesnow-website-production.up.railway.app',
  'http://wine-bubblesnow-website-production.up.railway.app',
 'https://store.wineandbubblesnow.co.za', // ADD THIS
  'http://store.wineandbubblesnow.co.za',
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
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

app.use(express.static(__dirname));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  console.log('🏠 Serving index.html for homepage');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Wine & Bubbles Website Server',
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
        console.log(`📤 Login response: ${response.status}`, data.message || '');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Login proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
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
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
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
        res.status(500).json({
            success: false,
            message: 'Failed to resend code'
        });
    }
});

// ============ PROFILE ENDPOINTS ============

// Get current user profile
app.get('/api/profile/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('👤 Get current user profile request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Update user profile
app.put('/api/profile/update', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('✏️ Update user profile request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Change password
app.post('/api/profile/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('🔑 Change password request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Update phone number
app.put('/api/profile/update-phone', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('📱 Update phone number request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Get user bookings
app.get('/api/profile/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('📅 Get user bookings request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Delete user account (requires password)
app.delete('/api/profile/delete-account', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        console.log('🗑️ Delete user account request');
        
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
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// Handle preflight requests
app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin');
    res.send();
});

// Add this to your server.js after the other auth endpoints

// Register endpoint
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
        console.log(`📤 Register response: ${response.status}`, data.message || '');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Register proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
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
        console.log(`📤 Forgot password response: ${response.status}`, data.message || '');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Forgot password proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});
// Add this to server.js - around line 450
app.get('/api/adverts/active', async (req, res) => {
  try {
    console.log('🎪 Fetching active adverts via proxy');
    
    // Forward query parameters
    const queryParams = new URLSearchParams(req.query).toString();
    const backendUrl = queryParams ? 
      `${BACKEND_URL}/api/adverts/active?${queryParams}` : 
      `${BACKEND_URL}/api/adverts/active`;
    
    console.log('🎪 Backend URL:', backendUrl);
    
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
    console.log(`🎪 Adverts response: ${response.status} (${Array.isArray(data) ? data.length : 0} items)`);
    
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Adverts proxy error:', error.message);
    
    // Return fallback adverts
    const fallbackAdverts = [
      {
        id: 'fallback-1',
        title: 'African Diamond Blanc',
        subtitle: 'Premium selection for connoisseurs',
        imageUrl: 'assets/adverts/African_Diamond_Blanc.png',
        targetUrl: '#',
        isActive: true,
        type: 'homepage'
      },
      {
        id: 'fallback-2',
        title: 'Ferrero Rocher Collection',
        subtitle: 'Perfect pairing for special moments',
        imageUrl: 'assets/adverts/ferrero.png',
        targetUrl: '#',
        isActive: true,
        type: 'homepage'
      },
      {
        id: 'fallback-3',
        title: 'Moët & Chandon Rosé',
        subtitle: 'Celebrate with premium champagne',
        imageUrl: 'assets/adverts/moet_rose.png',
        targetUrl: '#',
        isActive: true,
        type: 'homepage'
      }
    ];
    
    res.json(fallbackAdverts);
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
        console.log(`📤 Verify OTP response: ${response.status}`, data.message || '');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Verify OTP proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
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
        console.log(`📤 Reset password response: ${response.status}`, data.message || '');
        
        res.status(response.status).json(data);
        
    } catch (error) {
        console.error('🚨 Reset password proxy error:', error);
        res.status(500).json({
            success: false,
            message: 'Proxy server error',
            error: error.message
        });
    }
});

// ============ ADD-ONS ENDPOINTS ============

// Get all add-ons (via proxy to backend)
app.get('/api/addons', async (req, res) => {
    try {
        console.log('📦 Fetching add-ons from backend:', `${BACKEND_URL}/api/addons`);
        
        const response = await fetch(`${BACKEND_URL}/api/addons`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 10000 // 10 second timeout
        });
        
        console.log('📦 Add-ons response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📤 Add-ons response: ${response.status} (${Array.isArray(data) ? data.length : 0} items)`);
        
        if (Array.isArray(data) && data.length > 0) {
            console.log('📦 First add-on:', JSON.stringify(data[0], null, 2));
        }
        
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
                imageUrl: 'assets/addons/premium-wine.jpg',
                description: 'Premium selection of curated wines'
            },
            {
                id: 2,
                name: 'Champagne Upgrade',
                price: 800.00,
                category: 'Champagne',
                imageUrl: 'assets/addons/champagne.jpg',
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

// ============ BOOKINGS ENDPOINTS ============

// Create booking (via proxy to backend)
app.post('/api/bookings', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📋 Creating booking via proxy');
        console.log('📋 Booking data:', JSON.stringify(req.body, null, 2));
        
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
        console.log('📤 Booking response data:', data);
        
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

// Get user bookings (via proxy to backend)
app.get('/api/bookings/user/:userId', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📅 Getting user bookings via proxy for user:', req.params.userId);
        
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
        console.log(`📤 User bookings response: ${response.status} (${Array.isArray(data) ? data.length : 0} bookings)`);
        
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

// Get all bookings (admin - via proxy to backend)
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
// ============ DELIVERY ENDPOINTS ============

// Create delivery (checkout) - Add this to your server.js after the bookings endpoints
app.post('/api/deliveries', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('🚚 Creating delivery/checkout via proxy');
        console.log('🚚 Delivery data:', JSON.stringify(req.body, null, 2));
        
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
        console.log('📤 Delivery response data:', data);
        
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
// Add to your server.js after the other endpoints
app.post('/api/deliveries', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('🚚 Creating delivery via proxy');
        console.log('🚚 Delivery data:', JSON.stringify(req.body, null, 2));
        
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Send to your backend API
        const response = await fetch(`${BACKEND_URL}/api/deliveries`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(req.body)
        });
        
        const data = await response.json();
        console.log(`📤 Delivery creation response: ${response.status}`);
        console.log('📤 Delivery response data:', data);
        
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
// ============ EMAIL ENDPOINTS ============

// Send delivery confirmation email
app.post('/api/email/send-delivery-confirmation', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        console.log('📧 Sending delivery confirmation email via proxy');
        console.log('📧 Email data:', JSON.stringify(req.body, null, 2));
        
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
});// Get single delivery by ID
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
// ============ WINE ENDPOINTS ============

// Get all wines
// All wines with query
app.get('/api/wines', async (req, res) => {
  try {
    console.log('🍷 Fetching all wines');
    
    // Forward query parameters
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
/// FIXED: Featured wines endpoint - NO LIMIT, PROPERLY FORWARDS RESPONSE
app.get('/api/wines/featured', async (req, res) => {
  try {
    console.log('🌟 Fetching featured wines via proxy');
    console.log('📡 Forwarding to backend:', `${BACKEND_URL}/api/wines/featured`);
    
    const response = await fetch(`${BACKEND_URL}/api/wines/featured`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      console.error(`❌ Backend responded with ${response.status}: ${response.statusText}`);
      
      // Try fallback endpoint
      console.log('🔄 Trying fallback endpoint with query params...');
      const fallbackResponse = await fetch(`${BACKEND_URL}/api/wines?featured=true&all=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        // Filter for featured wines
        const featuredWines = data.filter(wine => wine.isFeatured === true);
        console.log(`✅ Found ${featuredWines.length} featured wines via fallback`);
        return res.status(200).json(featuredWines);
      }
      
      throw new Error(`Backend responded with ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`🌟 Featured wines response: ${response.status}, count: ${Array.isArray(data) ? data.length : 'object'}`);
    
    // IMPORTANT: Send the EXACT data from backend, don't replace with fallback
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('🚨 Featured wines proxy error:', error.message);
    
    // ONLY use fallback if backend is completely unreachable
    console.log('⚠️ Backend unreachable, using fallback featured wines');
    
    // Try to get real wines first as fallback
    try {
      console.log('🔄 Attempting to fetch all wines as fallback...');
      const allWinesResponse = await fetch(`${BACKEND_URL}/api/wines?all=true`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      if (allWinesResponse.ok) {
        const allWines = await allWinesResponse.json();
        const featuredFromAll = allWines.filter(wine => wine.isFeatured === true);
        
        if (featuredFromAll.length > 0) {
          console.log(`✅ Found ${featuredFromAll.length} featured wines from all wines`);
          return res.json(featuredFromAll);
        }
      }
    } catch (fallbackError) {
      console.error('❌ Fallback to all wines also failed:', fallbackError.message);
    }
    
    // ULTIMATE fallback - only when everything else fails
    console.log('⚠️ Using static fallback featured wines');
    const fallbackWines = [
      {
        id: 1,
        name: 'The African Diamond Grenache Noir',
        type: 'Red Wine',
        price: 299.99,
        bannerImageUrl: 'assets/wines/breakfast/Noir.png',
        imageUrl: 'assets/wines/breakfast/Noir.png',
        isFeatured: true
      },
      {
        id: 2,
        name: 'The African Diamond Grenache Blanc',
        type: 'White Wine',
        price: 299.99,
        bannerImageUrl: 'assets/wines/breakfast/Blanc.png',
        imageUrl: 'assets/wines/breakfast/Blanc.png',
        isFeatured: true
      },
      {
        id: 3,
        name: 'YBY Crystal Dry',
        type: 'Champagne',
        price: 499.99,
        bannerImageUrl: 'assets/wines/breakfast/YBY.png',
        imageUrl: 'assets/wines/breakfast/YBY.png',
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
    console.log('📡 Backend URL:', `${BACKEND_URL}/api/wines/${req.params.id}`);
    
    const response = await fetch(`${BACKEND_URL}/api/wines/${req.params.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://store.wineandbubblesnow.co.za'  // Add origin header
      },
      timeout: 10000
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
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

// ============ CATCH-ALL ROUTE ============

// Catch-all route for SPA - serve index.html for non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // Try to serve static file first
  if (express.static.mime.lookup(req.path)) {
    return next();
  }
  
  // Otherwise serve index.html for SPA routing
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 Wine & Bubbles Website Server
📍 Port: ${PORT}
📡 Backend: ${BACKEND_URL}
📁 Serving from: ${__dirname}
✅ Ready at: http://localhost:${PORT}
    `);
    console.log('📂 Important URLs:');
    console.log(`   Homepage: http://localhost:${PORT}/`);
    console.log(`   Login: http://localhost:${PORT}/login/login.html`);
    console.log(`   Booking: http://localhost:${PORT}/booking/booking.html`);
    console.log(`   Add-ons test: http://localhost:${PORT}/api/test/addons`);
    console.log(`   Bookings test: http://localhost:${PORT}/api/test/bookings`);
    console.log(`   Add-ons: http://localhost:${PORT}/api/addons`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
});
