'use client';

import { ReactNode } from 'react';
import { usePermissionStore } from '@/stores/auth.store';
import { useAuthStore } from '@/stores/authStore';
import { IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

interface PagePermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  mode?: 'all' | 'any';
}

export function PagePermissionGuard({
  children,
  requiredPermission,
  requiredPermissions,
  mode = 'any',
}: PagePermissionGuardProps) {
  const authUser = useAuthStore((s) => s.user);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const hasPermission = usePermissionStore((s) => s.hasPermission);
  const hasAnyPermission = usePermissionStore((s) => s.hasAnyPermission);
  const hasAllPermissions = usePermissionStore((s) => s.hasAllPermissions);
  const isInitialized = usePermissionStore((s) => s._isInitialized);
  const hasHydrated = usePermissionStore((s) => s._hasHydrated);

  const isLoading =
    !authHydrated || !hasHydrated || (authUser && !isInitialized);

  // Still loading auth/permissions — show skeleton
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Verifying permissions…
          </p>
        </div>
      </div>
    );
  }

  // No permission requirements specified — allow access
  if (!requiredPermission && !requiredPermissions) {
    return <>{children}</>;
  }

  // Check access
  let hasAccess = false;

  if (requiredPermission) {
    hasAccess = hasPermission(requiredPermission);
  } else if (requiredPermissions) {
    hasAccess =
      mode === 'all'
        ? hasAllPermissions(requiredPermissions)
        : hasAnyPermission(requiredPermissions);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied — inline card (sidebar stays visible for navigation)
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <IconShieldLock className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have the required permissions to view this page.
            Contact your administrator if you believe this is an error.
          </p>
        </div>
        <Link
          href="/dashboard/overview"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <IconArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
