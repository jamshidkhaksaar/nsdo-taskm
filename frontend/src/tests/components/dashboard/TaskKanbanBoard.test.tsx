import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskKanbanBoard from '../../../components/dashboard/TaskKanbanBoard';
import { Task, TaskStatus, TaskPriority } from '../../../types/task';

// Mock the KanbanColumn component
jest.mock('../../../components/kanban', () => ({
  KanbanColumn: ({ title, tasks }: { title: string; tasks: Task[] }) => (
    <div data-testid={`column-${title.toLowerCase().replace(' ', '-')}`}>
      <h3>{title}</h3>
      <div>
        {tasks.map(task => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.title}
          </div>
        ))}
      </div>
    </div>
  )
}));

// Skip these tests for now until we can properly set up the environment
describe('TaskKanbanBoard Component', () => {
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

  test('renders task columns with correct status labels', () => {
    render(
      <TaskKanbanBoard
        tasks={mockTasks}
        onCreateTask={mockOnCreateTask}
        onEditTask={mockOnEditTask}
        onDeleteTask={mockOnDeleteTask}
      />
    );

    // Check for column labels
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('passes the correct tasks to each column', () => {
    render(
      <TaskKanbanBoard
        tasks={mockTasks}
        onCreateTask={mockOnCreateTask}
        onEditTask={mockOnEditTask}
        onDeleteTask={mockOnDeleteTask}
      />
    );

    // Verify columns exist
    expect(screen.getByTestId('column-to-do')).toBeInTheDocument();
    expect(screen.getByTestId('column-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('column-completed')).toBeInTheDocument();
    expect(screen.getByTestId('column-cancelled')).toBeInTheDocument();
    
    // Check task titles in the mock
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  test('renders error message when error prop is provided', () => {
    const errorMessage = 'Failed to load tasks';
    render(<TaskKanbanBoard error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('displays add task button when onCreateTask is provided', () => {
    render(
      <TaskKanbanBoard
        tasks={[]}
        onCreateTask={mockOnCreateTask}
      />
    );
    
    const addButton = screen.getByText('Add Task');
    expect(addButton).toBeInTheDocument();
  });
});
