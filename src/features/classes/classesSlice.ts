import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type { SchoolClass } from '@/types/domain';
import { classesApi, type CreateClassInput, type UpdateClassInput } from './classesApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ClassesState {
  items: SchoolClass[];
  status: RequestStatus;
  error: string | null;
}

const initialState: ClassesState = {
  items: [],
  status: 'idle',
  error: null,
};

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchClasses = createAsyncThunk(
  'classes/fetch',
  async (termId: number | undefined, { rejectWithValue }) => {
    try {
      return await classesApi.list(termId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const createClass = createAsyncThunk(
  'classes/create',
  async (input: CreateClassInput, { rejectWithValue }) => {
    try {
      return await classesApi.create(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const updateClass = createAsyncThunk(
  'classes/update',
  async ({ id, patch }: { id: number; patch: UpdateClassInput }, { rejectWithValue }) => {
    try {
      return await classesApi.update(id, patch);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const deleteClass = createAsyncThunk(
  'classes/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      await classesApi.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const classesSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Sınıflar yüklenemedi.';
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateClass.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(deleteClass.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload);
      });
  },
});

export default classesSlice.reducer;

/* ---------------- Selectors ---------------- */
export const selectClasses = (state: RootState): SchoolClass[] => state.classes.items;
export const selectClassesStatus = (state: RootState): RequestStatus => state.classes.status;
export const selectClassesError = (state: RootState): string | null => state.classes.error;
