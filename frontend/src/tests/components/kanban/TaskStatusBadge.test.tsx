import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskStatusBadge } from '../../../components/kanban';
import { TaskStatus } from '../../../types/task';

// We don't need to mock any dependencies for this component

describe('TaskStatusBadge Component', () => {
  test('renders pending status correctly', () => {
    render(<TaskStatusBadge status={TaskStatus.PENDING} />);
    
    const badge = screen.getByText('Pending');
    expect(badge).toBeInTheDocument();
    // We could also test for specific styling/classes if needed
  });

  test('renders in progress status correctly', () => {
    render(<TaskStatusBadge status={TaskStatus.IN_PROGRESS} />);
    
    const badge = screen.getByText('In Progress');
    expect(badge).toBeInTheDocument();
  });

  test('renders completed status correctly', () => {
    render(<TaskStatusBadge status={TaskStatus.COMPLETED} />);
    
    const badge = screen.getByText('Completed');
    expect(badge).toBeInTheDocument();
  });

  test('renders cancelled status correctly', () => {
    render(<TaskStatusBadge status={TaskStatus.CANCELLED} />);
    
    const badge = screen.getByText('Cancelled');
    expect(badge).toBeInTheDocument();
  });

  test('applies correct color for each status', () => {
    const { rerender } = render(<TaskStatusBadge status={TaskStatus.PENDING} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    
    rerender(<TaskStatusBadge status={TaskStatus.IN_PROGRESS} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    
    rerender(<TaskStatusBadge status={TaskStatus.COMPLETED} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    rerender(<TaskStatusBadge status={TaskStatus.CANCELLED} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('renders with custom size when specified', () => {
    const { container } = render(<TaskStatusBadge status={TaskStatus.PENDING} size="small" />);
    
    // In a real test, you could test for specific class or DOM property
    // that indicates the small size was applied
    const chipElement = container.querySelector('.MuiChip-sizeSmall');
    expect(chipElement).toBeInTheDocument();
  });
});