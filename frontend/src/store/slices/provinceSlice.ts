import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { getAdminProvinces, getPublicProvinces } from '@/services/provinceService/index';
import { RootState } from '..';

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

// Async thunk for fetching provinces (Role-aware)
export const fetchProvinces = createAsyncThunk<
  Province[],
  void,
  { rejectValue: string; state: RootState }
>(
  'provinces/fetchProvinces',
  async (_, { rejectWithValue, getState }) => {
    console.log("[fetchProvinces] Thunk started");
    try {
      const state = getState();
      const userAuthRole = state.auth.user?.role; // userRole can be a string or an object

      let provinces: Province[];
      let roleNameString: string | undefined;

      if (typeof userAuthRole === 'string') {
        roleNameString = userAuthRole.toLowerCase();
      } else if (userAuthRole && typeof userAuthRole === 'object' && 'name' in userAuthRole && typeof (userAuthRole as any).name === 'string') {
        // Ensures 'name' exists as a property and is a string before accessing
        roleNameString = (userAuthRole as any).name.toLowerCase();
      }

      if (roleNameString === 'admin') {
        console.log("[fetchProvinces] User is ADMIN, calling getAdminProvinces...");
        provinces = await getAdminProvinces();
      } else {
        console.log("[fetchProvinces] User is not ADMIN (or role name indeterminate), calling getPublicProvinces...");
        provinces = await getPublicProvinces();
      }

      console.log("[fetchProvinces] Service function returned:", provinces);
      return provinces || [];
    } catch (error: any) {
      console.error("[fetchProvinces] Error caught in thunk:", error);
      const errorMessage = error.response?.status === 403 
          ? 'You do not have permission to access province data.' 
          : error.message || 'Failed to fetch provinces';
      return rejectWithValue(errorMessage);
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