// Application configuration

// Determine the base URL based on environment
const getBaseUrl = (): string => {
  // In production, API calls should go to the same host (relative URLs)
  // In development, we might need to specify the backend explicitly
  if (process.env.NODE_ENV === 'production') {
    return ''; // Use relative URLs in production
  } else {
    // Always use port 3001 for the backend in development
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    // Ensure we're using port 3001
    if (apiUrl.includes('localhost:') && !apiUrl.includes('localhost:3001')) {
      return apiUrl.replace(/localhost:\d+/, 'localhost:3001');
    }
    return apiUrl;
  }
};

// Define an object that can be updated during runtime
export const CONFIG = {
  // API configuration
  API_URL: getBaseUrl(),
  
  // Feature flags
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Helper to toggle debug mode
  toggleDebug: (): void => {
    CONFIG.DEBUG = !CONFIG.DEBUG;
    console.log(`Debug mode ${CONFIG.DEBUG ? 'enabled' : 'disabled'}`);
  }
};

// Log the API URL in development
if (process.env.NODE_ENV === 'development') {
  console.log('[CONFIG] Using API URL:', CONFIG.API_URL);
}

export default CONFIG; 