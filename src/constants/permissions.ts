/** Permission keys mirrored from the API (`module:action`). */
export const PERMISSIONS = {
  dashboardRead: 'dashboard:read',
  studentsRead: 'students:read',
  studentsWrite: 'students:write',
  financeRead: 'finance:read',
  financeWrite: 'finance:write',
  invitesWrite: 'invites:write',
  termsRead: 'terms:read',
  termsWrite: 'terms:write',
  classesRead: 'classes:read',
  classesWrite: 'classes:write',
  usersRead: 'users:read',
  usersWrite: 'users:write',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
