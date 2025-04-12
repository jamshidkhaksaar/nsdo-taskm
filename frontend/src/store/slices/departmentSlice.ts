import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DepartmentService } from '../../services/DepartmentService';
import { Department as DepartmentType } from '../../types/department'; // Import type and alias

// Define a type for the department state (local interface)
interface Department {
  id: string;
  name: string;
  // Add other relevant department properties if needed locally
}

// Define the initial state using the local interface
interface DepartmentsState {
  departments: Department[]; // Use local Department interface
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  departments: [],
  loading: false,
  error: null,
};

// Async thunk for fetching departments
export const fetchDepartments = createAsyncThunk<
  DepartmentType[], // Return type uses imported alias
  void,
  { rejectValue: string }
>(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const serviceDepartments = await DepartmentService.getDepartments();
      // Map the result from the service (string ID) to DepartmentType (number ID)
      const mappedDepartments: DepartmentType[] = (serviceDepartments || []).map(dept => ({
        ...dept,
        id: parseInt(String(dept.id), 10), // Convert string ID to number
        // Ensure other properties match DepartmentType as needed
        name: dept.name || '',
      }));
      return mappedDepartments;
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      // Consider rejecting with a more specific error object if needed
      return rejectWithValue(error.message || 'Failed to fetch departments');
    }
  }
);

export const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    // Action payload uses local Department interface if setting local state
    setDepartments: (state, action: PayloadAction<Department[]>) => {
      state.departments = action.payload.map(dept => ({ ...dept }));
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fulfilled action payload uses imported DepartmentType
      .addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<DepartmentType[]>) => {
        // Map fetched DepartmentType[] to local Department[] structure
        state.departments = action.payload.map(dept => ({
          id: String(dept.id), // Ensure ID is string
          name: dept.name || '', // Ensure name exists
          // Add other mappings if local interface differs
        }));
        state.loading = false;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setDepartments } = departmentsSlice.actions;

export default departmentsSlice.reducer; 