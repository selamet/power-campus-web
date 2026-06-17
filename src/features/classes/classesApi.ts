import { axiosClient } from '@/api/axiosClient';
import type { ClassStudent, SchoolClass } from '@/types/domain';

export interface CreateClassInput {
  termId: number;
  level: string;
  section?: number;
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

  async autoAssign(id: number): Promise<ClassStudent[]> {
    const { data } = await axiosClient.post<ClassStudent[]>(`/classes/${id}/auto-assign`);
    return data;
  },

  async unassign(id: number, code: string): Promise<void> {
    await axiosClient.delete(`/classes/${id}/students/${code}`);
  },
};
