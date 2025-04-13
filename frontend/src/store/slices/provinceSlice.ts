import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getAdminProvinces } from '@/services/provinceService/index'; // Corrected import name and path

// Basic Province interface (refine if shared type exists)
interface Province {
  id: string; // Or number, adjust based on API
  name: string;
  description?: string; // Added optional description field
}

interface ProvincesState {
  provinces: Province[];
  loading: boolean;
  error: string | null;
}

const initialState: ProvincesState = {
  provinces: [],
  loading: false,
  error: null,
};

// Async thunk for fetching provinces
export const fetchProvinces = createAsyncThunk<
  Province[],
  void,
  { rejectValue: string }
>(
  'provinces/fetchProvinces',
  async (_, { rejectWithValue }) => {
    console.log("[fetchProvinces] Thunk started"); // Debug log
    try {
      console.log("[fetchProvinces] Calling getAdminProvinces service function..."); // Debug log
      const provinces = await getAdminProvinces(); // Corrected function call
      console.log("[fetchProvinces] Service function returned:", provinces); // Debug log
      return provinces || [];
    } catch (error: any) {
      console.error("[fetchProvinces] Error caught in thunk:", error); // Debug log
      return rejectWithValue(error.message || 'Failed to fetch provinces');
    }
  }
);

// Add thunks for create, update, delete as needed later...

export const provinceSlice = createSlice({
  name: 'provinces',
  initialState,
  reducers: {
    // Basic reducer to set provinces (e.g., after create/update)
    setProvinces: (state, action: PayloadAction<Province[]>) => {
      state.provinces = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProvinces.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProvinces.fulfilled, (state, action: PayloadAction<Province[]>) => {
        // Ensure IDs are strings and description exists (provide fallback)
        state.provinces = action.payload.map(p => ({
           // ...p, // Avoid simple spread if types might mismatch slightly
           id: String(p.id),
           name: p.name || '', // Ensure name has a value
           description: p.description || '', // Ensure description exists, default to empty string
         }));
        state.loading = false;
      })
      .addCase(fetchProvinces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // Add cases for create/update/delete thunks later...
  },
});

export const { setProvinces } = provinceSlice.actions;

export default provinceSlice.reducer; 