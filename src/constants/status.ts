import type { StatusMeta, StudentStatus } from '@/types/domain';

/** Display metadata (label + badge kind) for each student status. */
export const STATUS: Record<StudentStatus, StatusMeta> = {
  active: { label: 'Aktif', kind: 'ok' },
  pending: { label: 'Onay Bekliyor', kind: 'warn' },
  inactive: { label: 'Pasif', kind: 'neutral' },
};
