import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { store } from '@/app/store';
import { ThemeManager } from '@/app/ThemeManager';
import { ToastProvider } from '@/components/ui';
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { RegistrationFormPage } from '@/features/students/RegistrationFormPage';
import { StudentDetailPage } from '@/features/students/StudentDetailPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { WelcomeFormPage } from '@/features/students/WelcomeFormPage';
import { TermsPage } from '@/features/terms/TermsPage';
import { AppShell } from '@/layout/AppShell';
import { PERMISSIONS } from '@/constants/permissions';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RequirePasswordSet } from '@/routes/RequirePasswordSet';
import { RequirePermission } from '@/routes/RequirePermission';
import { paths } from '@/routes/paths';
import '@/styles/global.css';

const router = createBrowserRouter([
  { path: paths.login, element: <LoginPage /> },
  // Public, no-auth routes: the invite link the student fills in themselves.
  { path: paths.welcome, element: <WelcomeFormPage /> },
  { path: paths.welcomePreview, element: <WelcomeFormPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: paths.setPassword, element: <ChangePasswordPage /> },
      {
        element: <RequirePasswordSet />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: paths.overview, element: <DashboardPage /> },
              { path: paths.students, element: <StudentsPage /> },
              { path: paths.studentDetail, element: <StudentDetailPage /> },
              {
                element: <RequirePermission permission={PERMISSIONS.termsRead} />,
                children: [{ path: paths.terms, element: <TermsPage /> }],
              },
              {
                element: <RequirePermission permission={PERMISSIONS.usersRead} />,
                children: [{ path: paths.staff, element: <StaffPage /> }],
              },
            ],
          },
          { path: paths.newStudent, element: <RegistrationFormPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={paths.overview} replace /> },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeManager />
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </Provider>
  </StrictMode>,
);
