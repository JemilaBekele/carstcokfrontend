// components/PermissionGuard.tsx
'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { usePermissionStore } from '@/stores/auth.store';
import { useCheckPermissions } from '@/stores/checker';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  mode?: 'all' | 'any';
  /** When true, renders nothing while loading instead of waiting */
  hideInsteadOfRedirect?: boolean;
}

export const PermissionGuard = ({
  children,
  requiredPermission,
  requiredPermissions,
  mode = 'any',
}: PermissionGuardProps) => {
  const authHydrated = useAuthStore((s) => s.hydrated);
  const authUser = useAuthStore((s) => s.user);
  const hasHydrated = usePermissionStore((s) => s._hasHydrated);
  const isInitialized = usePermissionStore((s) => s._isInitialized);

  const hasAccess = useCheckPermissions(requiredPermission, requiredPermissions, mode);

  // Still loading — hide until ready to prevent flash-of-content
  const isLoading = !authHydrated || !hasHydrated || (!!authUser && !isInitialized);
  if (isLoading) return null;

  return hasAccess ? <>{children}</> : null;
};

// Standalone permission check function for non-React contexts (e.g. nav filtering)
PermissionGuard.check = (
  requiredPermission?: string,
  requiredPermissions?: string[],
  mode: 'all' | 'any' = 'any'
): boolean => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    usePermissionStore.getState();

  if (!requiredPermission && !requiredPermissions) return true;

  if (requiredPermission) {
    return hasPermission(requiredPermission);
  }

  if (requiredPermissions) {
    return mode === 'all'
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
  }

  return false;
};
