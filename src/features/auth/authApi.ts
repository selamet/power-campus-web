import { axiosClient } from '@/api/axiosClient';
import type { Staff } from '@/types/domain';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: Staff;
  token: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const { data } = await axiosClient.post<LoginResult>('/auth/login', credentials);
    return data;
  },

  async me(): Promise<Staff> {
    const { data } = await axiosClient.get<Staff>('/auth/me');
    return data;
  },

  async changePassword(input: ChangePasswordInput): Promise<LoginResult> {
    const { data } = await axiosClient.post<LoginResult>('/auth/password', input);
    return data;
  },
};
