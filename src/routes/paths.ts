/** Centralized route paths. */
export const paths = {
  login: '/login',
  overview: '/',
  students: '/students',
  newStudent: '/students/new',
  welcome: '/welcome/:token',
  welcomePreview: '/welcome/preview',
} as const;
