import { useMemo } from 'react';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentUser } from './authSlice';

/**
 * Permission checks for the signed-in user. ``admin`` accounts implicitly hold
 * every permission, mirroring the backend's :func:`require_permission`.
 */
export function usePermission() {
  const user = useAppSelector(selectCurrentUser);
  return useMemo(() => {
    const isAdmin = user?.role === 'admin';
    const granted = new Set(user?.permissions ?? []);
    const has = (permission: string): boolean => isAdmin || granted.has(permission);
    return {
      isAdmin,
      has,
      hasAny: (permissions: string[]): boolean => permissions.some(has),
    };
  }, [user]);
}
