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

/** A class (section) within a term, e.g. "A1/1". */
export interface SchoolClass {
  id: number;
  termId: number;
  termName: string;
  /** Full level label, e.g. "A1 — Başlangıç". */
  level: string;
  section: number;
  /** Display label, e.g. "A1/1". */
  name: string;
  studentCount: number;
  /** True when the class's term is the current one. */
  current: boolean;
  teacherId?: number | null;
  teacherName?: string | null;
}

/** A student on a class roster. */
export interface ClassStudent {
  studentId: string;
  name: string;
  level: string;
  status: StudentStatus;
}

export type LessonType = 'speaking' | 'reading' | 'writing' | 'speaking_club';

export interface ClassLesson {
  id: number;
  classId: number;
  lessonType: LessonType;
  lessonTypeLabel: string;
  teacherId: number | null;
  teacherName: string | null;
  sessionDurationMin: number;
  sessionsPerWeek: number;
  weeklyTotalMin: number;
}

export interface LessonTypeCatalog {
  value: LessonType;
  label: string;
  defaultSessionsPerWeek: number;
  defaultDurationMin: number;
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

export type StudentActivityKind =
  | 'created'
  | 'approved'
  | 'enrolled'
  | 'payment_recorded'
  | 'status_changed'
  | 'note_added';

/** One entry in a student's activity log. */
export interface StudentActivity {
  id: number;
  kind: StudentActivityKind;
  message: string;
  meta?: Record<string, unknown> | null;
  actorName?: string | null;
  createdAt: string;
}

export type TeacherStatus = 'active' | 'inactive';

export interface Teacher {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: TeacherStatus;
  languages: string[];
  levels: string[];
  note: string | null;
  classCount: number;
}
