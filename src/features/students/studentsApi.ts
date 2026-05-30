import { axiosClient } from '@/api/axiosClient';
import { env } from '@/config/env';
import { MOCK_STUDENTS, mockDelay } from '@/mocks/data';
import type { NewStudentInput, Student } from '@/types/domain';

/**
 * Students data access. Each function calls the REST API, or resolves bundled
 * mock data when VITE_USE_MOCKS is enabled. Swapping to the real backend is a
 * matter of flipping the env flag — call sites stay unchanged.
 */

// In-memory copy so mock mutations (approve/reject/create) persist per session.
let mockStore: Student[] = [...MOCK_STUDENTS];

const generateMockId = (): string => `PA-${1060 + Math.floor(Math.random() * 939)}`;

export const studentsApi = {
  async list(): Promise<Student[]> {
    if (env.useMocks) {
      return mockDelay([...mockStore]);
    }
    const { data } = await axiosClient.get<Student[]>('/students');
    return data;
  },

  async create(input: NewStudentInput): Promise<Student> {
    if (env.useMocks) {
      const created: Student = { ...input, id: input.id ?? generateMockId() };
      mockStore = [created, ...mockStore];
      return mockDelay(created);
    }
    const { data } = await axiosClient.post<Student>('/students', input);
    return data;
  },

  async approve(id: string): Promise<Student> {
    if (env.useMocks) {
      mockStore = mockStore.map((student) =>
        student.id === id ? { ...student, status: 'active' } : student,
      );
      const updated = mockStore.find((student) => student.id === id);
      if (!updated) throw { status: 404, message: 'Öğrenci bulunamadı' };
      return mockDelay(updated);
    }
    const { data } = await axiosClient.patch<Student>(`/students/${id}/approve`);
    return data;
  },

  async reject(id: string): Promise<string> {
    if (env.useMocks) {
      mockStore = mockStore.filter((student) => student.id !== id);
      return mockDelay(id);
    }
    await axiosClient.patch(`/students/${id}/reject`);
    return id;
  },
};
