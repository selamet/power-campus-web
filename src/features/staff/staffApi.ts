import { axiosClient } from '@/api/axiosClient';
import { PERMISSIONS } from '@/constants/permissions';
import { env } from '@/config/env';
import { MOCK_PERMISSION_CATALOG, MOCK_STAFF_ACCOUNTS, mockDelay } from '@/mocks/data';
import type {
  CreateStaffInput,
  PermissionGroup,
  StaffAccount,
  UpdateStaffInput,
} from '@/types/domain';

// In-memory copy so mock mutations persist across the session.
let mockStore: StaffAccount[] = [...MOCK_STAFF_ACCOUNTS];
let mockNextId = 100;

const effectivePermissions = (role: string, permissions: string[]): string[] =>
  role === 'admin' ? Object.values(PERMISSIONS) : permissions;

/**
 * Staff (authorized people) data access. Calls the REST API, or resolves
 * bundled mock data when VITE_USE_MOCKS is enabled.
 */
export const staffApi = {
  async list(): Promise<StaffAccount[]> {
    if (env.useMocks) {
      return mockDelay([...mockStore]);
    }
    const { data } = await axiosClient.get<StaffAccount[]>('/users');
    return data;
  },

  async catalog(): Promise<PermissionGroup[]> {
    if (env.useMocks) {
      return mockDelay(MOCK_PERMISSION_CATALOG);
    }
    const { data } = await axiosClient.get<PermissionGroup[]>('/users/permissions/catalog');
    return data;
  },

  async create(input: CreateStaffInput): Promise<StaffAccount> {
    if (env.useMocks) {
      const created: StaffAccount = {
        id: mockNextId++,
        name: input.name,
        email: input.email,
        role: input.role,
        branch: input.branch ?? null,
        isActive: true,
        permissions: effectivePermissions(input.role, input.permissions),
      };
      mockStore = [created, ...mockStore];
      return mockDelay(created);
    }
    const { data } = await axiosClient.post<StaffAccount>('/users', input);
    return data;
  },

  async update(id: number, patch: UpdateStaffInput): Promise<StaffAccount> {
    if (env.useMocks) {
      mockStore = mockStore.map((staff) => {
        if (staff.id !== id) return staff;
        const role = patch.role ?? staff.role;
        const permissions = patch.permissions ?? staff.permissions;
        return {
          ...staff,
          name: patch.name ?? staff.name,
          role,
          branch: patch.branch !== undefined ? patch.branch : staff.branch,
          isActive: patch.isActive ?? staff.isActive,
          permissions: effectivePermissions(role, permissions),
        };
      });
      const updated = mockStore.find((staff) => staff.id === id);
      if (!updated) throw { status: 404, message: 'Kullanıcı bulunamadı' };
      return mockDelay(updated);
    }
    const { data } = await axiosClient.patch<StaffAccount>(`/users/${id}`, patch);
    return data;
  },
};
