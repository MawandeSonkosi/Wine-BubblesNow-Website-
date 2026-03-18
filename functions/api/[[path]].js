export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // Extract the path after /api/
  const path = url.pathname.replace('/api', '');
  
  // Forward to your Railway backend
  const backendUrl = `https://winebubblesnow-production.up.railway.app/api${path}${url.search}`;
  
  console.log('Proxying to:', backendUrl);
  
  // Clone the request headers
  const headers = new Headers(request.headers);
  
  // Create new request with same method, headers, and body
  const modifiedRequest = new Request(backendUrl, {
    method: request.method,
    headers: headers,
    body: request.body
  });
  
  try {
    // Forward the request
    const response = await fetch(modifiedRequest);
    
    // Create a new response with CORS headers
    const newResponse = new Response(response.body, response);
    
    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}