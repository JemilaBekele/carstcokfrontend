// lib/filterNavItems.ts
// Single source of truth for permission-based nav filtering
// and first-accessible-URL resolution.
// Used by AppSidebar and KBar so they always apply the same logic.

import type { NavItem } from '@/types';
import { useAuthStore } from '@/stores/auth.store';

type PermissionCheckers = {
  hasPermission: (p: string) => boolean;
  hasAnyPermission: (ps: string[]) => boolean;
  hasAllPermissions: (ps: string[]) => boolean;
};

/**
 * Pure filter function — works in both React (hooks) and non-React (getState()) contexts.
 * Pass in the checker functions from whichever context you're calling from.
 */
export function filterNavItemsWithCheckers(
  items: NavItem[],
  checkers: PermissionCheckers
): NavItem[] {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = checkers;

  return items
    .map((item) => {
      // No permission annotation → always visible
      let hasAccess = true;

      if (item.permission) {
        hasAccess = hasPermission(item.permission);
      } else if (item.permissions && item.permissions.length > 0) {
        hasAccess =
          item.permissionMode === 'all'
            ? hasAllPermissions(item.permissions)
            : hasAnyPermission(item.permissions);
      }

      if (!hasAccess) return null;

      // Recursively filter children
      const filteredItem = { ...item };
      if (filteredItem.items && filteredItem.items.length > 0) {
        filteredItem.items = filterNavItemsWithCheckers(
          filteredItem.items,
          checkers
        ) as NavItem['items'];

        // Hide parent if it has no navigable direct link and no remaining children
        if (filteredItem.items!.length === 0 && filteredItem.url === '#') {
          return null;
        }
      }

      return filteredItem;
    })
    .filter(Boolean) as NavItem[];
}

/**
 * Convenience wrapper for non-React contexts (e.g. static nav-item arrays).
 * Reads permissions via Zustand's getState() — no hooks.
 */
export function filterNavItemsStatic(items: NavItem[]): NavItem[] {
  const { hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuthStore.getState();
  return filterNavItemsWithCheckers(items, {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  });
}

/**
 * Recursively finds the first navigable URL from a list of nav items.
 * Skips group placeholders (url === '#').
 */
export function findFirstAccessibleUrl(items: NavItem[]): string | null {
  for (const item of items) {
    if (item.url && item.url !== '#') {
      return item.url;
    }
    if (item.items && item.items.length > 0) {
      const found = findFirstAccessibleUrl(item.items as NavItem[]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Returns the first accessible dashboard URL for the current user.
 * Uses Zustand's getState() — safe in non-React contexts.
 */
export function getFirstAccessibleUrl(items: NavItem[]): string {
  const filtered = filterNavItemsStatic(items);
  return findFirstAccessibleUrl(filtered) || '/dashboard/unauthorized';
}
