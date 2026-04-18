"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { buildLoginRedirect } from "@/service/authSession";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated || isAuthenticated) {
      return;
    }

    const query = searchParams.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(buildLoginRedirect(callbackUrl));
  }, [hydrated, isAuthenticated, pathname, router, searchParams]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
