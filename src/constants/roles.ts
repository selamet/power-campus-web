/** Turkish display labels for the English role values returned by the API. */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Yönetici',
  teacher: 'Öğretmen',
  student: 'Öğrenci',
};

export const roleLabel = (role?: string): string =>
  (role && ROLE_LABELS[role]) || 'Personel';
