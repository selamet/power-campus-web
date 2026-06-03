/** Centralized route paths. */
export const paths = {
  login: '/login',
  overview: '/',
  students: '/students',
  newStudent: '/students/new',
  welcome: '/hosgeldin/:tckn',
  welcomePreview: '/hosgeldin/preview',
} as const;

/** Build the public invite link a student opens to fill in their own details. */
export const welcomeLink = (tckn: string) => `/hosgeldin/${tckn}`;
