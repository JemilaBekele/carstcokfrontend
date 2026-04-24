'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { navItems } from '@/constants/data';
import {
  filterNavItemsWithCheckers,
  findFirstAccessibleUrl,
} from '@/lib/filterNavItems';
import BrandedSplash from '@/components/BrandedSplash';

export default function DashboardPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s._hydrated);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  const hasAllPermissions = useAuthStore((s) => s.hasAllPermissions);

  useEffect(() => {
    if (!hydrated) return;

    const accessible = filterNavItemsWithCheckers(navItems, {
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    });

    const firstUrl = findFirstAccessibleUrl(accessible);

    if (firstUrl) {
      router.replace(firstUrl);
    } else {
      // Fallback: no accessible route found (edge case — unauthorized user)
      router.replace('/dashboard/unauthorized');
    }
  }, [hydrated, hasPermission, hasAnyPermission, hasAllPermissions, router]);

  return <BrandedSplash message="Loading dashboard" />;
}