import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';

const QuickNotes: React.FC = () => {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  
  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem('quickNotes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);
  
  const saveNotes = (updatedNotes: string[]) => {
    localStorage.setItem('quickNotes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };
  
  const addNote = () => {
    if (newNote.trim()) {
      const updatedNotes = [...notes, newNote];
      saveNotes(updatedNotes);
      setNewNote('');
    }
  };
  
  const deleteNote = (index: number) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    saveNotes(updatedNotes);
  };
  
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
      }}
    >
      <CardContent>
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
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
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
        
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
          {notes.length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              No notes yet. Add one above!
            </Typography>
          ) : (
            notes.map((note, index) => (
              <ListItem
                key={index}
                sx={{
                  mb: 1,
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
                secondaryAction={
                  <IconButton edge="end" onClick={() => deleteNote(index)} sx={{ color: '#e57373' }}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText 
                  primary={note} 
                  sx={{ 
                    '& .MuiListItemText-primary': { 
                      color: '#fff',
                      wordBreak: 'break-word'
                    } 
                  }}
                />
              </ListItem>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default QuickNotes; 