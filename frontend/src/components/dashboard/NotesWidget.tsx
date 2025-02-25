import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  IconButton, 
  Button, 
  Tooltip,
  Paper,
  Fade,
  Divider,
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { format } from 'date-fns';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  color: string;
}

const COLORS = [
  '#3498db', // Blue
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#f39c12', // Orange
  '#9b59b6', // Purple
];

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('quickNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Error parsing saved notes:', error);
        setNotes([]);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quickNotes', JSON.stringify(notes));
  }, [notes]);

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        content: newNoteContent.trim(),
        createdAt: new Date().toISOString(),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      
      setNotes(prevNotes => [newNote, ...prevNotes]);
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = (id: string) => {
    if (editingContent.trim()) {
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === id 
            ? { ...note, content: editingContent.trim() } 
            : note
        )
      );
    }
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          p: 2,
          borderBottom: isMinimized ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
          Quick Notes {!isMinimized && notes.length > 0 && `(${notes.length})`}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMinimized && (
            <Tooltip title="Add new note">
              <IconButton 
                onClick={() => setIsAddingNote(true)}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                  mr: 1
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
            <IconButton
              onClick={toggleMinimize}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: '#fff', backgroundColor: 'rgba(255, 255, 255, 0.1)' }
              }}
            >
              {isMinimized ? <ExpandMoreIcon /> : <ExpandLessIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Collapse in={!isMinimized} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Add note form */}
          <Fade in={isAddingNote}>
            <Box 
              sx={{ 
                mb: 2, 
                display: isAddingNote ? 'block' : 'none',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(8px)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                p: 2,
              }}
            >
              <TextField
                multiline
                rows={3}
                placeholder="Write your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  variant="text" 
                  onClick={() => setIsAddingNote(false)}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleAddNote}
                  startIcon={<SaveIcon />}
                  disabled={!newNoteContent.trim()}
                  sx={{
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    color: '#fff',
                    '&:hover': {
                      backgroundColor: 'rgba(41, 128, 185, 0.9)',
                    },
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(52, 152, 219, 0.3)',
                      color: 'rgba(255, 255, 255, 0.5)',
                    },
                  }}
                >
                  Save
                </Button>
              </Box>
            </Box>
          </Fade>
          
          {/* Notes list */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.05)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
              },
            }}
          >
            {notes.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '200px',
                  opacity: 0.7,
                }}
              >
                <StickyNote2Icon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                  No notes yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', mt: 1 }}>
                  Click the + button to add a note
                </Typography>
              </Box>
            ) : (
              notes.map(note => (
                <Paper
                  key={note.id}
                  elevation={0}
                  sx={{
                    mb: 2,
                    p: 2,
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '8px',
                    borderLeft: `4px solid ${note.color}`,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      background: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  {editingNoteId === note.id ? (
                    <Box>
                      <TextField
                        multiline
                        rows={3}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        fullWidth
                        variant="outlined"
                        autoFocus
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.2)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.3)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                            },
                          },
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={handleCancelEdit}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleSaveEdit(note.id)}
                          sx={{ color: note.color }}
                          disabled={!editingContent.trim()}
                        >
                          <SaveIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#fff',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {note.content}
                      </Typography>
                      
                      <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="caption" 
                          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          {format(new Date(note.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                        
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditNote(note)}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': { color: '#fff' }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteNote(note.id)}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              '&:hover': { color: '#e74c3c' }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </>
                  )}
                </Paper>
              ))
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default NotesWidget; 