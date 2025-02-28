// Application configuration

// Check if we're running in a browser environment with localStorage
const isBrowser = typeof window !== 'undefined' && window.localStorage;

// Get default mock data setting - ALWAYS use mock data in development by default
const getDefaultMockSetting = (): boolean => {
  // Always default to true for better developer experience
  return true;
};

// Force mock data in development unless explicitly disabled
const forceMockInDevelopment = (): boolean => {
  // If we're in development and there's no explicit setting to disable mock data,
  // force it to be enabled
  if (process.env.NODE_ENV === 'development') {
    try {
      const explicitDisable = localStorage.getItem('forceMockDataDisabled');
      return explicitDisable !== 'true';
    } catch (e) {
      return true; // Default to true in development if localStorage fails
    }
  }
  return false; // Don't force in production
};

// Attempt to load settings from localStorage
const loadMockSetting = (): boolean => {
  // Check if mock data is explicitly disabled
  if (isBrowser) {
    try {
      const explicitDisable = localStorage.getItem('forceMockDataDisabled');
      if (explicitDisable === 'true') {
        return false; // Mock data explicitly disabled
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  // If in development, check if we should force mock data
  if (forceMockInDevelopment()) {
    return true;
  }
  
  // If not in browser, use default
  if (!isBrowser) {
    return getDefaultMockSetting();
  }
  
  try {
    const savedSetting = localStorage.getItem('useMockData');
    // If setting exists in localStorage, use it, otherwise use the default
    return savedSetting !== null ? JSON.parse(savedSetting) : getDefaultMockSetting();
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading mock data setting:', e);
    }
    return getDefaultMockSetting(); // Default if there's an error
  }
};

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
  USE_MOCK_DATA: loadMockSetting(),
  MOCK_DELAY: 500, // ms
  DEBUG: process.env.NODE_ENV === 'development',
  
  // Update settings
  setUseMockData: (value: boolean): void => {
    CONFIG.USE_MOCK_DATA = value;
    if (isBrowser) {
      try {
        localStorage.setItem('useMockData', JSON.stringify(value));
        // If explicitly disabling mock data in development, set the flag
        if (!value && process.env.NODE_ENV === 'development') {
          localStorage.setItem('forceMockDataDisabled', 'true');
        } else {
          localStorage.removeItem('forceMockDataDisabled');
        }
        // Clear connection checked status when changing this setting
        localStorage.removeItem('connectionChecked');
      } catch (e) {
        // Handle localStorage errors silently
        if (process.env.NODE_ENV === 'development') {
          console.error('Error saving mock data setting:', e);
        }
      }
    }
    
    // Force page reload to apply the change
    if (isBrowser && typeof window.location !== 'undefined') {
      window.location.reload();
    }
  },
  
  // Helper function to disable mock data
  disableMockData: (): void => {
    if (isBrowser) {
      localStorage.setItem('forceMockDataDisabled', 'true');
      localStorage.setItem('useMockData', 'false');
    }
    CONFIG.USE_MOCK_DATA = false;
    
    // Force page reload to apply the change immediately
    if (isBrowser && typeof window.location !== 'undefined') {
      console.log('[CONFIG] Mock data disabled, reloading page...');
      window.location.reload();
    }
  },
  
  // Helper function to enable mock data
  enableMockData: (): void => {
    if (isBrowser) {
      localStorage.removeItem('forceMockDataDisabled');
      localStorage.setItem('useMockData', 'true');
    }
    CONFIG.USE_MOCK_DATA = true;
    
    // Force page reload to apply the change
    if (isBrowser && typeof window.location !== 'undefined') {
      console.log('[CONFIG] Mock data enabled, reloading page...');
      window.location.reload();
    }
  },
  
  // Helper to toggle debug mode
  toggleDebug: (): void => {
    CONFIG.DEBUG = !CONFIG.DEBUG;
    console.log(`Debug mode ${CONFIG.DEBUG ? 'enabled' : 'disabled'}`);
  }
};

// Log the mock data mode on startup in development
if (process.env.NODE_ENV === 'development') {
  console.log(`[CONFIG] Mock data mode: ${CONFIG.USE_MOCK_DATA ? 'ENABLED' : 'DISABLED'}`);
  if (CONFIG.USE_MOCK_DATA) {
    console.log('[CONFIG] Using mock data - no API calls will be made');
    console.log('[CONFIG] To disable mock data, run: CONFIG.disableMockData()');
  } else {
    console.log('[CONFIG] Using real API calls to:', CONFIG.API_URL);
  }
}

export default CONFIG; 