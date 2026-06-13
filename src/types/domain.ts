/**
 * Core domain models shared across features.
 * These mirror the shapes returned by the Power Akademi API.
 */

export type StudentStatus = 'active' | 'pending' | 'inactive';

export type StudentSource = 'davet' | 'manuel';

export interface Student {
  id: string;
  name: string;
  lang: string;
  level: string;
  course: string;
  status: StudentStatus;
  phone: string;
  start: string;
  fee: number;
  paid: number;
  plan: string;
  /** ISO date of the next payment, or null when fully paid. */
  next: string | null;
  joined: string;
  email: string;
  source?: StudentSource;
  /** Number of course terms ("kur") covered by this registration. */
  terms?: number;
  /** Free-form finance note entered during registration. */
  note?: string | null;
  // Extended profile, filled by the welcome or manual registration form.
  tckn?: string | null;
  /** Passport number for foreign students (keyed by passport instead of TCKN). */
  passportNo?: string | null;
  /** True when the student is a foreign national (has a passport, no TCKN). */
  isForeign?: boolean;
  birthDate?: string | null;
  gender?: string | null;
  city?: string | null;
  address?: string | null;
  educationLevel?: string | null;
  school?: string | null;
  department?: string | null;
  grade?: string | null;
  contactName?: string | null;
  contactRelation?: string | null;
  contactPhone?: string | null;
  /** Approval audit (null while the enrollment is pending). */
  approvedByName?: string | null;
  approvedAt?: string | null;
  /** The term (semester) this enrollment belongs to, if assigned. */
  termId?: number | null;
  termName?: string | null;
}

/** A teaching period (semester) courses run in. */
export interface Term {
  id: number;
  name: string;
  start: string;
  end: string;
  /** True when today falls inside the term's date range. */
  current: boolean;
}

/** Payload used when creating a student through the manual registration form. */
export type NewStudentInput = Omit<Student, 'id'> & {
  id?: string;
  /** Method of the opening payment, when one was collected at registration. */
  payMethod?: string;
};

export interface Staff {
  name: string;
  role: string;
  email: string;
  branch: string;
  /** Permission keys (`module:action`) the signed-in user holds. */
  permissions: string[];
  /** True until a provisioned user picks their own password on first login. */
  mustChangePassword: boolean;
}

/** A staff account as managed from the admin panel. */
export interface StaffAccount {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  isActive: boolean;
  permissions: string[];
  mustChangePassword: boolean;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  role: string;
  branch?: string | null;
  permissions: string[];
}

export interface UpdateStaffInput {
  name?: string;
  role?: string;
  branch?: string | null;
  isActive?: boolean;
  password?: string;
  permissions?: string[];
}

/** A single grantable permission, as described by the API catalog. */
export interface PermissionItem {
  key: string;
  action: string;
  label: string;
}

/** A module grouping related permissions in the editor. */
export interface PermissionGroup {
  module: string;
  label: string;
  permissions: PermissionItem[];
}

export type ActivityKind = 'accent' | 'neutral' | 'ok';

export interface ActivityItem {
  who: string;
  what: string;
  icon: string;
  kind: ActivityKind;
  time: string;
}

export interface StatusMeta {
  label: string;
  kind: 'ok' | 'warn' | 'neutral';
}
