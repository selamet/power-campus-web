/** Centralized route paths. */
export const paths = {
  login: '/login',
  setPassword: '/parola-belirle',
  overview: '/',
  students: '/students',
  staff: '/staff',
  terms: '/terms',
  newStudent: '/students/new',
  studentDetail: '/students/:tckn',
  welcome: '/hosgeldin/:tckn',
  welcomePreview: '/hosgeldin/preview',
} as const;

/** Build the public invite link a student opens to fill in their own details. */
export const welcomeLink = (tckn: string) => `/hosgeldin/${tckn}`;

/**
 * Detail-page link for a student. Prefers the TCKN (the address the panel uses)
 * and falls back to the public code for records without one (manual entries).
 */
export const studentLink = (student: { id: string; tckn?: string | null }) =>
  `/students/${student.tckn || student.id}`;
