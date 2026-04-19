"use client";

import { useEffect } from "react";
import { getProfile } from "@/service/authApi";
import { clearClientAuth, redirectToLogin } from "@/service/authSession";
import { useAuthStore, useStoreHydrated } from "@/stores/auth.store";

export default function AuthInitializer() {
  const hydrated = useStoreHydrated();

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    const init = async () => {
      const tokens = useAuthStore.getState().tokens;

      if (!tokens?.accessToken) {
        clearClientAuth();
        return;
      }

      try {
        const user = await getProfile();

        if (!cancelled) {
          useAuthStore.getState().setUser(user);
        }
      } catch {
        if (cancelled) {
          return;
        }

        const callbackUrl =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : undefined;

        clearClientAuth();
        redirectToLogin(
          callbackUrl?.startsWith("/login") ? undefined : callbackUrl,
        );
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [hydrated]);

  return null;
}
