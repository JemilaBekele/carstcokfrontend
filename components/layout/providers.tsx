'use client';

import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import AuthInitializer from '@/components/AuthInitializer';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ActiveThemeProvider initialTheme={activeThemeValue}>
      <AuthInitializer />
      {children}
    </ActiveThemeProvider>
  );
}
