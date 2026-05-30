import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type { NewStudentInput, Student } from '@/types/domain';
import { studentsApi } from './studentsApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface StudentsState {
  items: Student[];
  status: RequestStatus;
  error: string | null;
}

const initialState: StudentsState = {
  items: [],
  status: 'idle',
  error: null,
};

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchStudents = createAsyncThunk('students/fetch', async (_, { rejectWithValue }) => {
  try {
    return await studentsApi.list();
  } catch (error) {
    return rejectWithValue(toMessage(error));
  }
});

export const createStudent = createAsyncThunk(
  'students/create',
  async (input: NewStudentInput, { rejectWithValue }) => {
    try {
      return await studentsApi.create(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const approveStudent = createAsyncThunk(
  'students/approve',
  async (id: string, { rejectWithValue }) => {
    try {
      return await studentsApi.approve(id);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const rejectStudent = createAsyncThunk(
  'students/reject',
  async (id: string, { rejectWithValue }) => {
    try {
      return await studentsApi.reject(id);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Öğrenciler yüklenemedi.';
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(approveStudent.fulfilled, (state, action) => {
        const index = state.items.findIndex((student) => student.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(rejectStudent.fulfilled, (state, action) => {
        state.items = state.items.filter((student) => student.id !== action.payload);
      });
  },
});

export default studentsSlice.reducer;

/* ---------------- Selectors ---------------- */
export const selectStudents = (state: RootState): Student[] => state.students.items;
export const selectStudentsStatus = (state: RootState): RequestStatus => state.students.status;
export const selectStudentsError = (state: RootState): string | null => state.students.error;

export const selectStudentsByStatus = createSelector(
  [selectStudents, (_: RootState, status: Student['status']) => status],
  (students, status) => students.filter((student) => student.status === status),
);

export const selectPendingStudents = (state: RootState): Student[] =>
  state.students.items.filter((student) => student.status === 'pending');
