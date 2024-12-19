import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { AppDispatch, RootState } from '../store';
import { fetchBoards, updateCardPosition } from '../store/slices/boardSlice';
import { logout } from '../services/api';
import { logoutSuccess } from '../store/slices/authSlice';
import { Board, List, Card as TaskCard } from '../types';
import { updateCardPositionAPI } from '../services/api';

const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { boards, loading, error } = useSelector((state: RootState) => state.board);
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
    const updateSourceCards = sourceList.cards.map((card, index) => ({
      ...card,
      order: index
    }));

    const updateDestCards = destList.cards.map((card, index) => ({
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentBoard = localBoards.find(board => board.id === parseInt(boardId || '0'));

  return (
    <>
      <AppBar position="static">
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

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error ? (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Box display="flex" gap={2}>
              {currentBoard?.lists?.map((list: List) => (
                <Droppable key={list.id} droppableId={list.id.toString()}>
                  {(provided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        width: 300,
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="h6" sx={{ mb: 2 }}>
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
                              sx={{ mb: 1 }}
                            >
                              <CardContent>
                                <Typography>{card.title}</Typography>
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
        )}
      </Container>
    </>
  );
};

export default BoardView;