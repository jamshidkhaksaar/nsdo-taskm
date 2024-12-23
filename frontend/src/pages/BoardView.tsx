import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AppDispatch, RootState } from '../store';
import { fetchBoards, updateCardPosition } from '../store/slices/boardSlice';
import { logout } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import { Board, BoardState, List, Card as TaskCard } from '../types';
import { updateCardPositionAPI } from '../services/api';
import { keyframes } from '@mui/system';
import { loadFull } from "tsparticles";
import Particles from "react-tsparticles";
import type { Container as TParticlesContainer, Engine } from "tsparticles-engine";

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { boards, loading, error } = useSelector((state: RootState) => state.board as BoardState);
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  const [localBoards, setLocalBoards] = useState<Board[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    if (boardId) {
      dispatch(fetchBoards());
    }
  }, [dispatch, boardId, isAuthenticated, token, navigate]);

  useEffect(() => {
    // Update local state when boards change
    setLocalBoards(boards);
  }, [boards]);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(logoutSuccess());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    // If no destination, do nothing
    if (!destination) return;

    // If dropped in the same position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    // Create a copy of local boards to modify
    const newBoards = [...localBoards];
    const currentBoard = newBoards.find(b => b.id === parseInt(boardId || '0'));

    if (!currentBoard) return;

    // Find the source and destination lists
    const sourceList = currentBoard.lists.find(
      list => list.id.toString() === source.droppableId
    );
    const destList = currentBoard.lists.find(
      list => list.id.toString() === destination.droppableId
    );

    if (!sourceList || !destList) return;

    // Remove the card from the source list
    const [movedCard] = sourceList.cards.splice(source.index, 1);

    // Add the card to the destination list
    destList.cards.splice(destination.index, 0, movedCard);

    // Recalculate order for cards in source and destination lists
    sourceList.cards = sourceList.cards.map((card, index) => ({
      ...card,
      order: index
    }));

    destList.cards = destList.cards.map((card, index) => ({
      ...card,
      order: index
    }));

    // Update local state
    setLocalBoards(newBoards);

    try {
      // Call API to update card position
      await updateCardPositionAPI({
        cardId: parseInt(draggableId),
        sourceListId: parseInt(source.droppableId),
        destListId: parseInt(destination.droppableId),
        newIndex: destination.index
      });

      // Dispatch Redux action to update store
      dispatch(updateCardPosition({
        cardId: parseInt(draggableId),
        sourceListId: parseInt(source.droppableId),
        destListId: parseInt(destination.droppableId),
        newIndex: destination.index
      }));
    } catch (error) {
      console.error('Error updating card position:', error);
      // Revert local state if API call fails
      setLocalBoards(boards);
    }
  };

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async (container: TParticlesContainer | undefined) => {
    console.log("Particles loaded", container);
  }, []);

  const fadeIn = keyframes`
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  `;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentBoard = localBoards.find(board => board.id === parseInt(boardId || '0'));

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e2a78 0%, #ff3c7d 100%)',
    }}>
      <AppBar 
        position="static" 
        sx={{ 
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentBoard?.title || 'Board View'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            title="Logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={{
            fullScreen: false,
            background: {
              color: {
                value: "transparent",
              },
            },
            fpsLimit: 120,
            particles: {
              color: {
                value: "#ffffff",
              },
              links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.3,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: {
                  default: "bounce",
                },
                random: false,
                speed: 2,
                straight: false,
              },
              number: {
                density: {
                  enable: true,
                  area: 800,
                },
                value: 80,
              },
              opacity: {
                value: 0.3,
              },
              shape: {
                type: "circle",
              },
              size: {
                value: { min: 1, max: 3 },
              },
            },
            detectRetina: true,
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: 0,
          }}
        />

        <Container 
          maxWidth="xl" 
          sx={{ 
            mt: 4, 
            mb: 4, 
            position: 'relative',
            zIndex: 1,
          }}
        >
          <DragDropContext onDragEnd={onDragEnd}>
            <Box 
              display="flex" 
              gap={2}
              sx={{ animation: `${fadeIn} 0.8s ease-out` }}
            >
              {currentBoard?.lists?.map((list: List) => (
                <Droppable key={list.id} droppableId={list.id.toString()}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        width: 300,
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(8px)',
                        p: 2,
                        borderRadius: '16px',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: 2,
                          color: '#fff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                        }}
                      >
                        {list.title}
                      </Typography>
                      
                      {list.cards?.map((card: TaskCard, index) => (
                        <Draggable
                          key={card.id}
                          draggableId={card.id.toString()}
                          index={index}
                        >
                          {(provided) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                mb: 1,
                                background: 'rgba(255, 255, 255, 0.15)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 4px 16px 0 rgba(31, 38, 135, 0.17)',
                              }}
                            >
                              <CardContent>
                                <Typography sx={{ color: '#fff' }}>
                                  {card.title}
                                </Typography>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              ))}
            </Box>
          </DragDropContext>
        </Container>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default BoardView;