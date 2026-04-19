'use client';
import { navItems } from '@/constants/data';
import { useAuthStore } from '@/stores/auth.store';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch
} from 'kbar';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasAnyPermission = useAuthStore((s) => s.hasAnyPermission);
  // Subscribe to the actual array so useMemo re-runs when permissions change
  const permissions = useAuthStore((s) => s.permissions);

  // Filter navigation actions by user permissions
  const actions = useMemo(() => {
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const checkAccess = (item: { permission?: string; permissions?: string[] }) => {
      if (!item.permission && !item.permissions) return true;
      if (item.permission) return hasPermission(item.permission);
      if (item.permissions) return hasAnyPermission(item.permissions);
      return true;
    };

    return navItems.flatMap((navItem) => {
      // Skip items the user doesn't have permission for
      if (!checkAccess(navItem)) return [];

      const baseAction =
        navItem.url !== '#'
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: 'Navigation',
              subtitle: `Go to ${navItem.title}`,
              perform: () => navigateTo(navItem.url)
            }
          : null;

      // Map child items into actions, filtering by permission
      const childActions =
        navItem.items
          ?.filter((childItem) => checkAccess(childItem))
          .map((childItem) => ({
            id: `${childItem.title.toLowerCase()}Action`,
            name: childItem.title,
            shortcut: childItem.shortcut,
            keywords: childItem.title.toLowerCase(),
            section: navItem.title,
            subtitle: `Go to ${childItem.title}`,
            perform: () => navigateTo(childItem.url)
          })) ?? [];

      return baseAction ? [baseAction, ...childActions] : childActions;
    });
  }, [router, permissions, hasPermission, hasAnyPermission]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
