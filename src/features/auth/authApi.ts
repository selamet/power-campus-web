import { axiosClient } from '@/api/axiosClient';
import { env } from '@/config/env';
import { MOCK_STAFF, mockDelay } from '@/mocks/data';
import type { Staff } from '@/types/domain';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: Staff;
  token: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    if (env.useMocks) {
      return mockDelay({ user: MOCK_STAFF, token: 'mock-jwt-token' }, 800);
    }
    const { data } = await axiosClient.post<LoginResult>('/auth/login', credentials);
    return data;
  },

  async me(): Promise<Staff> {
    if (env.useMocks) {
      return mockDelay(MOCK_STAFF);
    }
    const { data } = await axiosClient.get<Staff>('/auth/me');
    return data;
  },
};
