// Import polyfill for drag-and-drop
import './polyfills/dragDropPolyfill';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { CONFIG } from './utils/config';

// Completely disable network requests in mock mode
if (CONFIG.USE_MOCK_DATA) {
  console.log('[MOCK] Mock data mode is enabled - intercepting API requests');
  
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to block network requests to our API
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = input.toString();
    
    // If this is a request to our API, return a mock response
    if (url.includes('localhost:3001') || url.includes('localhost:8000') || url.includes('/api/')) {
      console.log('[MOCK] Blocked fetch request to:', url);
      
      // Create a mock response
      const mockResponse = new Response(JSON.stringify({ 
        message: 'Mock data mode is enabled. No actual API requests are made.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return Promise.resolve(mockResponse);
    }
    
    // Otherwise, use the original fetch
    return originalFetch.apply(window, [input, init]);
  };
  
  // Also override XMLHttpRequest to block API requests
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null): void {
    const urlStr = url.toString();
    
    if (urlStr.includes('localhost:3001') || urlStr.includes('localhost:8000') || urlStr.includes('/api/')) {
      console.log('[MOCK] Blocked XHR request to:', urlStr);
      
      // For API requests, modify the URL to a non-existent endpoint that won't cause errors
      originalXHROpen.apply(this, [method, 'data:text/plain,mock', async === false ? false : true, username, password]);
      
      // Mock the send method for this request
      this.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
        // Simulate a successful response
        Object.defineProperty(this, 'status', { value: 200 });
        Object.defineProperty(this, 'statusText', { value: 'OK' });
        Object.defineProperty(this, 'responseText', { 
          value: JSON.stringify({ message: 'Mock data mode is enabled' }) 
        });
        Object.defineProperty(this, 'response', { 
          value: JSON.stringify({ message: 'Mock data mode is enabled' }) 
        });
        
        // Trigger ready state changes
        Object.defineProperty(this, 'readyState', { value: 4 });
        if (this.onreadystatechange) {
          // Create a synthetic event that matches what the browser would create
          const readyStateEvent = document.createEvent('Event');
          readyStateEvent.initEvent('readystatechange', false, false);
          this.onreadystatechange(readyStateEvent as Event);
        }
        
        // Trigger load event
        if (this.onload) {
          // Create a synthetic progress event for load
          const loadEvent = document.createEvent('ProgressEvent');
          loadEvent.initEvent('load', false, false);
          
          // Add required properties for ProgressEvent
          Object.defineProperty(loadEvent, 'lengthComputable', { value: false });
          Object.defineProperty(loadEvent, 'loaded', { value: 0 });
          Object.defineProperty(loadEvent, 'total', { value: 0 });
          
          this.onload(loadEvent as ProgressEvent<EventTarget>);
        }
      };
    } else {
      // For non-API requests, use the original open method
      originalXHROpen.apply(this, [method, url, async === false ? false : true, username, password]);
    }
  };
  
  // Override console.error to filter out network errors
  const originalConsoleError = console.error;
  console.error = function(...args: any[]): void {
    // Skip network-related errors
    if (
      args.length > 0 && 
      (
        (typeof args[0] === 'string' && 
          (args[0].includes('Failed to load resource') ||
           args[0].includes('ERR_CONNECTION_REFUSED') ||
           args[0].includes('Connection check failed') ||
           args[0].includes('No response received') ||
           args[0].includes('Error fetching') ||
           args[0].includes('Network Error'))
        ) ||
        (args[0] && args[0].message && 
          (args[0].message.includes('Failed to fetch') || 
           args[0].message === 'Network Error')
        )
      )
    ) {
      // Don't log network errors
      return;
    }
    
    // Pass through other errors
    originalConsoleError.apply(console, args);
  };
} else {
  console.log('[REAL] Using real API requests - no interception');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <App />
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
