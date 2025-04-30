import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  StickyNote2 as StickyNote2Icon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import createMuiStyles from '../../utils/muiStyleFixes';

// Define available note colors
const NOTE_COLORS = [
  'rgba(25, 118, 210, 0.8)', // blue
  'rgba(46, 125, 50, 0.8)',  // green
  'rgba(211, 47, 47, 0.8)',  // red
  'rgba(123, 31, 162, 0.8)', // purple
  'rgba(245, 124, 0, 0.8)',  // orange
];

// Define styled components using the MUI style fixes utility
const StyledCard = styled(Card)(
  createMuiStyles({
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.37)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    marginBottom: '24px',
    borderRadius: '8px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  })
);

const StyledCardContent = styled(CardContent)(
  createMuiStyles({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  })
);

const StyledAddNoteField = styled(TextField)(
  createMuiStyles({
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
  })
);

const StyledEditField = styled(TextField)(
  createMuiStyles({
    '& .MuiInputBase-root': { 
      paddingTop: 0,
      paddingBottom: 0 
    },
    '& .MuiInputBase-input': { 
      color: '#fff' 
    },
    '& .MuiInput-underline:before': { 
      borderBottomColor: 'rgba(255, 255, 255, 0.3)' 
    },
    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { 
      borderBottomColor: 'rgba(255, 255, 255, 0.5)' 
    },
    '& .MuiInput-underline:after': { 
      borderBottomColor: '#64b5f6' 
    },
  })
);

const ColorButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'colorValue' && prop !== 'isSelected',
})<{ colorValue: string; isSelected: boolean }>(({ colorValue, isSelected }) => 
  createMuiStyles({
    backgroundColor: colorValue,
    border: isSelected ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.3)',
    width: 20,
    height: 20,
    '&:hover': {
      backgroundColor: colorValue,
      opacity: 0.8,
    },
  })
);

const NoteCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'bgColor',
})<{ bgColor: string }>(({ bgColor }) =>
  createMuiStyles({
    marginBottom: '12px',
    background: bgColor,
  })
);

interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  color: string;
}

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(NOTE_COLORS[0]);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('quickNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes:', e);
        setNotes([]);
      }
    }
  }, []);

  const saveNotes = (updatedNotes: QuickNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem('quickNotes', JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newNoteContent.trim()) return;
    const now = new Date().toISOString();
    const newNote: QuickNote = {
      id: uuidv4(),
      content: newNoteContent,
      createdAt: now,
      updatedAt: now,
      color: NOTE_COLORS[0], // Default color
    };
    saveNotes([newNote, ...notes]);
    setNewNoteContent('');
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter((note) => note.id !== id);
    saveNotes(updatedNotes);
  };

  const startEditNote = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
    setEditColor(note.color);
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 50);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setEditContent('');
    setEditColor(NOTE_COLORS[0]);
  };

  const saveEditNote = (id: string) => {
    if (!editContent.trim()) return;
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, content: editContent, updatedAt: new Date().toISOString(), color: editColor }
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
    <StyledCard>
      <StyledCardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <StickyNote2Icon sx={{ color: '#64b5f6' }} />
          <Typography variant="h6" sx={{ color: '#fff' }}>
            Quick Notes
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <StyledAddNoteField
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
          />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {notes.length === 0 ? (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              No notes yet. Add one above!
            </Typography>
          ) : (
            notes.map((note) => (
              <NoteCard key={note.id} bgColor={note.color}>
                {editingNoteId === note.id ? (
                  // Edit Mode
                  <>
                    <CardContent sx={{ pb: '8px !important' }}>
                      <StyledEditField
                        fullWidth
                        multiline
                        variant="standard"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        inputRef={editInputRef}
                      />
                      {/* Color Selection Swatches */}
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        {NOTE_COLORS.map((colorOption) => (
                          <Tooltip key={colorOption} title="Set color">
                            <ColorButton
                              size="small"
                              colorValue={colorOption}
                              isSelected={editColor === colorOption}
                              onClick={() => setEditColor(colorOption)}
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
              </NoteCard>
            ))
          )}
        </Box>
      </StyledCardContent>
    </StyledCard>
  );
};

export default NotesWidget;