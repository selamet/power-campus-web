import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ApiError } from '@/api/axiosClient';
import type { RootState } from '@/app/store';
import type {
  ScheduleReportItem,
  ScheduleSession,
  SchedulePreviewSession,
  TermScheduleSettings,
} from '@/types/domain';
import {
  scheduleApi,
  type ScheduleRules,
  type SessionCreateInput,
  type SessionMoveInput,
  type TermSettingsUpdate,
} from './scheduleApi';
import { normalizeRules } from './scheduleRules';

export type RequestStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

interface ScheduleState {
  settings: TermScheduleSettings | null;
  rules: ScheduleRules | null;
  savedSessions: ScheduleSession[];
  preview: SchedulePreviewSession[] | null;
  report: ScheduleReportItem[];
  status: RequestStatus;
  error: string | null;
  teacherSessions: ScheduleSession[];
  termSessions: ScheduleSession[];
  termPreview: SchedulePreviewSession[] | null;
  termReport: ScheduleReportItem[];
}

const initialState: ScheduleState = {
  settings: null,
  rules: null,
  savedSessions: [],
  preview: null,
  report: [],
  status: 'idle',
  error: null,
  teacherSessions: [],
  termSessions: [],
  termPreview: null,
  termReport: [],
};

const toMessage = (error: unknown): string =>
  (error as ApiError)?.message ?? 'İşlem sırasında bir hata oluştu.';

export const fetchSettings = createAsyncThunk(
  'schedule/fetchSettings',
  async (termId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.getSettings(termId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const saveSettings = createAsyncThunk(
  'schedule/saveSettings',
  async ({ termId, payload }: { termId: number; payload: TermSettingsUpdate }, { rejectWithValue }) => {
    try {
      return await scheduleApi.saveSettings(termId, payload);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const fetchConfig = createAsyncThunk(
  'schedule/fetchConfig',
  async (classId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.getConfig(classId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const saveConfig = createAsyncThunk(
  'schedule/saveConfig',
  async ({ classId, rules }: { classId: number; rules: ScheduleRules }, { rejectWithValue }) => {
    try {
      return await scheduleApi.saveConfig(classId, rules);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const fetchClassSchedule = createAsyncThunk(
  'schedule/fetchClassSchedule',
  async (classId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.classSchedule(classId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const generateClass = createAsyncThunk(
  'schedule/generate',
  async (classId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.generate(classId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const applyClass = createAsyncThunk(
  'schedule/apply',
  async (classId: number, { dispatch, rejectWithValue }) => {
    try {
      const result = await scheduleApi.apply(classId);
      await dispatch(fetchClassSchedule(classId));
      return result;
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const addSession = createAsyncThunk(
  'schedule/addSession',
  async (input: SessionCreateInput, { rejectWithValue }) => {
    try {
      return await scheduleApi.addSession(input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const moveSession = createAsyncThunk(
  'schedule/moveSession',
  async ({ id, input }: { id: number; input: SessionMoveInput }, { rejectWithValue }) => {
    try {
      return await scheduleApi.moveSession(id, input);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const toggleLock = createAsyncThunk(
  'schedule/toggleLock',
  async ({ id, locked }: { id: number; locked: boolean }, { rejectWithValue }) => {
    try {
      return await scheduleApi.lockSession(id, locked);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const deleteSession = createAsyncThunk(
  'schedule/deleteSession',
  async (id: number, { rejectWithValue }) => {
    try {
      await scheduleApi.deleteSession(id);
      return id;
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const fetchTeacherSchedule = createAsyncThunk(
  'schedule/fetchTeacherSchedule',
  async (teacherId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.teacherSchedule(teacherId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const fetchTermSchedule = createAsyncThunk(
  'schedule/fetchTermSchedule',
  async ({ termId, weekday }: { termId: number; weekday?: number }, { rejectWithValue }) => {
    try {
      return await scheduleApi.termSchedule(termId, weekday);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const generateTermThunk = createAsyncThunk(
  'schedule/generateTerm',
  async (termId: number, { rejectWithValue }) => {
    try {
      return await scheduleApi.generateTerm(termId);
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

export const applyTermThunk = createAsyncThunk(
  'schedule/applyTerm',
  async (termId: number, { dispatch, rejectWithValue }) => {
    try {
      const result = await scheduleApi.applyTerm(termId);
      await dispatch(fetchTermSchedule({ termId }));
      return result;
    } catch (error) {
      return rejectWithValue(toMessage(error));
    }
  },
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearPreview(state) {
      state.preview = null;
      state.report = [];
    },
    resetSchedule() {
      return initialState;
    },
    setRulesDraft(state, action: PayloadAction<ScheduleRules>) {
      state.rules = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(saveSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(fetchConfig.fulfilled, (state, action) => {
        state.rules = normalizeRules(action.payload.rules);
      })
      .addCase(saveConfig.fulfilled, (state, action) => {
        state.rules = normalizeRules(action.payload.rules);
      })
      .addCase(fetchClassSchedule.fulfilled, (state, action) => {
        state.savedSessions = action.payload;
      })
      .addCase(generateClass.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(generateClass.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.preview = action.payload.sessions;
        state.report = action.payload.report;
      })
      .addCase(generateClass.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(applyClass.fulfilled, (state, action) => {
        state.preview = null;
        state.report = action.payload.report;
      })
      .addCase(addSession.fulfilled, (state, action) => {
        state.savedSessions.push(action.payload);
      })
      .addCase(moveSession.fulfilled, (state, action) => {
        const i = state.savedSessions.findIndex((s) => s.id === action.payload.id);
        if (i !== -1) state.savedSessions[i] = action.payload;
      })
      .addCase(toggleLock.fulfilled, (state, action) => {
        const i = state.savedSessions.findIndex((s) => s.id === action.payload.id);
        if (i !== -1) state.savedSessions[i] = action.payload;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.savedSessions = state.savedSessions.filter((s) => s.id !== action.payload);
      })
      .addCase(fetchTeacherSchedule.fulfilled, (state, action) => {
        state.teacherSessions = action.payload;
      })
      .addCase(fetchTermSchedule.fulfilled, (state, action) => {
        state.termSessions = action.payload;
      })
      .addCase(generateTermThunk.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(generateTermThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.termPreview = action.payload.sessions;
        state.termReport = action.payload.report;
      })
      .addCase(generateTermThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      .addCase(applyTermThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.termPreview = null;
        state.termReport = action.payload.report;
      });
  },
});

export const { clearPreview, resetSchedule, setRulesDraft } = scheduleSlice.actions;
export default scheduleSlice.reducer;

export const selectSettings = (state: RootState): TermScheduleSettings | null =>
  state.schedule.settings;
export const selectRules = (state: RootState): ScheduleRules | null => state.schedule.rules;
export const selectSavedSessions = (state: RootState): ScheduleSession[] =>
  state.schedule.savedSessions;
export const selectPreview = (state: RootState): SchedulePreviewSession[] | null =>
  state.schedule.preview;
export const selectReport = (state: RootState): ScheduleReportItem[] => state.schedule.report;
export const selectScheduleStatus = (state: RootState): RequestStatus => state.schedule.status;
export const selectScheduleError = (state: RootState): string | null => state.schedule.error;
export const selectTeacherSessions = (state: RootState): ScheduleSession[] =>
  state.schedule.teacherSessions;
export const selectTermSessions = (state: RootState): ScheduleSession[] =>
  state.schedule.termSessions;
export const selectTermPreview = (state: RootState): SchedulePreviewSession[] | null =>
  state.schedule.termPreview;
export const selectTermReport = (state: RootState): ScheduleReportItem[] =>
  state.schedule.termReport;
