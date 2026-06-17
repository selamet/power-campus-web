import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type { Teacher } from '@/types/domain';
import { teachersApi, type TeacherInput, type TeacherUpdateInput } from './teachersApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface TeachersState {
  items: Teacher[];
  status: RequestStatus;
  error: string | null;
}

const initialState: TeachersState = { items: [], status: 'idle', error: null };

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchTeachers = createAsyncThunk('teachers/fetch', async (_, { rejectWithValue }) => {
  try {
    return await teachersApi.list();
  } catch (error) {
    return rejectWithValue(toMessage(error));
  }
});

export const fetchTeacher = createAsyncThunk(
  'teachers/fetchOne',
  async (id: number, { rejectWithValue }) => {
    try {
      return await teachersApi.get(id);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const createTeacher = createAsyncThunk(
  'teachers/create',
  async (input: TeacherInput, { rejectWithValue }) => {
    try {
      return await teachersApi.create(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const updateTeacher = createAsyncThunk(
  'teachers/update',
  async ({ id, patch }: { id: number; patch: TeacherUpdateInput }, { rejectWithValue }) => {
    try {
      return await teachersApi.update(id, patch);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const upsert = (items: Teacher[], teacher: Teacher): void => {
  const index = items.findIndex((t) => t.id === teacher.id);
  if (index === -1) items.unshift(teacher);
  else items[index] = teacher;
};

const teachersSlice = createSlice({
  name: 'teachers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachers.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTeachers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(fetchTeacher.fulfilled, (state, action) => upsert(state.items, action.payload))
      .addCase(createTeacher.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTeacher.fulfilled, (state, action) => upsert(state.items, action.payload));
  },
});

export default teachersSlice.reducer;

export const selectTeachers = (state: RootState): Teacher[] => state.teachers.items;
export const selectTeachersStatus = (state: RootState): RequestStatus => state.teachers.status;
export const selectTeacherById = (state: RootState, id: number): Teacher | undefined =>
  state.teachers.items.find((t) => t.id === id);
