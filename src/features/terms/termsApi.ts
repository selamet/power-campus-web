import { axiosClient } from '@/api/axiosClient';
import type { StudentStatus, Term } from '@/types/domain';

export interface CreateTermInput {
  name?: string;
  start: string;
  end: string;
}

export interface UpdateTermInput {
  name?: string;
  start?: string;
  end?: string;
}

/** A student on a term's roster. */
export interface TermStudent {
  studentId: string;
  name: string;
  lang: string;
  level: string;
  course: string;
  status: StudentStatus;
  fee: number;
  paid: number;
}

/** Payload for bulk-enrolling existing students into a term. */
export interface BulkEnrollInput {
  studentCodes: string[];
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
}

/** Terms (semesters) management against the REST API. */
export const termsApi = {
  async list(): Promise<Term[]> {
    const { data } = await axiosClient.get<Term[]>('/terms');
    return data;
  },

  async create(input: CreateTermInput): Promise<Term> {
    const { data } = await axiosClient.post<Term>('/terms', input);
    return data;
  },

  async update(id: number, patch: UpdateTermInput): Promise<Term> {
    const { data } = await axiosClient.patch<Term>(`/terms/${id}`, patch);
    return data;
  },

  async students(id: number): Promise<TermStudent[]> {
    const { data } = await axiosClient.get<TermStudent[]>(`/terms/${id}/students`);
    return data;
  },

  async bulkEnroll(id: number, input: BulkEnrollInput): Promise<TermStudent[]> {
    const { data } = await axiosClient.post<TermStudent[]>(`/terms/${id}/enrollments`, input);
    return data;
  },
};
