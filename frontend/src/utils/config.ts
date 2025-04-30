// Application configuration

// Determine the base URL based on environment
const getBaseUrl = (): string => {
  // In production, API calls should go to the same host (relative URLs)
  // In development, we might need to specify the backend explicitly
  if (process.env.NODE_ENV === 'production') {
    return ''; // Use relative URLs in production
  } else {
    // Always use port 3001 for the backend in development
    return 'http://localhost:3001';
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
  }
};

export default CONFIG; 