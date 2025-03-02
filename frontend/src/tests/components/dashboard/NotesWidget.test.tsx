import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import NotesWidget from '../../../components/dashboard/NotesWidget';

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn().mockReturnValue('Jan 01, 2023'),
}));

describe('NotesWidget Component', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      clear: jest.fn(() => {
        store = {};
      }),
    };
  })();

  Object.defineProperty(window, 'localStorage', { value: localStorageMock });

  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  test('renders empty state when no notes exist', () => {
    render(<NotesWidget />);
    
    expect(screen.getByText('Quick Notes')).toBeInTheDocument();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(screen.getByText('Click the + button to add a note')).toBeInTheDocument();
  });

  test('loads notes from localStorage on mount', () => {
    const mockNotes = [
      {
        id: '1',
        content: 'Test note 1',
        createdAt: '2023-01-01T12:00:00.000Z',
        color: '#3498db',
      },
      {
        id: '2',
        content: 'Test note 2',
        createdAt: '2023-01-02T12:00:00.000Z',
        color: '#2ecc71',
      },
    ];
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockNotes));
    
    render(<NotesWidget />);
    
    expect(screen.getByText('Quick Notes (2)')).toBeInTheDocument();
    expect(screen.getByText('Test note 1')).toBeInTheDocument();
    expect(screen.getByText('Test note 2')).toBeInTheDocument();
    expect(localStorageMock.getItem).toHaveBeenCalledWith('quickNotes');
  });

  test('adds a new note', async () => {
    const user = userEvent.setup();
    render(<NotesWidget />);
    
    // Click add button
    const addButton = screen.getByRole('button', { name: /add new note/i });
    await user.click(addButton);
    
    // Verify the note form is visible
    const noteInput = screen.getByPlaceholderText('Write your note here...');
    expect(noteInput).toBeInTheDocument();
    
    // Type note content
    await user.type(noteInput, 'New test note');
    
    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);
    
    // Check if note is added
    expect(screen.getByText('New test note')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Check that the count is updated
    expect(screen.getByText('Quick Notes (1)')).toBeInTheDocument();
  });

  test('cancels adding a new note', async () => {
    const user = userEvent.setup();
    render(<NotesWidget />);
    
    // Verify empty state is initially shown
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    
    // Click add button
    const addButton = screen.getByRole('button', { name: /add new note/i });
    await user.click(addButton);
    
    // Verify the note form is visible
    const noteInput = screen.getByPlaceholderText('Write your note here...');
    expect(noteInput).toBeInTheDocument();
    
    // Type note content
    await user.type(noteInput, 'Cancelled note');
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Wait for the empty state message to be visible again
    await waitFor(() => {
      // Check that the empty state message is visible
      expect(screen.getByText('No notes yet')).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Verify localStorage was called with an empty array
    expect(localStorageMock.setItem).toHaveBeenCalledWith('quickNotes', '[]');
  });

  test('edits an existing note', async () => {
    const user = userEvent.setup();
    const mockNotes = [
      {
        id: '1',
        content: 'Original note content',
        createdAt: '2023-01-01T12:00:00.000Z',
        color: '#3498db',
      },
    ];
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockNotes));
    
    render(<NotesWidget />);
    
    // Find and click edit button
    const editButtons = screen.getAllByRole('button', { name: '' });
    const editButton = editButtons.find(button => 
      button.querySelector('svg[data-testid="EditIcon"]')
    );
    await user.click(editButton!);
    
    // Find textarea and change content
    const textarea = screen.getByDisplayValue('Original note content');
    await user.clear(textarea);
    await user.type(textarea, 'Updated note content');
    
    // Find and click save button
    const saveButtons = screen.getAllByRole('button', { name: '' });
    const saveButton = saveButtons.find(button => 
      button.querySelector('svg[data-testid="SaveIcon"]')
    );
    await user.click(saveButton!);
    
    // Check if note is updated
    expect(screen.getByText('Updated note content')).toBeInTheDocument();
    expect(screen.queryByText('Original note content')).not.toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('deletes a note', async () => {
    const user = userEvent.setup();
    const mockNotes = [
      {
        id: '1',
        content: 'Note to be deleted',
        createdAt: '2023-01-01T12:00:00.000Z',
        color: '#3498db',
      },
    ];
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockNotes));
    
    render(<NotesWidget />);
    
    // Verify note exists
    expect(screen.getByText('Note to be deleted')).toBeInTheDocument();
    
    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg[data-testid="DeleteIcon"]')
    );
    await user.click(deleteButton!);
    
    // Check if note is deleted
    expect(screen.queryByText('Note to be deleted')).not.toBeInTheDocument();
    expect(screen.getByText('No notes yet')).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  test('minimizes and expands the widget', async () => {
    const user = userEvent.setup();
    const mockNotes = [
      {
        id: '1',
        content: 'Test note',
        createdAt: '2023-01-01T12:00:00.000Z',
        color: '#3498db',
      },
    ];
    
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(mockNotes));
    
    render(<NotesWidget />);
    
    // Verify note is visible
    expect(screen.getByText('Test note')).toBeInTheDocument();
    
    // Find and click minimize button
    const minimizeButton = screen.getByRole('button', { name: /minimize/i });
    await user.click(minimizeButton);
    
    // Check for the expand button which indicates the widget is minimized
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /expand/i })).toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Find and click expand button
    const expandButton = screen.getByRole('button', { name: /expand/i });
    await user.click(expandButton);
    
    // Check for the minimize button which indicates the widget is expanded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
      // Also check that the note is visible again
      expect(screen.getByText('Test note')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
}); 