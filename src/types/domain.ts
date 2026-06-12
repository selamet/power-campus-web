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
