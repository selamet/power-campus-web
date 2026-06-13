import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { usePermission } from '@/features/auth/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { fetchStudents, selectStudents } from '@/features/students/studentsSlice';
import { AddStudentModal } from '@/features/students/components/AddStudentModal';
import { InviteFlowModal } from '@/features/students/components/InviteFlowModal';
import { paths } from '@/routes/paths';
import type { ShellContext } from './shellContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/** Authenticated app layout: sidebar + topbar around the routed content. */
export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const students = useAppSelector(selectStudents);
  const { hasAny } = usePermission();
  const canAdd = hasAny([PERMISSIONS.studentsWrite, PERMISSIONS.invitesWrite]);

  // The password-set guard already loaded the user; fetch the student list.
  useEffect(() => {
    void dispatch(fetchStudents());
  }, [dispatch]);

  const [navOpen, setNavOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { title, subtitle } = useMemo(() => {
    if (location.pathname.startsWith(paths.students)) {
      return { title: 'Öğrenciler', subtitle: `${students.length} kayıt` };
    }
    if (location.pathname.startsWith(paths.staff)) {
      return { title: 'Yetkililer', subtitle: 'Panel kullanıcıları ve izinleri' };
    }
    if (location.pathname.startsWith(paths.terms)) {
      return { title: 'Dönemler', subtitle: 'Kurs dönemleri (sömestr)' };
    }
    return {
      title: 'Genel Bakış',
      subtitle: `${user?.branch ?? 'Power Akademi'} · yönetim paneli`,
    };
  }, [location.pathname, students.length, user?.branch]);

  const shellContext: ShellContext = { search, openAddFlow: () => setChoiceOpen(true) };

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          subtitle={subtitle}
          search={search}
          onSearchChange={setSearch}
          onMenu={() => setNavOpen(true)}
          onAdd={() => setChoiceOpen(true)}
          canAdd={canAdd}
        />
        <main className="flex-1 p-7">
          <Outlet context={shellContext} />
        </main>
      </div>

      <AddStudentModal
        open={choiceOpen}
        onClose={() => setChoiceOpen(false)}
        onManual={() => {
          setChoiceOpen(false);
          navigate(paths.newStudent);
        }}
        onInvite={() => {
          setChoiceOpen(false);
          setInviteOpen(true);
        }}
      />

      <InviteFlowModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onPreview={() => {
          setInviteOpen(false);
          navigate(paths.welcomePreview);
        }}
      />
    </div>
  );
}
