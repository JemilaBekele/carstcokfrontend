"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { buildLoginRedirect } from "@/service/authSession";

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

  // Still hydrating — show branded splash (CSS in globals.css)
  if (!hydrated) {
    return (
      <div className="protected-splash">
        <div className="protected-splash__glow" />

        <div className="protected-splash__orbits">
          <div className="protected-splash__orbit protected-splash__orbit--1" />
          <div className="protected-splash__orbit protected-splash__orbit--2" />
        </div>

        <div className="protected-splash__logo">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="42" height="42" rx="10" stroke="currentColor" strokeWidth="2" />
            <path d="M14 16h20M14 24h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>

        <div className="protected-splash__content">
          <h2 className="protected-splash__brand">Car Stock</h2>
          <p className="protected-splash__message">Checking authentication</p>
          <div className="protected-splash__dots">
            <span className="protected-splash__dot" />
            <span className="protected-splash__dot" />
            <span className="protected-splash__dot" />
          </div>
        </div>

        <div className="protected-splash__progress">
          <div className="protected-splash__bar" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
