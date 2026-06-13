import { axiosClient } from '@/api/axiosClient';
import type {
  CreateStaffInput,
  PermissionGroup,
  StaffAccount,
  UpdateStaffInput,
} from '@/types/domain';

/** Staff (authorized people) management against the REST API. */
export const staffApi = {
  async list(): Promise<StaffAccount[]> {
    const { data } = await axiosClient.get<StaffAccount[]>('/users');
    return data;
  },

  async catalog(): Promise<PermissionGroup[]> {
    const { data } = await axiosClient.get<PermissionGroup[]>('/users/permissions/catalog');
    return data;
  },

  async create(input: CreateStaffInput): Promise<StaffAccount> {
    const { data } = await axiosClient.post<StaffAccount>('/users', input);
    return data;
  },

  async update(id: number, patch: UpdateStaffInput): Promise<StaffAccount> {
    const { data } = await axiosClient.patch<StaffAccount>(`/users/${id}`, patch);
    return data;
  },
};
