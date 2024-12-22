import React, { useState } from 'react';
import { 
  Box, 
  Typography,
  IconButton,
  Paper,
  Tooltip,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface Note {
  id: number;
  content: string;
}

interface StickyNotesProps {
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

const StickyNotes: React.FC<StickyNotesProps> = ({ isMinimized, onToggleMinimize }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const addNote = () => {
    setNotes([...notes, { id: Date.now(), content: 'New note...' }]);
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <Box 
      sx={{ 
        height: isMinimized ? 'auto' : '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: isMinimized ? 'auto' : '100%',
        minWidth: isMinimized ? 280 : 'auto',
        maxWidth: isMinimized ? 320 : 'none',
        transition: (theme) => theme.transitions.create(
          ['width', 'min-width', 'max-width', 'height'],
          {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }
        ),
        transform: isMinimized && isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box sx={{ 
        p: isMinimized ? 1.5 : 2,
        borderBottom: isMinimized ? 0 : 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'background.paper',
        gap: 1,
        borderRadius: '8px 8px 0 0',
        transition: (theme) => theme.transitions.create(
          ['padding', 'border-radius', 'background-color'],
          {
            easing: theme.transitions.easing.easeInOut,
            duration: theme.transitions.duration.standard,
          }
        ),
        '&:hover': {
          bgcolor: isMinimized ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
        },
      }}>
        <Typography 
          variant={isMinimized ? "body1" : "h6"}
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(46, 125, 50, 0.1)',
            fontSize: isMinimized ? '0.9rem' : 'inherit',
            transition: (theme) => theme.transitions.create(
              ['font-size'],
              {
                easing: theme.transitions.easing.easeInOut,
                duration: theme.transitions.duration.standard,
              }
            ),
          }}
        >
          Quick Notes {!isMinimized && `(${notes.length})`}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!isMinimized && (
            <Tooltip title="Add new note">
              <IconButton 
                onClick={addNote} 
                size="small" 
                color="primary"
                sx={{
                  transition: (theme) => theme.transitions.create(
                    ['transform', 'opacity'],
                    {
                      easing: theme.transitions.easing.easeInOut,
                      duration: theme.transitions.duration.shorter,
                    }
                  ),
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={isMinimized ? "Expand" : "Minimize"}>
            <IconButton 
              onClick={onToggleMinimize} 
              size="small" 
              sx={{ 
                color: 'text.secondary',
                transition: (theme) => theme.transitions.create(
                  ['transform', 'color'],
                  {
                    easing: theme.transitions.easing.easeInOut,
                    duration: theme.transitions.duration.shorter,
                  }
                ),
                '&:hover': {
                  color: 'primary.main',
                  transform: 'scale(1.1)',
                },
              }}
            >
              {isMinimized ? <OpenInFullIcon /> : <RemoveIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Collapse 
        in={!isMinimized}
        timeout={300}
        sx={{
          transformOrigin: 'right',
        }}
      >
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: 'background.default',
          maxHeight: 'calc(100vh - 130px)',
          borderRadius: '0 0 8px 0',
        }}>
          {notes.map((note) => (
            <Paper
              key={note.id}
              sx={{
                p: 2,
                position: 'relative',
                bgcolor: '#fff9c4',
                '&:hover': {
                  '& .delete-button': {
                    opacity: 1,
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography
                  component="div"
                  contentEditable
                  suppressContentEditableWarning
                  sx={{
                    outline: 'none',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    flex: 1,
                    '&:empty:before': {
                      content: '"Write something..."',
                      color: 'text.disabled',
                    },
                  }}
                >
                  {note.content}
                </Typography>
                <IconButton 
                  size="small" 
                  className="delete-button"
                  onClick={() => deleteNote(note.id)}
                  sx={{ 
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    ml: 1,
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main',
                    },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          ))}

          {notes.length === 0 && (
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 200,
            }}>
              <Typography color="text.secondary">
                Add notes to keep track of your thoughts
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default StickyNotes; 