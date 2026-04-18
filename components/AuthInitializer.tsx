"use client";

import { useEffect } from "react";
import { getProfile } from "@/service/authApi";
import { clearClientAuth, setAuthenticatedUser, redirectToLogin } from "@/service/authSession";
import { tokenService } from "@/service/tokenService";

export default function AuthInitializer() {
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const tokens = tokenService.get();

      if (!tokens?.accessToken) {
        clearClientAuth();
        return;
      }

      try {
        const user = await getProfile();

        if (!cancelled) {
          setAuthenticatedUser(user);
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
  }, []);

  return null;
}
