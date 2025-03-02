import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardHeader from '../../../components/dashboard/DashboardHeader';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('DashboardHeader Component', () => {
  const defaultProps = {
    notifications: 5,
    onNotificationClick: jest.fn(),
    showWidget: true,
    onToggleWidget: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders with correct notification count', () => {
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Check if notification badge shows correct count
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('calls onNotificationClick when notification button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Find notification button by finding the button that contains the NotificationsIcon
    const notificationButton = screen.getAllByRole('button')[0]; // First button is notification
    await user.click(notificationButton);
    
    // Check if callback was called
    expect(defaultProps.onNotificationClick).toHaveBeenCalledTimes(1);
  });

  test('opens profile menu when profile button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Initially, menu items should not be visible
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    
    // Find and click profile button
    const profileButton = screen.getAllByRole('button')[1]; // Second button is profile
    await user.click(profileButton);
    
    // Menu items should now be visible
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('navigates to profile page when profile menu item is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Open profile menu
    const profileButton = screen.getAllByRole('button')[1];
    await user.click(profileButton);
    
    // Click profile menu item
    const profileMenuItem = screen.getByText('Profile');
    await user.click(profileMenuItem);
    
    // Check if navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/profile');
  });

  test('navigates to settings page when settings menu item is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Open profile menu
    const profileButton = screen.getAllByRole('button')[1];
    await user.click(profileButton);
    
    // Click settings menu item
    const settingsMenuItem = screen.getByText('Settings');
    await user.click(settingsMenuItem);
    
    // Check if navigate was called with correct path
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  test('shows "Hide" text when showWidget is true', () => {
    renderWithRouter(<DashboardHeader {...defaultProps} showWidget={true} />);
    
    // Check if button shows "Hide"
    expect(screen.getByText('Hide')).toBeInTheDocument();
  });

  test('shows "Show" text when showWidget is false', () => {
    renderWithRouter(<DashboardHeader {...defaultProps} showWidget={false} />);
    
    // Check if button shows "Show"
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  test('calls onToggleWidget when toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<DashboardHeader {...defaultProps} />);
    
    // Find and click toggle button
    const toggleButton = screen.getByText('Hide');
    await user.click(toggleButton);
    
    // Check if callback was called
    expect(defaultProps.onToggleWidget).toHaveBeenCalledTimes(1);
  });
}); 