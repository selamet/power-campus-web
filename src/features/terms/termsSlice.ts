import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type { Term } from '@/types/domain';
import { termsApi, type CreateTermInput, type UpdateTermInput } from './termsApi';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface TermsState {
  items: Term[];
  status: RequestStatus;
  error: string | null;
}

const initialState: TermsState = {
  items: [],
  status: 'idle',
  error: null,
};

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchTerms = createAsyncThunk('terms/fetch', async (_, { rejectWithValue }) => {
  try {
    return await termsApi.list();
  } catch (error) {
    return rejectWithValue(toMessage(error));
  }
});

export const createTerm = createAsyncThunk(
  'terms/create',
  async (input: CreateTermInput, { rejectWithValue }) => {
    try {
      return await termsApi.create(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const updateTerm = createAsyncThunk(
  'terms/update',
  async ({ id, patch }: { id: number; patch: UpdateTermInput }, { rejectWithValue }) => {
    try {
      return await termsApi.update(id, patch);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const termsSlice = createSlice({
  name: 'terms',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerms.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTerms.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTerms.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Dönemler yüklenemedi.';
      })
      .addCase(createTerm.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTerm.fulfilled, (state, action) => {
        const index = state.items.findIndex((term) => term.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      });
  },
});

export default termsSlice.reducer;

/* ---------------- Selectors ---------------- */
export const selectTerms = (state: RootState): Term[] => state.terms.items;
export const selectTermsStatus = (state: RootState): RequestStatus => state.terms.status;
export const selectTermsError = (state: RootState): string | null => state.terms.error;

/** The term whose date range contains today, if any. */
export const selectCurrentTerm = (state: RootState): Term | undefined =>
  state.terms.items.find((term) => term.current);
