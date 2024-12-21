import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Board, BoardState } from '../../types';
import { getBoards } from '../../services/api';

const initialState: BoardState = {
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,
};

export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async () => {
    const response = await getBoards();
    return response.data;
  }
);

interface UpdateCardPositionPayload {
  cardId: number;
  sourceListId: number;
  destListId: number;
  newIndex: number;
}

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setCurrentBoard: (state, action: PayloadAction<Board | null>) => {
      state.currentBoard = action.payload;
    },
    updateCardPosition: (state, action: PayloadAction<UpdateCardPositionPayload>) => {
      const { cardId, sourceListId, destListId, newIndex } = action.payload;

      // Find the board containing the lists
      const boardIndex = state.boards.findIndex(board => 
        board.lists.some(list => 
          list.id === sourceListId || list.id === destListId
        )
      );

      if (boardIndex === -1) return;

      const board = state.boards[boardIndex];

      // Find source and destination lists
      const sourceListIndex = board.lists.findIndex(list => list.id === sourceListId);
      const destListIndex = board.lists.findIndex(list => list.id === destListId);

      if (sourceListIndex === -1 || destListIndex === -1) return;

      // Find the card in the source list
      const sourceList = board.lists[sourceListIndex];
      const cardIndex = sourceList.cards.findIndex(card => card.id === cardId);

      if (cardIndex === -1) return;

      // Remove the card from the source list
      const [movedCard] = sourceList.cards.splice(cardIndex, 1);

      // Add the card to the destination list
      const destList = board.lists[destListIndex];
      destList.cards.splice(newIndex, 0, movedCard);

      // Recalculate order for cards in both lists
      sourceList.cards.forEach((card, index) => {
        card.order = index;
      });

      destList.cards.forEach((card, index) => {
        card.order = index;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch boards';
      });
  },
});

export const { setCurrentBoard, updateCardPosition } = boardSlice.actions;
export default boardSlice.reducer;