import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  Divider,
  Tooltip,
  Button,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import { format } from 'date-fns';

// Define the structure for a single note with color
interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string; // Added color property
}

// Predefined note colors (adjust as needed)
const NOTE_COLORS = [
  'rgba(255, 255, 255, 0.08)', // Default slightly transparent white
  'rgba(100, 181, 246, 0.2)', // Light Blue
  'rgba(129, 199, 132, 0.2)', // Light Green
  'rgba(255, 245, 157, 0.2)', // Light Yellow
  'rgba(255, 171, 145, 0.2)', // Light Orange
  'rgba(229, 115, 115, 0.2)', // Light Red
  'rgba(149, 117, 205, 0.2)', // Light Purple
];

// RENAME THE COMPONENT HERE
const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editColor, setEditColor] = useState<string>(NOTE_COLORS[0]); // State for color during edit
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedNotes = localStorage.getItem('quickNotesData');
    if (savedNotes) {
      try {
        const parsedNotes: QuickNote[] = JSON.parse(savedNotes);
        // Add validation for color, provide default if missing
        if (Array.isArray(parsedNotes) && parsedNotes.every(n => n.id && n.content && n.createdAt)) {
           setNotes(parsedNotes.map(n => ({ ...n, color: n.color || NOTE_COLORS[0] })));
        } else {
           console.warn('Invalid notes data found in localStorage.');
           localStorage.removeItem('quickNotesData');
        }
      } catch (error) {
        console.error('Failed to parse notes from localStorage:', error);
        localStorage.removeItem('quickNotesData');
      }
    }
  }, []);

  const saveNotes = (updatedNotes: QuickNote[]) => {
    localStorage.setItem('quickNotesData', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const addNote = () => {
    if (newNoteContent.trim()) {
      const now = new Date().toISOString();
      // Cycle through colors for new notes
      const nextColorIndex = notes.length % NOTE_COLORS.length;
      const noteToAdd: QuickNote = {
        id: crypto.randomUUID(),
        content: newNoteContent,
        createdAt: now,
        updatedAt: now,
        color: NOTE_COLORS[nextColorIndex],
      };
      const updatedNotes = [...notes, noteToAdd];
      saveNotes(updatedNotes);
      setNewNoteContent('');
    }
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveNotes(updatedNotes);
  };

  const startEditNote = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditColor(note.color); // Set current color for editing
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 50);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditColor(NOTE_COLORS[0]); // Reset edit color
  };

  const saveEditNote = (id: string) => {
    if (!editContent.trim()) return;
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, content: editContent, updatedAt: new Date().toISOString(), color: editColor } // Save edited color
        : note
    );
    saveNotes(updatedNotes);
    cancelEditNote();
  };

  // Auto-focus input when edit mode starts
  useEffect(() => {
      if (editingNoteId && editInputRef.current) {
          editInputRef.current.focus();
      }
  }, [editingNoteId]);

  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        mb: 3,
        borderRadius: '8px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <StickyNote2Icon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Quick Notes
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Add a quick note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addNote()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={addNote} edge="end" sx={{ color: '#64b5f6' }}>
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#64b5f6',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {notes.length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              No notes yet. Add one above!
            </Typography>
          ) : (
            notes.map((note) => (
              <Card key={note.id} sx={{ mb: 1.5, background: note.color }}>
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <>
                    <CardContent sx={{ pb: '8px !important' }}>
                      <TextField
                        fullWidth
                        multiline
                        variant="standard" // Use standard variant for less space
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        inputRef={editInputRef} // Attach ref
                        sx={{
                          '& .MuiInputBase-root': { py: 0 },
                          '& .MuiInputBase-input': { color: '#fff' },
                          '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255, 255, 255, 0.3)' },
                          '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: 'rgba(255, 255, 255, 0.5)' },
                          '& .MuiInput-underline:after': { borderBottomColor: '#64b5f6' },
                        }}
                      />
                      {/* Color Selection Swatches */}
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        {NOTE_COLORS.map((colorOption) => (
                          <Tooltip key={colorOption} title="Set color">
                            <IconButton
                              size="small"
                              onClick={() => setEditColor(colorOption)}
                              sx={{
                                backgroundColor: colorOption,
                                border: editColor === colorOption ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.3)',
                                width: 20,
                                height: 20,
                                '&:hover': {
                                  backgroundColor: colorOption,
                                  opacity: 0.8,
                                },
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Stack>
                    </CardContent>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0.5, pb: '4px !important' }}>
                      <Tooltip title="Cancel Edit">
                        <IconButton size="small" onClick={cancelEditNote} sx={{ color: '#e57373' }}>
                          <CancelIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Save Note">
                        <IconButton size="small" onClick={() => saveEditNote(note.id)} sx={{ color: '#81c784' }}>
                          <SaveIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </>
                ) : (
                  // View Mode
                  <>
                    <CardContent sx={{ pb: '8px !important' }}>
                      <Typography sx={{ color: '#fff', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {note.content}
                      </Typography>
                    </CardContent>
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                    <CardActions sx={{ justifyContent: 'space-between', pt: 0.5, pb: '4px !important' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        {format(new Date(note.updatedAt), 'Pp')}
                      </Typography>
                      <Box>
                        <Tooltip title="Edit Note">
                          <IconButton size="small" onClick={() => startEditNote(note)} sx={{ color: '#90caf9' }}>
                            <EditIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Note">
                          <IconButton size="small" onClick={() => deleteNote(note.id)} sx={{ color: '#e57373' }}>
                            <DeleteIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </CardActions>
                  </>
                )}
              </Card>
            ))
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

// RENAME THE EXPORT HERE
export default NotesWidget;