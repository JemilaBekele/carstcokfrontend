"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tokenService } from "@/service/tokenService";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const tokens = tokenService.get();
    router.replace(tokens?.accessToken ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
    </div>
  );
}
