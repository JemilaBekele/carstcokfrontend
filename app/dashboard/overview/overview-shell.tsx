'use client';

import { PermissionGuard } from '@/components/PermissionGuard';
import { PERMISSIONS } from '@/stores/permissions';
import React from 'react';

/**
 * Client boundary that enforces VIEW_MAIN_DASHBOARD permission.
 * Kept as a thin wrapper so the parent layout can remain a Server Component.
 */
export function OverviewPermissionShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionGuard
      requiredPermission={PERMISSIONS.DASHBOARDS.MAIN_DASHBOARD.name}
    >
      {children}
    </PermissionGuard>
  );
}
