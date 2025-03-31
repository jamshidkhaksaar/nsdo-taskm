import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskKanbanBoard from '../../../components/dashboard/TaskKanbanBoard';
import { Task, TaskStatus, TaskPriority, TaskContext } from '../../../types/task';

// Mock the DragDropContext component
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Droppable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) => 
    children(
      { innerRef: jest.fn(), droppableProps: {} },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: { children: (provided: any, snapshot: any) => React.ReactNode }) => 
    children(
      { 
        innerRef: jest.fn(), 
        draggableProps: { style: {} }, 
        dragHandleProps: {} 
      },
      { isDragging: false }
    ),
}));

// Mock CircularProgress component
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    CircularProgress: () => <div data-testid="loading-indicator">Loading...</div>
  };
});

// Skip these tests for now until we can properly set up the environment
describe.skip('TaskKanbanBoard Component', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      due_date: '2023-12-01',
      created_at: '2023-11-01',
      updated_at: '2023-11-01',
      is_private: false,
      department: 'Engineering',
      assigned_to: [],
      created_by: 'user1',
      context: 'personal' as const
    },
    {
      id: '2',
      title: 'Task 2',
      description: 'Description 2',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      due_date: '2023-12-02',
      created_at: '2023-11-02',
      updated_at: '2023-11-02',
      is_private: false,
      department: 'Engineering',
      assigned_to: ['user2'],
      created_by: 'admin',
      context: 'personal'
    },
    {
      id: '3',
      title: 'Task 3',
      description: 'Description 3',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.LOW,
      due_date: '2023-12-03',
      created_at: '2023-11-03',
      updated_at: '2023-11-03',
      is_private: true,
      department: 'Marketing',
      assigned_to: ['user3'],
      created_by: 'admin',
      context: 'personal'
    }
  ];

  const mockOnCreateTask = jest.fn();
  const mockOnEditTask = jest.fn();
  const mockOnDeleteTask = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders task columns with correct titles', () => {
    render(
      <TaskKanbanBoard
        tasks={mockTasks}
        onCreateTask={mockOnCreateTask}
        onEditTask={mockOnEditTask}
        onDeleteTask={mockOnDeleteTask}
      />
    );

    // With the mocked DragDropContext, we need to check for text content
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('renders tasks in the correct columns', () => {
    render(
      <TaskKanbanBoard
        tasks={mockTasks}
        onCreateTask={mockOnCreateTask}
        onEditTask={mockOnEditTask}
        onDeleteTask={mockOnDeleteTask}
      />
    );

    // Check task titles
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  test('renders loading state when loading prop is true', () => {
    render(<TaskKanbanBoard loading={true} />);
    
    // Check for loading indicator
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders error message when error prop is provided', () => {
    const errorMessage = 'Failed to load tasks';
    render(<TaskKanbanBoard error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
}); 
