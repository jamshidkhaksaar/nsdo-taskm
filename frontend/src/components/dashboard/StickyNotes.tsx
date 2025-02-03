import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  TextField,
  Fade,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import axios from '../../utils/axios';
import { format } from 'date-fns';

interface Note {
  id: string;
  content: string;
  color: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

const COLORS = [
  'rgba(255, 193, 7, 0.7)',   // amber
  'rgba(233, 30, 99, 0.7)',   // pink
  'rgba(156, 39, 176, 0.7)',  // purple
  'rgba(33, 150, 243, 0.7)',  // blue
  'rgba(76, 175, 80, 0.7)',   // green
];

const StickyNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get('/api/notes/');
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = async () => {
    if (newNoteContent.trim()) {
      try {
        const newNote = {
          content: newNoteContent,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
        };
        const response = await axios.post('/api/notes/', newNote);
        setNotes([...notes, response.data]);
        setNewNoteContent('');
      } catch (error) {
        console.error('Error adding note:', error);
      }
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await axios.delete(`/api/notes/${id}/`);
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const updateNote = async (id: string, content: string) => {
    try {
      const noteToUpdate = notes.find(note => note.id === id);
      if (!noteToUpdate) return;

      const response = await axios.patch(`/api/notes/${id}/`, {
        content,
        color: noteToUpdate.color,
      });
      
      setNotes(notes.map(note => 
        note.id === id ? response.data : note
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading notes...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '250px',
        height: '100vh',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(8px)',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
        pb: '28px',
        position: 'sticky',
        top: 0,
        maxHeight: '100vh',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255, 255, 255, 0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        },
      }}
    >
      <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
        Quick Notes
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          multiline
          rows={2}
          placeholder="Add a new note..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#fff',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
            },
          }}
        />
        <IconButton 
          onClick={addNote}
          sx={{ 
            mt: 1,
            color: '#fff',
            '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notes.map((note) => (
          <Fade in key={note.id}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                background: note.color,
                borderRadius: '24px',
                border: '1px solid rgba(0,0,0,0.1)',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.25)',
                },
              }}
            >
              {editingId === note.id ? (
                <>
                  <TextField
                    fullWidth
                    multiline
                    defaultValue={note.content}
                    autoFocus
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'rgba(0, 0, 0, 0.87)',
                      },
                    }}
                    onBlur={(e) => updateNote(note.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        updateNote(note.id, (e.target as HTMLInputElement).value);
                      }
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => updateNote(note.id, note.content)}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      bottom: 8,
                      color: 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    <CheckIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(0, 0, 0, 0.87)',
                      wordBreak: 'break-word',
                      mb: 2,
                    }}
                  >
                    {note.content}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      color: 'rgba(0, 0, 0, 0.6)',
                    }}
                  >
                    {format(new Date(note.created_at), 'MMM d, yyyy, h:mm a')}
                  </Typography>
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: 8,
                      display: 'flex',
                      gap: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setEditingId(note.id)}
                      sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteNote(note.id)}
                      sx={{ color: 'rgba(0, 0, 0, 0.6)' }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </>
              )}
            </Paper>
          </Fade>
        ))}
      </Box>
    </Box>
  );
};

export default StickyNotes; 