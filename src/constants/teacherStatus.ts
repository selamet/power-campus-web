import type { BadgeKind } from '@/components/ui';
import type { TeacherStatus } from '@/types/domain';

export const TEACHER_STATUS: Record<TeacherStatus, { label: string; kind: BadgeKind }> = {
  active: { label: 'Aktif', kind: 'ok' },
  inactive: { label: 'Pasif', kind: 'neutral' },
};
