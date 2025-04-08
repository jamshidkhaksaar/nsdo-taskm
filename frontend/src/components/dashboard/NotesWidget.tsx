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
  CircularProgress,
  Skeleton
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
import { NotesService, Note } from '../../services/notes';

const COLORS = [
  '#3498db', // Blue
  '#2ecc71', // Green
  '#e74c3c', // Red
  '#f39c12', // Orange
  '#9b59b6', // Purple
];

// Skeleton for loading notes
const NoteSkeleton = () => (
  <Box sx={{ mb: 2 }}>
    <Skeleton
      variant="rectangular"
      width="100%"
      height={60}
      sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)', borderRadius: 1 }}
    />
  </Box>
);

const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const fetchedNotes = await NotesService.getNotes();
      setNotes(fetchedNotes);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (newNoteContent.trim()) {
      try {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const newNote = await NotesService.createNote({
          content: newNoteContent.trim(),
          color
        });

        if (newNote) {
          setNotes((prevNotes) => [newNote, ...prevNotes]);
          setNewNoteContent('');
          setIsAddingNote(false);
        }
      } catch (error) {
        console.error('Failed to create note:', error);
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const success = await NotesService.deleteNote(id);
      if (success) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      }
    } catch (error) {
      console.error(`Failed to delete note ${id}:`, error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = async (id: string) => {
    if (editingContent.trim()) {
      try {
        const updatedNote = await NotesService.updateNote(id, {
          content: editingContent.trim()
        });

        if (updatedNote) {
          setNotes((prevNotes) =>
            prevNotes.map((note) => (note.id === id ? updatedNote : note))
          );
        }
      } catch (error) {
        console.error(`Failed to update note ${id}:`, error);
      }
    }
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  return (
    <>
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
          minHeight: '200px'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            Quick Notes {notes.length > 0 && `(${notes.length})`}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Add new note">
              <IconButton
                onClick={() => setIsAddingNote(true)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: '#fff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  mr: 1
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              p: 2,
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {isLoading && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100px'
                }}
              >
                <CircularProgress
                  size={30}
                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                />
              </Box>
            )}

            <Fade in={isAddingNote}>
              <Box
                sx={{
                  mb: 2,
                  display: isAddingNote ? 'block' : 'none',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  p: 2
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
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)'
                      }
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1
                    }
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 1,
                    mt: 1
                  }}
                >
                  <Button
                    variant="text"
                    onClick={() => setIsAddingNote(false)}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      }
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
                        backgroundColor: 'rgba(41, 128, 185, 0.9)'
                      },
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(52, 152, 219, 0.3)',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }
                    }}
                  >
                    Save Note
                  </Button>
                </Box>
              </Box>
            </Fade>

            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '4px'
                }
              }}
            >
              {isLoading ? (
                Array.from(new Array(3)).map((_, index) => (
                  <NoteSkeleton key={index} />
                ))
              ) : notes.length === 0 ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    minHeight: '200px',
                    opacity: 0.7
                  }}
                >
                  <StickyNote2Icon
                    sx={{
                      fontSize: 48,
                      color: 'rgba(255, 255, 255, 0.3)',
                      mb: 2
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textAlign: 'center'
                    }}
                  >
                    No notes yet
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.3)',
                      textAlign: 'center',
                      mt: 1
                    }}
                  >
                    Click the + button to add a note
                  </Typography>
                </Box>
              ) : (
                notes.map((note, index) => (
                  <Fade
                    in={true}
                    timeout={300 + index * 50}
                    key={note.id}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        mb: 2,
                        p: 2,
                        position: 'relative',
                        borderLeft: `4px solid ${note.color || '#3498db'}`,
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '4px',
                        '&:hover .note-actions': {
                          opacity: 1
                        }
                      }}
                    >
                      {editingNoteId === note.id ? (
                        <Box>
                          <TextField
                            multiline
                            rows={3}
                            value={editingContent}
                            onChange={(e) =>
                              setEditingContent(e.target.value)
                            }
                            fullWidth
                            variant="outlined"
                            autoFocus
                            sx={{
                              mb: 1,
                              '& .MuiOutlinedInput-root': {
                                color: '#fff',
                                '& fieldset': {
                                  borderColor:
                                    'rgba(255, 255, 255, 0.2)'
                                },
                                '&:hover fieldset': {
                                  borderColor:
                                    'rgba(255, 255, 255, 0.3)'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor:
                                    'rgba(255, 255, 255, 0.5)'
                                }
                              }
                            }}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: 1
                            }}
                          >
                            <Button
                              onClick={handleCancelEdit}
                              size="small"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.7)'
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() =>
                                handleSaveEdit(note.id)
                              }
                              size="small"
                              variant="contained"
                              sx={{ bgcolor: 'primary.main' }}
                            >
                              Save
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#fff',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word'
                            }}
                          >
                            {note.content}
                          </Typography>

                          <Divider
                            sx={{
                              my: 1,
                              borderColor:
                                'rgba(255, 255, 255, 0.1)'
                            }}
                          />

                          <Box
                            className="note-actions"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              display: 'flex',
                              gap: 0.5,
                              opacity: 0,
                              transition:
                                'opacity 0.2s ease-in-out'
                            }}
                          >
                            <Tooltip title="Edit note">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleEditNote(note)
                                }
                                sx={{
                                  color:
                                    'rgba(255, 255, 255, 0.6)',
                                  '&:hover': { color: '#fff' }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete note">
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDeleteNote(note.id)
                                }
                                sx={{
                                  color:
                                    'rgba(255, 255, 255, 0.6)',
                                  '&:hover': {
                                    color: '#e74c3c'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Fade>
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default NotesWidget;