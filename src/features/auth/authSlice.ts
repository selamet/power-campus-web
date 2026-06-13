import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import { tokenStorage } from '@/api/tokenStorage';
import type { RootState } from '@/app/store';
import type { Staff } from '@/types/domain';
import { authApi, type ChangePasswordInput, type LoginCredentials } from './authApi';

interface AuthState {
  user: Staff | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: tokenStorage.get(),
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const result = await authApi.login(credentials);
      tokenStorage.set(result.token);
      return result;
    } catch (error) {
      return rejectWithValue((error as ApiError)?.message ?? 'Giriş başarısız oldu.');
    }
  },
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.me();
    } catch (error) {
      return rejectWithValue((error as ApiError)?.message ?? 'Oturum doğrulanamadı.');
    }
  },
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (input: ChangePasswordInput, { rejectWithValue }) => {
    try {
      return await authApi.changePassword(input);
    } catch (error) {
      return rejectWithValue((error as ApiError)?.message ?? 'Parola güncellenemedi.');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      tokenStorage.clear();
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) ?? 'Giriş başarısız oldu.';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;

export const selectIsAuthenticated = (state: RootState): boolean => Boolean(state.auth.token);
export const selectCurrentUser = (state: RootState): Staff | null => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState): string | null => state.auth.error;
export const selectMustChangePassword = (state: RootState): boolean =>
  Boolean(state.auth.user?.mustChangePassword);
