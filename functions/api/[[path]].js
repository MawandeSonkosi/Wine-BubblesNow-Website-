export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Handle OPTIONS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  }
  
  // Extract the path after /api/
  const path = url.pathname.replace('/api', '');
  
  // Forward to your Railway backend
  const backendUrl = `https://winebubblesnow-production.up.railway.app/api${path}${url.search}`;
  
  console.log('Proxying to:', backendUrl);
  
  // Clone the request headers
  const headers = new Headers(request.headers);
  
  // Add/ensure required headers
  headers.set('Origin', 'https://app.wineandbubblesnow.co.za');
  
  // Create new request with same method, headers, and body
  const modifiedRequest = new Request(backendUrl, {
    method: request.method,
    headers: headers,
    body: request.body,
    // Don't follow redirects automatically to handle them properly
    redirect: 'manual'
  });
  
  try {
    // Forward the request
    const response = await fetch(modifiedRequest);
    
    // Create a new response with CORS headers
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
    
    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin');
    newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Add cache control for better performance
    newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return newResponse;
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Proxy error', 
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin'
      }
    });
  }
}