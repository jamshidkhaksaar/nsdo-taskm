import React, { useState } from 'react';
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

interface Note {
  id: string;
  content: string;
  color: string;
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

  const addNote = () => {
    if (newNoteContent.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        content: newNoteContent,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      setNotes([...notes, newNote]);
      setNewNoteContent('');
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
    setEditingId(null);
  };

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
                p: 2,
                background: note.color,
                borderRadius: 2,
                position: 'relative',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
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
                      pr: 6,
                    }}
                  >
                    {note.content}
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