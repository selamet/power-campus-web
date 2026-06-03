import { axiosClient } from '@/api/axiosClient';
import { env } from '@/config/env';
import { mockDelay } from '@/mocks/data';

/**
 * Invite / self-service registration data access. Talks to the REST API, or
 * resolves bundled mock data when VITE_USE_MOCKS is enabled.
 */

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
    if (env.useMocks) {
      return mockDelay({ ...input, name: input.name ?? null, status: 'pending', path: `/hosgeldin/${input.tckn}` });
    }
    const { data } = await axiosClient.post<Invite>('/invites', input);
    return data;
  },

  async getPublic(tckn: string): Promise<Invite> {
    if (env.useMocks) {
      return mockDelay({ tckn, name: null, lang: 'İngilizce', course: 'Online Canlı', status: 'pending' });
    }
    const { data } = await axiosClient.get<Invite>(`/invites/${tckn}`);
    return data;
  },

  async submit(tckn: string, input: WelcomeSubmitInput): Promise<WelcomeSubmitResult> {
    if (env.useMocks) {
      return mockDelay({ studentCode: 'PA-1099', status: 'pending' });
    }
    const { data } = await axiosClient.post<WelcomeSubmitResult>(`/invites/${tckn}/submit`, input);
    return data;
  },
};
