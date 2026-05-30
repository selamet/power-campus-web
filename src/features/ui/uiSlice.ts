import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export type ThemeMode = 'light' | 'dark';
export type Density = 'compact' | 'regular' | 'comfy';

export interface UiState {
  theme: ThemeMode;
  /** Accent color as a hex string; drives the runtime accent hue. */
  accent: string;
  density: Density;
  /** Base corner radius in pixels. */
  radius: number;
}

const STORAGE_KEY = 'pa-ui-prefs';

const defaultState: UiState = {
  theme: 'light',
  accent: '#DC2626',
  density: 'regular',
  radius: 14,
};

const loadState = (): UiState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...(JSON.parse(raw) as Partial<UiState>) };
  } catch {
    return defaultState;
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: loadState(),
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setAccent(state, action: PayloadAction<string>) {
      state.accent = action.payload;
    },
    setDensity(state, action: PayloadAction<Density>) {
      state.density = action.payload;
    },
    setRadius(state, action: PayloadAction<number>) {
      state.radius = action.payload;
    },
  },
});

export const { setTheme, toggleTheme, setAccent, setDensity, setRadius } = uiSlice.actions;
export default uiSlice.reducer;

export const selectUi = (state: RootState): UiState => state.ui;
export const selectTheme = (state: RootState): ThemeMode => state.ui.theme;

/** Persists UI preferences to localStorage; wired up as a store subscriber. */
export const persistUiState = (state: UiState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage write failures (e.g. private mode quota).
  }
};
