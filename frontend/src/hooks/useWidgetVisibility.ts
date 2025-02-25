import { useState, useEffect } from 'react';

export const useWidgetVisibility = (storageKey: string, defaultValue: boolean = true): [boolean, () => void] => {
  // Initialize state from localStorage or use default
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  });

  // Update localStorage when state changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isVisible));
  }, [isVisible, storageKey]);

  // Toggle function
  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  return [isVisible, toggleVisibility];
}; 