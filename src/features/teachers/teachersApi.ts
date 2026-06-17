import { axiosClient } from '@/api/axiosClient';
import type { SchoolClass, Teacher, TeacherStatus } from '@/types/domain';

export interface TeacherInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: TeacherStatus;
  languages?: string[];
  levels?: string[];
  note?: string | null;
}

export type TeacherUpdateInput = Partial<TeacherInput>;

/** Teachers management against the REST API. */
export const teachersApi = {
  async list(status?: TeacherStatus): Promise<Teacher[]> {
    const { data } = await axiosClient.get<Teacher[]>('/teachers', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  async get(id: number): Promise<Teacher> {
    const { data } = await axiosClient.get<Teacher>(`/teachers/${id}`);
    return data;
  },

  async create(input: TeacherInput): Promise<Teacher> {
    const { data } = await axiosClient.post<Teacher>('/teachers', input);
    return data;
  },

  async update(id: number, patch: TeacherUpdateInput): Promise<Teacher> {
    const { data } = await axiosClient.patch<Teacher>(`/teachers/${id}`, patch);
    return data;
  },

  async classes(id: number): Promise<SchoolClass[]> {
    const { data } = await axiosClient.get<SchoolClass[]>(`/teachers/${id}/classes`);
    return data;
  },
};
