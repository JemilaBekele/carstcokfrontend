"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { buildLoginRedirect } from "@/service/authSession";
import BrandedSplash from "@/components/BrandedSplash";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrated = useAuthStore((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated || isAuthenticated) {
      return;
    }

    const query = searchParams.toString();
    const callbackUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(buildLoginRedirect(callbackUrl));
  }, [hydrated, isAuthenticated, pathname, router, searchParams]);

  if (!hydrated) {
    return <BrandedSplash message="Checking authentication" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
