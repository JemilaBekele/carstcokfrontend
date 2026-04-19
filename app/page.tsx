"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useStoreHydrated } from "@/stores/auth.store";

export default function Page() {
  const router = useRouter();
  const hydrated = useStoreHydrated();
  const tokens = useAuthStore((s) => s.tokens);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(tokens?.accessToken ? "/dashboard" : "/login");
  }, [hydrated, tokens, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
    </div>
  );
}
