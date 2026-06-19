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
import { TermDetailPage } from '@/features/terms/TermDetailPage';
import { TermsPage } from '@/features/terms/TermsPage';
import { ClassDetailPage } from '@/features/classes/ClassDetailPage';
import { ClassesPage } from '@/features/classes/ClassesPage';
import { TeacherDetailPage } from '@/features/teachers/TeacherDetailPage';
import { TeachersPage } from '@/features/teachers/TeachersPage';
import { ScheduleHubPage } from '@/features/schedule/ScheduleHubPage';
import { SchedulePage } from '@/features/schedule/SchedulePage';
import { TeacherSchedulePage } from '@/features/schedule/TeacherSchedulePage';
import { TermSchedulePage } from '@/features/schedule/TermSchedulePage';
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
                children: [
                  { path: paths.terms, element: <TermsPage /> },
                  { path: paths.termDetail, element: <TermDetailPage /> },
                ],
              },
              {
                element: <RequirePermission permission={PERMISSIONS.classesRead} />,
                children: [
                  { path: paths.classes, element: <ClassesPage /> },
                  { path: paths.classDetail, element: <ClassDetailPage /> },
                ],
              },
              {
                element: <RequirePermission permission={PERMISSIONS.scheduleRead} />,
                children: [
                  { path: paths.schedule, element: <ScheduleHubPage /> },
                  { path: paths.classSchedule, element: <SchedulePage /> },
                  { path: paths.teacherSchedule, element: <TeacherSchedulePage /> },
                  { path: paths.termSchedule, element: <TermSchedulePage /> },
                ],
              },
              {
                element: <RequirePermission permission={PERMISSIONS.usersRead} />,
                children: [{ path: paths.staff, element: <StaffPage /> }],
              },
              {
                element: <RequirePermission permission={PERMISSIONS.teachersRead} />,
                children: [
                  { path: paths.teachers, element: <TeachersPage /> },
                  { path: paths.teacherDetail, element: <TeacherDetailPage /> },
                ],
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
