import { axiosClient } from '@/api/axiosClient';
import type {
  LessonType,
  ScheduleReportItem,
  ScheduleSession,
  SchedulePreviewSession,
  TermScheduleSettings,
} from '@/types/domain';

export interface TermSettingsUpdate {
  workingDays: number[];
  dayStart: string;
  dayEnd: string;
  defaultDuration: number;
  defaultPerDay: number;
  breakMin: number;
  teacherRules?: Record<string, unknown>;
  dayWindows?: Record<string, { start: string; end: string }>;
}

/** One lesson's generator rule (subset the MVP UI edits). */
export interface LessonRule {
  lessonType: LessonType;
  durationMin: number;
  sessionsPerWeek: number;
  pinnedWeekday?: number;
  consecutive?: boolean;
}

/** The builder `rules` JSON. MVP edits `lessons` + `closedWeekdays`. */
export interface ScheduleRules {
  lessons: LessonRule[];
  closedWeekdays?: number[];
  separations?: string[][];
  [key: string]: unknown;
}

export interface SessionCreateInput {
  classLessonId: number;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface SessionMoveInput {
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface GeneratePreview {
  sessions: SchedulePreviewSession[];
  report: ScheduleReportItem[];
}

export interface ApplyResult {
  applied: number;
  report: ScheduleReportItem[];
}

export const scheduleApi = {
  async getSettings(termId: number): Promise<TermScheduleSettings> {
    const { data } = await axiosClient.get<TermScheduleSettings>(
      `/terms/${termId}/schedule/settings`,
    );
    return data;
  },

  async saveSettings(termId: number, payload: TermSettingsUpdate): Promise<TermScheduleSettings> {
    const { data } = await axiosClient.put<TermScheduleSettings>(
      `/terms/${termId}/schedule/settings`,
      payload,
    );
    return data;
  },

  async getConfig(classId: number): Promise<{ classId: number; rules: ScheduleRules }> {
    const { data } = await axiosClient.get<{ classId: number; rules: ScheduleRules }>(
      `/classes/${classId}/schedule/config`,
    );
    return data;
  },

  async saveConfig(classId: number, rules: ScheduleRules): Promise<{ classId: number; rules: ScheduleRules }> {
    const { data } = await axiosClient.put<{ classId: number; rules: ScheduleRules }>(
      `/classes/${classId}/schedule/config`,
      { rules },
    );
    return data;
  },

  async generate(classId: number): Promise<GeneratePreview> {
    const { data } = await axiosClient.post<GeneratePreview>(
      `/classes/${classId}/schedule/generate`,
    );
    return data;
  },

  async apply(classId: number): Promise<ApplyResult> {
    const { data } = await axiosClient.post<ApplyResult>(`/classes/${classId}/schedule/apply`);
    return data;
  },

  async classSchedule(classId: number): Promise<ScheduleSession[]> {
    const { data } = await axiosClient.get<ScheduleSession[]>(`/classes/${classId}/schedule`);
    return data;
  },

  async addSession(input: SessionCreateInput): Promise<ScheduleSession> {
    const { data } = await axiosClient.post<ScheduleSession>('/schedule/sessions', input);
    return data;
  },

  async moveSession(id: number, input: SessionMoveInput): Promise<ScheduleSession> {
    const { data } = await axiosClient.patch<ScheduleSession>(`/schedule/sessions/${id}`, input);
    return data;
  },

  async lockSession(id: number, locked: boolean): Promise<ScheduleSession> {
    const { data } = await axiosClient.patch<ScheduleSession>(
      `/schedule/sessions/${id}/lock`,
      { locked },
    );
    return data;
  },

  async deleteSession(id: number): Promise<void> {
    await axiosClient.delete(`/schedule/sessions/${id}`);
  },

  async teacherSchedule(teacherId: number): Promise<ScheduleSession[]> {
    const { data } = await axiosClient.get<ScheduleSession[]>(`/teachers/${teacherId}/schedule`);
    return data;
  },

  async termSchedule(termId: number, weekday?: number): Promise<ScheduleSession[]> {
    const { data } = await axiosClient.get<ScheduleSession[]>(`/terms/${termId}/schedule`, {
      params: weekday === undefined ? undefined : { weekday },
    });
    return data;
  },

  async generateTerm(termId: number): Promise<GeneratePreview> {
    const { data } = await axiosClient.post<GeneratePreview>(`/terms/${termId}/schedule/generate`);
    return data;
  },

  async applyTerm(termId: number): Promise<ApplyResult> {
    const { data } = await axiosClient.post<ApplyResult>(`/terms/${termId}/schedule/apply`);
    return data;
  },
};
