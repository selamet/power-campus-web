import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type {
  CreateStaffInput,
  PermissionGroup,
  StaffAccount,
  UpdateStaffInput,
} from '@/types/domain';
import { staffApi } from './staffApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface StaffState {
  items: StaffAccount[];
  catalog: PermissionGroup[];
  status: RequestStatus;
  error: string | null;
}

const initialState: StaffState = {
  items: [],
  catalog: [],
  status: 'idle',
  error: null,
};

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchStaff = createAsyncThunk('staff/fetch', async (_, { rejectWithValue }) => {
  try {
    return await staffApi.list();
  } catch (error) {
    return rejectWithValue(toMessage(error));
  }
});

export const fetchPermissionCatalog = createAsyncThunk(
  'staff/catalog',
  async (_, { rejectWithValue }) => {
    try {
      return await staffApi.catalog();
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const createStaff = createAsyncThunk(
  'staff/create',
  async (input: CreateStaffInput, { rejectWithValue }) => {
    try {
      return await staffApi.create(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const updateStaff = createAsyncThunk(
  'staff/update',
  async ({ id, patch }: { id: number; patch: UpdateStaffInput }, { rejectWithValue }) => {
    try {
      return await staffApi.update(id, patch);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Yetkililer yüklenemedi.';
      })
      .addCase(fetchPermissionCatalog.fulfilled, (state, action) => {
        state.catalog = action.payload;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        const index = state.items.findIndex((staff) => staff.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default staffSlice.reducer;

/* ---------------- Selectors ---------------- */
export const selectStaff = (state: RootState): StaffAccount[] => state.staff.items;
export const selectStaffStatus = (state: RootState): RequestStatus => state.staff.status;
export const selectStaffError = (state: RootState): string | null => state.staff.error;
export const selectPermissionCatalog = (state: RootState): PermissionGroup[] =>
  state.staff.catalog;
