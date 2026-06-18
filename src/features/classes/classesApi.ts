import { axiosClient } from '@/api/axiosClient';
import type {
  ClassLesson,
  ClassStudent,
  LessonType,
  LessonTypeCatalog,
  SchoolClass,
} from '@/types/domain';

export interface LessonInput {
  lessonType: LessonType;
  teacherId?: number | null;
  sessionDurationMin: number;
  sessionsPerWeek: number;
}

export interface LessonPatch {
  teacherId?: number | null;
  sessionDurationMin?: number;
  sessionsPerWeek?: number;
}

export interface AutoAssignCriteria {
  limit?: number;
  order?: 'oldest' | 'newest' | 'random';
  payment?: 'all' | 'paidOnly';
  includeAssigned?: boolean;
}

export interface CreateClassInput {
  termId: number;
  level: string;
  section?: number;
  lessons?: LessonInput[];
  /** When present, students are auto-assigned right after the class is created. */
  autoAssign?: AutoAssignCriteria;
}

export interface UpdateClassInput {
  level?: string;
  section?: number;
  teacherId?: number | null;
}

/** Classes (sections) management against the REST API. */
export const classesApi = {
  async list(termId?: number): Promise<SchoolClass[]> {
    const { data } = await axiosClient.get<SchoolClass[]>('/classes', {
      params: termId ? { term_id: termId } : undefined,
    });
    return data;
  },

  async create(input: CreateClassInput): Promise<SchoolClass> {
    const { data } = await axiosClient.post<SchoolClass>('/classes', input);
    return data;
  },

  async update(id: number, patch: UpdateClassInput): Promise<SchoolClass> {
    const { data } = await axiosClient.patch<SchoolClass>(`/classes/${id}`, patch);
    return data;
  },

  async remove(id: number): Promise<void> {
    await axiosClient.delete(`/classes/${id}`);
  },

  async students(id: number): Promise<ClassStudent[]> {
    const { data } = await axiosClient.get<ClassStudent[]>(`/classes/${id}/students`);
    return data;
  },

  async assign(id: number, studentCodes: string[]): Promise<ClassStudent[]> {
    const { data } = await axiosClient.post<ClassStudent[]>(`/classes/${id}/students`, {
      studentCodes,
    });
    return data;
  },

  async autoAssign(id: number, criteria?: AutoAssignCriteria): Promise<ClassStudent[]> {
    const { data } = await axiosClient.post<ClassStudent[]>(
      `/classes/${id}/auto-assign`,
      criteria ?? {},
    );
    return data;
  },

  async unassign(id: number, code: string): Promise<void> {
    await axiosClient.delete(`/classes/${id}/students/${code}`);
  },

  async lessonTypes(): Promise<LessonTypeCatalog[]> {
    const { data } = await axiosClient.get<LessonTypeCatalog[]>('/classes/lesson-types');
    return data;
  },

  async lessons(id: number): Promise<ClassLesson[]> {
    const { data } = await axiosClient.get<ClassLesson[]>(`/classes/${id}/lessons`);
    return data;
  },

  async addLesson(id: number, input: LessonInput): Promise<ClassLesson> {
    const { data } = await axiosClient.post<ClassLesson>(`/classes/${id}/lessons`, input);
    return data;
  },

  async updateLesson(id: number, lessonId: number, patch: LessonPatch): Promise<ClassLesson> {
    const { data } = await axiosClient.patch<ClassLesson>(
      `/classes/${id}/lessons/${lessonId}`,
      patch,
    );
    return data;
  },

  async deleteLesson(id: number, lessonId: number): Promise<void> {
    await axiosClient.delete(`/classes/${id}/lessons/${lessonId}`);
  },
};
