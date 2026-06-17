/** Centralized route paths. */
export const paths = {
  login: '/login',
  setPassword: '/parola-belirle',
  overview: '/',
  students: '/students',
  staff: '/staff',
  terms: '/terms',
  termDetail: '/terms/:id',
  classes: '/classes',
  classDetail: '/classes/:id',
  teachers: '/teachers',
  teacherDetail: '/teachers/:id',
  newStudent: '/students/new',
  studentDetail: '/students/:tckn',
  welcome: '/hosgeldin/:tckn',
  welcomePreview: '/hosgeldin/preview',
} as const;

/** Build the public invite link a student opens to fill in their own details. */
export const welcomeLink = (tckn: string) => `/hosgeldin/${tckn}`;

/**
 * Detail-page link for a student. Prefers the human identifier the panel
 * addresses students by — TCKN for Turkish students, passport number for
 * foreign ones — and falls back to the public code for records without either.
 */
export const studentLink = (student: {
  id: string;
  tckn?: string | null;
  passportNo?: string | null;
}) => `/students/${student.tckn || student.passportNo || student.id}`;

/** Detail-page link for a term. */
export const termLink = (id: number) => `/terms/${id}`;

/** Detail-page link for a class. */
export const classLink = (id: number) => `/classes/${id}`;

/** Detail-page link for a teacher. */
export const teacherLink = (id: number) => `/teachers/${id}`;
