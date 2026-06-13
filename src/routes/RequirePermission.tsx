import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { usePermission } from '@/features/auth/usePermission';
import { paths } from './paths';

interface RequirePermissionProps {
  /** Permission the user must hold to view the nested routes. */
  permission: string;
}

/**
 * Guards nested routes by permission. While the authenticated user is still
 * loading (``/me`` in flight) nothing is rendered, so we never bounce a
 * permitted user off the page before their permissions arrive.
 */
export function RequirePermission({ permission }: RequirePermissionProps) {
  const user = useAppSelector(selectCurrentUser);
  const { has } = usePermission();

  if (!user) return null;
  if (!has(permission)) return <Navigate to={paths.overview} replace />;

  return <Outlet />;
}
