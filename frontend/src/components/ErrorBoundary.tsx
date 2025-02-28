import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CONFIG } from '../utils/config';

// Original console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

// Completely suppress all network-related errors in the console when in mock mode
if (CONFIG.USE_MOCK_DATA) {
  // Override console.error to filter out network errors
  console.error = function suppressNetworkErrors(...args: any[]) {
    // Skip logging any network-related errors in mock mode
    if (
      args.length > 0 &&
      (
        // Skip connection errors (string messages)
        (typeof args[0] === 'string' && 
          (args[0].includes('Connection check failed') || 
           args[0].includes('No response received') ||
           args[0].includes('Error fetching') ||
           args[0].includes('network error') ||
           args[0].includes('Network Error') ||
           args[0].includes('Failed to fetch') ||
           args[0].includes('ERR_CONNECTION_REFUSED'))
        ) ||
        // Skip error objects
        (args[0] && typeof args[0] === 'object' && 
          (
            (args[0].message && 
              (args[0].message === 'Network Error' || 
               args[0].message.includes('Failed to fetch'))
            ) ||
            (args[0].code && args[0].code === 'ERR_NETWORK') ||
            (args[0].name && args[0].name === 'AxiosError')
          )
        )
      )
    ) {
      // Don't output these errors in mock mode
      return;
    }
    
    // Skip React warnings about defaultProps
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      args[0].includes('Support for defaultProps will be removed from memo components')
    ) {
      return;
    }
    
    // Pass through all other console.error calls
    originalConsoleError.apply(console, args);
  };
  
  // Also filter console.log for network-related messages
  console.log = function suppressNetworkLogs(...args: any[]) {
    // Skip logging network-related messages in mock mode
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      (
        args[0].includes('GET http://localhost:3001') ||
        args[0].includes('GET http://localhost:8000') ||
        args[0].includes('Making GET request') ||
        args[0].includes('Response from')
      )
    ) {
      return;
    }
    
    // Pass through all other console.log calls
    originalConsoleLog.apply(console, args);
  };
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Don't log API-related errors in mock mode
    if (CONFIG.USE_MOCK_DATA && (
      (error.message && (
        error.message.includes('Failed to fetch') ||
        error.message === 'Network Error' ||
        error.message.includes('ERR_CONNECTION_REFUSED')
      )) ||
      (error.name === 'AxiosError')
    )) {
      return;
    }
    
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return <h1>Sorry, something went wrong.</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 