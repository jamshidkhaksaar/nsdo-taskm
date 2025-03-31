// API URLs
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Task Status
export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Task Priorities
export const TASK_PRIORITIES = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

// Dashboard periods
export const DASHBOARD_PERIODS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

// Chart Colors
export const CHART_COLORS = {
  primary: 'rgba(75,192,192,1)',
  primaryLight: 'rgba(75,192,192,0.2)',
  secondary: 'rgba(153,102,255,1)',
  secondaryLight: 'rgba(153,102,255,0.2)',
  warning: 'rgba(255,206,86,1)',
  warningLight: 'rgba(255,206,86,0.2)',
  danger: 'rgba(255,99,132,1)',
  dangerLight: 'rgba(255,99,132,0.2)',
  info: 'rgba(54,162,235,1)',
  infoLight: 'rgba(54,162,235,0.2)',
}; 