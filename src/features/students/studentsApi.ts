import { axiosClient } from '@/api/axiosClient';
import type { NewStudentInput, Student } from '@/types/domain';

/** Editable subset of a student (everything except the generated id). */
export type StudentUpdateInput = Partial<Omit<Student, 'id'>>;

export type InstallmentStatus = 'paid' | 'partial' | 'overdue' | 'pending';

export interface Installment {
  sequence: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: InstallmentStatus;
}

export interface Payment {
  id: number;
  amount: number;
  paidAt: string;
  method: string;
  note: string | null;
}

export interface RecordPaymentInput {
  amount: number;
  paidAt: string;
  method: string;
  note?: string;
}

/** Students data access against the REST API. */
export const studentsApi = {
  async list(): Promise<Student[]> {
    const { data } = await axiosClient.get<Student[]>('/students');
    return data;
  },

  async create(input: NewStudentInput): Promise<Student> {
    const { data } = await axiosClient.post<Student>('/students', input);
    return data;
  },

  async update(id: string, patch: StudentUpdateInput): Promise<Student> {
    const { data } = await axiosClient.patch<Student>(`/students/${id}`, patch);
    return data;
  },

  async installments(id: string): Promise<Installment[]> {
    const { data } = await axiosClient.get<Installment[]>(`/students/${id}/installments`);
    return data;
  },

  async payments(id: string): Promise<Payment[]> {
    const { data } = await axiosClient.get<Payment[]>(`/students/${id}/payments`);
    return data;
  },

  async recordPayment(id: string, input: RecordPaymentInput): Promise<Student> {
    const { data } = await axiosClient.post<Student>(`/students/${id}/payments`, input);
    return data;
  },

  async approve(id: string): Promise<Student> {
    const { data } = await axiosClient.patch<Student>(`/students/${id}/approve`);
    return data;
  },

  async reject(id: string): Promise<string> {
    await axiosClient.patch(`/students/${id}/reject`);
    return id;
  },
};
