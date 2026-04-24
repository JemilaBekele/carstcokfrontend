'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { PERMISSIONS } from '@/stores/permissions';
import { navItems } from '@/constants/data';
import {
  filterNavItemsWithCheckers,
  findFirstAccessibleUrl,
} from '@/lib/filterNavItems';
import BrandedSplash from '@/components/BrandedSplash';
import React from 'react';

/**
 * Client boundary that enforces VIEW_MAIN_DASHBOARD permission.
 * If the user lacks the permission, they are redirected to the first
 * accessible sidebar route instead of seeing a "denied" card.
 */
export function OverviewPermissionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s._hydrated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);

  const allowed = hydrated && hasPermission(PERMISSIONS.DASHBOARDS.MAIN_DASHBOARD.name);

  useEffect(() => {
    if (!hydrated) return;
    if (allowed) return;

    // User doesn't have dashboard permission — find first accessible route
    const accessible = filterNavItemsWithCheckers(navItems, {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    });

    const firstUrl = findFirstAccessibleUrl(accessible);
    router.replace(firstUrl || '/dashboard/unauthorized');
  }, [hydrated, allowed, hasPermission, hasAnyPermission, hasAllPermissions, router]);

  if (!hydrated || !allowed) {
    return <BrandedSplash message="Loading dashboard" />;
  }

  return <>{children}</>;
}
