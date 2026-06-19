import { NavLink } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Avatar, Icon, Logo } from '@/components/ui';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { usePermission } from '@/features/auth/usePermission';
import { PERMISSIONS } from '@/constants/permissions';
import { roleLabel } from '@/constants/roles';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  /** Permission required to see this item; omitted means always visible. */
  permission?: string;
}

const NAV: NavItem[] = [
  { to: paths.overview, label: 'Genel Bakış', icon: 'grid', end: true, permission: PERMISSIONS.dashboardRead },
  { to: paths.students, label: 'Öğrenciler', icon: 'users', permission: PERMISSIONS.studentsRead },
  { to: paths.terms, label: 'Dönemler', icon: 'calendar', permission: PERMISSIONS.termsRead },
  { to: paths.classes, label: 'Sınıflar', icon: 'layers', permission: PERMISSIONS.classesRead },
  { to: paths.teachers, label: 'Öğretmenler', icon: 'user', permission: PERMISSIONS.teachersRead },
  { to: paths.schedule, label: 'Ders Programı', icon: 'clock', permission: PERMISSIONS.scheduleRead },
  { to: paths.staff, label: 'Yetkililer', icon: 'shield', permission: PERMISSIONS.usersRead },
];

const NAV_SOON = [
  { label: 'Yoklama', icon: 'clipboard' },
  { label: 'Dökümanlar', icon: 'folder' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAppSelector(selectCurrentUser);
  const { has } = usePermission();
  const navItems = NAV.filter((item) => !item.permission || has(item.permission));

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="sidebar-scrim fixed inset-0 z-40 bg-[hsl(20_30%_8%/0.5)] backdrop-blur-[2px]"
        />
      )}
      <aside
        data-open={open}
        className="sidebar sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-surface"
        style={{ width: 'var(--sidebar-w)' }}
      >
        <div className="px-5 pt-[22px] pb-4">
          <Logo height={30} />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-1.5">
          <div className="kicker px-2.5 pt-3 pb-2">Menü</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'relative mb-[3px] flex items-center gap-3 rounded-[11px] px-3 py-[11px] text-[14.5px] transition-all duration-150',
                  isActive
                    ? 'bg-accent-soft font-semibold text-accent-strong'
                    : 'font-medium text-ink-2 hover:bg-surface-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-[3px] bg-accent" />
                  )}
                  <Icon name={item.icon} size={19} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}

          <div className="kicker px-2.5 pt-[18px] pb-2">Yakında</div>
          {NAV_SOON.map((item) => (
            <div
              key={item.label}
              title="Yakında eklenecek"
              className="mb-[3px] flex cursor-not-allowed items-center gap-3 rounded-[11px] px-3 py-[11px] text-[14.5px] font-medium text-ink-3 opacity-65"
            >
              <Icon name={item.icon} size={19} />
              {item.label}
              <span className="ml-auto rounded-md bg-bg-2 px-1.5 py-[3px] font-mono text-[9.5px] font-bold tracking-[0.05em] text-ink-3">
                YAKINDA
              </span>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-[11px] p-2">
            <Avatar name={user?.name ?? 'Power Akademi'} size={38} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13.5px] font-semibold">
                {user?.name ?? 'Power Akademi'}
              </span>
              <span className="font-mono text-[10.5px] tracking-[0.04em] text-accent">
                {roleLabel(user?.role).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
