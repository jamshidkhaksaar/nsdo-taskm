import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { UserService } from '../../services/user'; // Import the real UserService from user.ts
import { User as UserType } from '../../types/user'; // Renamed imported type to UserType

// Define a type for the user state (local interface)
interface User {
  id: string;
  name: string; // Derived from first/last name
  first_name?: string;
  last_name?: string;
  avatar?: string;
  // Add other relevant user properties
}

// Define the initial state using the local User interface
interface UsersState {
  users: User[]; // Use local User interface
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

// Async thunk for fetching users
export const fetchUsers = createAsyncThunk<
  UserType[],
  void,
  { rejectValue: string }
>(
  'users/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      // Use the imported real UserService
      const users = await UserService.getUsers();
      // We need to be careful about the type returned by the real service.
      // Let's assume it returns data compatible with UserType from `../../types/user`
      // If not, mapping/type assertion might be needed here.
      return users as UserType[];
    } catch (error: any) {
      console.error("Error fetching users with real service:", error);
      return rejectWithValue(error.message || 'Failed to fetch users');
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload.map(user => ({ ...user }));
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserType[]>) => {
        if (Array.isArray(action.payload)) {
          state.users = action.payload.map(user => ({
            id: String(user.id),
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `User ${user.id}`,
            first_name: user.first_name,
            last_name: user.last_name,
            avatar: user.avatar,
          }));
        } else {
          // Handle cases where payload is not an array, e.g., log an error and set users to empty array
          console.error('[userSlice] fetchUsers.fulfilled: action.payload is not an array:', action.payload);
          state.users = []; // Default to empty array or handle as appropriate
          state.error = 'Received invalid user data format'; // Optionally set an error state
        }
        state.loading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Action creators are generated for each case reducer function
export const { setUsers } = usersSlice.actions;

export default usersSlice.reducer; 