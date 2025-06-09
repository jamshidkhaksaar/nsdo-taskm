// Application configuration

// Determine the base URL based on environment
const getBaseUrl = (): string => {
  // Remove /api/v1 from the base URL since your backend doesn't use this prefix
  if (typeof window !== 'undefined') {
    // Browser environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000'; // Your local backend
    }
    return 'https://api.nsdo.org.af'; // Production - no /api/v1 prefix
  }
  
  // Server-side rendering or Node.js environment
  return process.env.VITE_APP_API_URL || 'https://api.nsdo.org.af';
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

export const API_BASE_URL = getBaseUrl();

export default CONFIG; 