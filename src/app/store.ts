import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import classesReducer from '@/features/classes/classesSlice';
import staffReducer from '@/features/staff/staffSlice';
import studentsReducer from '@/features/students/studentsSlice';
import termsReducer from '@/features/terms/termsSlice';
import uiReducer, { persistUiState } from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    classes: classesReducer,
    staff: staffReducer,
    students: studentsReducer,
    terms: termsReducer,
    ui: uiReducer,
  },
});

// Persist UI preferences whenever they change.
let lastUi = store.getState().ui;
store.subscribe(() => {
  const { ui } = store.getState();
  if (ui !== lastUi) {
    lastUi = ui;
    persistUiState(ui);
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
