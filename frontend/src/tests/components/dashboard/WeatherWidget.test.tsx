import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WeatherWidget from '../../../components/dashboard/WeatherWidget';

// Mock the geolocation API
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation((success) => 
    Promise.resolve(success({
      coords: {
        latitude: 37.7749,
        longitude: -122.4194
      }
    }))
  )
};

// Assign mock to global object
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

// Mock the setTimeout function
jest.useFakeTimers();

describe('WeatherWidget Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    render(<WeatherWidget />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders weather data after loading', async () => {
    render(<WeatherWidget />);
    
    // Initially shows loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Fast-forward timer to complete the setTimeout
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Now it should show the weather data
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
    expect(screen.getByText('18°C')).toBeInTheDocument();
    expect(screen.getByText('Partly Cloudy')).toBeInTheDocument();
  });

  test('refreshes weather data when refresh button is clicked', () => {
    render(<WeatherWidget />);
    
    // Fast-forward timer to load initial data
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Find and click the refresh button
    const refreshButton = screen.getByRole('button');
    fireEvent.click(refreshButton);
    
    // Should show loading again
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Fast-forward timer again
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Should show weather data again
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    render(<WeatherWidget compact={true} />);
    
    // Fast-forward timer to load data
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    // Basic check to ensure it renders
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });
}); 