import { axiosClient } from '@/api/axiosClient';

/** Invite / self-service registration data access. */

export interface CreateInviteInput {
  tckn: string;
  phone: string;
  name?: string;
  lang: string;
  course: string;
}

export type InviteStatus = 'pending' | 'completed' | 'cancelled';

export interface Invite {
  tckn: string;
  name: string | null;
  lang: string;
  course: string;
  status: InviteStatus;
  /** Relative path of the shareable welcome link, e.g. "/hosgeldin/123...". */
  path?: string;
}

export interface WelcomeSubmitInput {
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  gender?: string;
  city?: string;
  address?: string;
  educationLevel?: string;
  school?: string;
  department?: string;
  grade?: string;
  contactName?: string;
  contactRelation?: string;
  contactPhone?: string;
}

export interface WelcomeSubmitResult {
  studentCode: string;
  status: string;
}

export const invitesApi = {
  async create(input: CreateInviteInput): Promise<Invite> {
    const { data } = await axiosClient.post<Invite>('/invites', input);
    return data;
  },

  async getPublic(tckn: string): Promise<Invite> {
    const { data } = await axiosClient.get<Invite>(`/invites/${tckn}`);
    return data;
  },

  async submit(tckn: string, input: WelcomeSubmitInput): Promise<WelcomeSubmitResult> {
    const { data } = await axiosClient.post<WelcomeSubmitResult>(`/invites/${tckn}/submit`, input);
    return data;
  },
};
