import React, { Component, ErrorInfo, ReactNode } from 'react';

// Original console.error function
const originalConsoleError = console.error;

// Filter out specific warnings
console.error = function filterWarnings(...args: any[]) {
  // Check if this is the warning about defaultProps in memo components
  if (
    args.length > 0 &&
    typeof args[0] === 'string' &&
    args[0].includes('Support for defaultProps will be removed from memo components')
  ) {
    // Suppress this specific warning
    return;
  }
  
  // Pass through all other console.error calls
  originalConsoleError.apply(console, args);
};

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