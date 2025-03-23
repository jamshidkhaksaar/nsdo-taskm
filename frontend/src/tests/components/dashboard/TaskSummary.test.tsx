import React from 'react';
import { render, screen, within } from '@testing-library/react';
import TaskSummary from '../../../components/dashboard/TaskSummary';
import { Task, TaskStatus } from '../../../types/task';

describe('TaskSummary Component', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: TaskStatus.PENDING,
      priority: 'high',
      due_date: '2023-12-01',
      created_at: '2023-11-01',
      is_private: false,
      department: 'Engineering',
      assigned_to: ['user1'],
      created_by: 'admin',
      context: 'personal'
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: TaskStatus.PENDING,
      priority: 'medium',
      due_date: '2023-12-02',
      created_at: '2023-11-02',
      is_private: false,
      department: 'Marketing',
      assigned_to: ['user2'],
      created_by: 'admin',
      context: 'personal'
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      status: TaskStatus.IN_PROGRESS,
      priority: 'low',
      due_date: '2023-12-03',
      created_at: '2023-11-03',
      is_private: true,
      department: 'Sales',
      assigned_to: ['user3'],
      created_by: 'admin',
      context: 'personal'
    },
    {
      id: '4',
      title: 'Task 4',
      description: 'Description 4',
      status: TaskStatus.COMPLETED,
      priority: 'high',
      due_date: '2023-12-04',
      created_at: '2023-11-04',
      is_private: false,
      department: 'HR',
      assigned_to: ['user4'],
      created_by: 'admin',
      context: 'personal'
    },
    {
      id: '5',
      title: 'Task 5',
      description: 'Description 5',
      status: TaskStatus.CANCELLED,
      priority: 'medium',
      due_date: '2023-12-05',
      created_at: '2023-11-05',
      is_private: true,
      department: 'Finance',
      assigned_to: ['user5'],
      created_by: 'admin',
      context: 'personal'
    }
  ];

  test('renders task summary with correct counts', () => {
    render(<TaskSummary tasks={mockTasks} />);
    
    // Check title and total count
    expect(screen.getByText('Task Summary')).toBeInTheDocument();
    expect(screen.getByText('5 total tasks')).toBeInTheDocument();
    
    // Check status labels are present
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    
    // Check the counts are correct by finding them near their labels
    const pendingLabel = screen.getByText('Pending');
    const pendingStack = pendingLabel.closest('div')?.parentElement;
    const pendingCount = pendingStack?.querySelector('p');
    expect(pendingCount).toHaveTextContent('2');
    
    const inProgressLabel = screen.getByText('In Progress');
    const inProgressStack = inProgressLabel.closest('div')?.parentElement;
    const inProgressCount = inProgressStack?.querySelector('p');
    expect(inProgressCount).toHaveTextContent('1');
    
    const completedLabel = screen.getByText('Completed');
    const completedStack = completedLabel.closest('div')?.parentElement;
    const completedCount = completedStack?.querySelector('p');
    expect(completedCount).toHaveTextContent('1');
    
    const cancelledLabel = screen.getByText('Cancelled');
    const cancelledStack = cancelledLabel.closest('div')?.parentElement;
    const cancelledCount = cancelledStack?.querySelector('p');
    expect(cancelledCount).toHaveTextContent('1');
  });

  test('renders with empty tasks array', () => {
    render(<TaskSummary tasks={[]} />);
    
    // Check title and total count
    expect(screen.getByText('Task Summary')).toBeInTheDocument();
    expect(screen.getByText('0 total tasks')).toBeInTheDocument();
    
    // Check all status counts are zero
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(4); // At least 4 zeros for the status counts
  });

  test('renders in compact mode', () => {
    render(<TaskSummary tasks={mockTasks} compact={true} />);
    
    // Basic checks to ensure it renders
    expect(screen.getByText('Task Summary')).toBeInTheDocument();
    expect(screen.getByText('5 total tasks')).toBeInTheDocument();
  });
}); 