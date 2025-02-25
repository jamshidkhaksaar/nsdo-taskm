import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    
    // Auto-dismiss error after 5 seconds
    const timer = setTimeout(() => {
      setError(null);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}; 