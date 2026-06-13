import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchCurrentUser, selectCurrentUser } from '@/features/auth/authSlice';
import { paths } from './paths';

/**
 * Blocks the app until a provisioned user has chosen their own password.
 *
 * Loads the authenticated user (so a page reload with a stored token is
 * handled too) and, while ``mustChangePassword`` is set, redirects every
 * protected route to the password-reset screen.
 */
export function RequirePasswordSet() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (!user) void dispatch(fetchCurrentUser());
  }, [user, dispatch]);

  if (!user) return null;
  if (user.mustChangePassword) return <Navigate to={paths.setPassword} replace />;

  return <Outlet />;
}
