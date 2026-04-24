'use client';

import { IconArrowLeft, IconError404 } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="flex max-w-lg flex-col items-center gap-6 text-center">
        {/* 404 Badge */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
          <IconError404 className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Large 404 Text */}
        <span className="from-foreground bg-gradient-to-b to-transparent bg-clip-text text-[10rem] font-extrabold leading-none tracking-tighter text-transparent">
          404
        </span>

        {/* Message */}
        <div>
          <h2 className="font-heading text-2xl font-bold">
            Something&apos;s missing
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sorry, the page you are looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={() => router.back()}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Button asChild size="lg">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
