import { axiosClient } from '@/api/axiosClient';
import type { NewStudentInput, Student, StudentActivity, StudentStatus } from '@/types/domain';

/** Editable subset of a student (everything except the generated id). */
export type StudentUpdateInput = Partial<Omit<Student, 'id'>>;

/** One term registration of a student (matches the API's EnrollmentOut). */
export interface Enrollment {
  id: number;
  termId: number | null;
  termName: string | null;
  lang: string;
  level: string;
  course: string;
  plan: string;
  status: StudentStatus;
  fee: number;
  paid: number;
  terms: number;
  note: string | null;
  start: string;
  next: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
}

/** Payload for enrolling an existing student into another term. */
export interface NewEnrollmentInput {
  termId?: number | null;
  lang: string;
  level: string;
  course: string;
  plan: string;
  fee: number;
  paid?: number;
  next?: string | null;
  start: string;
  terms?: number;
  note?: string | null;
  payMethod?: string;
}

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

  /** Fetch one student by TCKN (or the public PA- code for records without one). */
  async get(identifier: string): Promise<Student> {
    const { data } = await axiosClient.get<Student>(`/students/${identifier}`);
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

  async enrollments(id: string): Promise<Enrollment[]> {
    const { data } = await axiosClient.get<Enrollment[]>(`/students/${id}/enrollments`);
    return data;
  },

  async activity(id: string): Promise<StudentActivity[]> {
    const { data } = await axiosClient.get<StudentActivity[]>(`/students/${id}/activity`);
    return data;
  },

  async addEnrollment(id: string, input: NewEnrollmentInput): Promise<Student> {
    const { data } = await axiosClient.post<Student>(`/students/${id}/enrollments`, input);
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
