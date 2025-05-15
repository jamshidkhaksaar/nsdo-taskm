import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  CircularProgress,
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
import { NoteService, QuickNote } from '../../services/noteService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

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

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState(NOTE_COLORS[0]);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user: currentUser } = useSelector((state: RootState) => state.auth);

  const fetchNotes = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedNotes = await NoteService.getNotes();
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
      setError('Failed to load notes. Please try again later.');
      setNotes([]);
    }
    setIsLoading(false);
  }, [currentUser]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async () => {
    if (!newNoteContent.trim()) return;
    setIsLoading(true);
    try {
      const newNote = await NoteService.addNote({ 
        content: newNoteContent,
        color: NOTE_COLORS[0]
      });
      setNotes(prevNotes => [newNote, ...prevNotes]);
      setNewNoteContent('');
    } catch (err) {
      console.error('Failed to add note:', err);
      setError('Failed to save note.');
    }
    setIsLoading(false);
  };

  const deleteNote = async (id: string) => {
    setIsLoading(true);
    try {
      await NoteService.deleteNote(id);
      setNotes(prevNotes => prevNotes.filter((note) => note.id !== id));
    } catch (err) {
      console.error('Failed to delete note:', err);
      setError('Failed to delete note.');
    }
    setIsLoading(false);
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

  const saveEditNote = async (id: string) => {
    if (!editContent.trim()) return;
    setIsLoading(true);
    try {
      const updatedNote = await NoteService.updateNote(id, { content: editContent, color: editColor });
      setNotes(prevNotes => prevNotes.map(note => (note.id === id ? updatedNote : note)));
      cancelEditNote();
    } catch (err) {
      console.error('Failed to save edited note:', err);
      setError('Failed to save changes.');
    }
    setIsLoading(false);
  };

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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <StyledAddNoteField
            fullWidth
            variant="outlined"
            placeholder="Add a quick note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && addNote()}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={addNote} edge="end" sx={{ color: '#64b5f6' }} disabled={isLoading}>
                    {isLoading && notes.length === 0 ? <CircularProgress size={20} /> : <AddIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading && notes.length === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2}}>
            <CircularProgress />
          </Box>
        )}

        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
          {!isLoading && notes.length === 0 && !error && (
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', py: 2 }}>
              No notes yet. Add one above!
            </Typography>
          )}
          {notes.map((note) => (
            <NoteCard key={note.id} bgColor={note.color}>
              {editingNoteId === note.id ? (
                // Edit Mode
                <CardContent sx={{ p: 1, pb: '8px !important' }}>
                  <StyledEditField
                    fullWidth
                    multiline
                    variant="standard"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    inputRef={editInputRef}
                    disabled={isLoading}
                  />
                  <Stack direction="row" spacing={0.5} sx={{ mt: 1, mb: 0.5 }} justifyContent="flex-start">
                    {NOTE_COLORS.map((colorOption) => (
                      <Tooltip title={colorOption} key={colorOption}>
                        <ColorButton 
                          colorValue={colorOption} 
                          isSelected={editColor === colorOption}
                          onClick={() => setEditColor(colorOption)}
                          disabled={isLoading}
                        />
                      </Tooltip>
                    ))}
                  </Stack>
                </CardContent>
              ) : (
                // View Mode
                <CardContent sx={{ p: 1.5, pb: '12px !important' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#fff' }}>
                    {note.content}
                  </Typography>
                </CardContent>
              )}
              <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 1, pb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                  {format(new Date(note.updated_at || note.created_at), 'MMM d, HH:mm')}
                </Typography>
                <Box>
                  {editingNoteId === note.id ? (
                    <>
                      <IconButton size="small" onClick={() => saveEditNote(note.id)} sx={{ color: '#81c784' }} disabled={isLoading}>
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={cancelEditNote} sx={{ color: '#e57373' }} disabled={isLoading}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton size="small" onClick={() => startEditNote(note)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} disabled={isLoading}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => deleteNote(note.id)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} disabled={isLoading}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardActions>
            </NoteCard>
          ))}
        </Box>
      </StyledCardContent>
    </StyledCard>
  );
};

export default NotesWidget;