'use client';

import { IconShieldLock, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <IconShieldLock className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Unauthorized</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You don&apos;t have permission to access this resource. Please
            contact your administrator if you believe this is an error.
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
