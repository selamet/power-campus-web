import { axiosClient } from '@/api/axiosClient';
import type { Term } from '@/types/domain';

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
};
