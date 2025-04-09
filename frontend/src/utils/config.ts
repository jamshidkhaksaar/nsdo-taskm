// Application configuration

// Determine the base URL based on environment
const getBaseUrl = (): string => {
  // In production, API calls should go to the same host (relative URLs)
  // In development, we might need to specify the backend explicitly
  if (import.meta.env.MODE === 'production') {
    return ''; // Use relative URLs in production
  } else {
    // Always use port 3001 for the backend in development
    const apiUrl = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:3001';
    
    // Ensure we're using port 3001
    if (apiUrl.includes('localhost:') && !apiUrl.includes('localhost:3001')) {
      const correctedUrl = apiUrl.replace(/localhost:\d+/, 'localhost:3001');
      console.log('[CONFIG] Corrected API URL from', apiUrl, 'to', correctedUrl);
      return correctedUrl;
    }
    
    // If the URL doesn't include localhost at all, make sure we have a valid URL
    if (!apiUrl.includes('localhost')) {
      console.log('[CONFIG] API URL does not include localhost, using default');
      return 'http://localhost:3001';
    }
    
    return apiUrl.endsWith('/api/v1') ? apiUrl : `${apiUrl}/api/v1`;
  }
};

// Define an object that can be updated during runtime
export const CONFIG = {
  // API configuration
  API_URL: getBaseUrl(),
  
  // Feature flags
  DEBUG: import.meta.env.MODE === 'development',
  
  // Helper to toggle debug mode
  toggleDebug: (): void => {
    CONFIG.DEBUG = !CONFIG.DEBUG;
    console.log(`Debug mode ${CONFIG.DEBUG ? 'enabled' : 'disabled'}`);
  }
};

// Log the API URL in development
if (import.meta.env.MODE === 'development') {
  console.log('[CONFIG] Using API URL:', CONFIG.API_URL);
}

export default CONFIG; 