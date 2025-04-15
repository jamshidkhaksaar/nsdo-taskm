import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { DepartmentService } from '../../services/DepartmentService';
import { Department as CanonicalDepartment } from '@/types/index';

// Define the initial state using the canonical Department type
interface DepartmentsState {
  departments: CanonicalDepartment[];
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
  CanonicalDepartment[],
  void,
  { rejectValue: string }
>(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const serviceDepartments = await DepartmentService.getDepartments();
      // Ensure all required fields are present
      const mappedDepartments: CanonicalDepartment[] = (serviceDepartments || []).map(dept => ({
        ...dept,
        id: String(dept.id),
        name: dept.name || '',
        description: dept.description || '',
        provinceId: dept.provinceId ?? null,
        headId: dept.headId ?? null,
        head: dept.head ?? null,
        members: dept.members ?? [],
        createdAt: dept.createdAt || '',
        updatedAt: dept.updatedAt || '',
      }));
      return mappedDepartments;
    } catch (error: any) {
      console.error("Error fetching departments:", error);
      return rejectWithValue(error.message || 'Failed to fetch departments');
    }
  }
);

export const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    setDepartments: (state, action: PayloadAction<CanonicalDepartment[]>) => {
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
      .addCase(fetchDepartments.fulfilled, (state, action: PayloadAction<CanonicalDepartment[]>) => {
        state.departments = action.payload.map(dept => ({ ...dept }));
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