"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { buildLoginRedirect } from "@/service/authSession";

/* ─── Theme-aware splash styles ───────────────────────────── */
const protectedSplashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  /* ── Theme tokens ── */
  :root {
    --psplash-bg: #f5f6fa;
    --psplash-glow: rgba(180, 145, 30, 0.08);
    --psplash-glow-mid: rgba(180, 145, 30, 0.03);
    --psplash-orbit-a: rgba(180, 145, 30, 0.18);
    --psplash-orbit-b: rgba(180, 145, 30, 0.06);
    --psplash-orbit-c: rgba(180, 145, 30, 0.10);
    --psplash-logo: #B8962E;
    --psplash-logo-shadow: rgba(180, 145, 30, 0.2);
    --psplash-brand: #1a1a2e;
    --psplash-message: rgba(0, 0, 0, 0.4);
    --psplash-dot: rgba(180, 145, 30, 0.5);
    --psplash-bar-bg: rgba(0, 0, 0, 0.04);
    --psplash-bar: #C4A030;
  }

  .dark {
    --psplash-bg: #0a0a0f;
    --psplash-glow: rgba(212, 175, 55, 0.06);
    --psplash-glow-mid: rgba(212, 175, 55, 0.02);
    --psplash-orbit-a: rgba(212, 175, 55, 0.2);
    --psplash-orbit-b: rgba(212, 175, 55, 0.06);
    --psplash-orbit-c: rgba(212, 175, 55, 0.12);
    --psplash-logo: #D4AF37;
    --psplash-logo-shadow: rgba(212, 175, 55, 0.25);
    --psplash-brand: #ffffff;
    --psplash-message: rgba(255, 255, 255, 0.35);
    --psplash-dot: rgba(212, 175, 55, 0.45);
    --psplash-bar-bg: rgba(255, 255, 255, 0.03);
    --psplash-bar: #D4AF37;
  }

  .protected-splash {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--psplash-bg);
    z-index: 9999;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    animation: protectedFadeIn 0.4s ease-out;
  }

  @keyframes protectedFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .protected-splash__glow {
    position: absolute; top: 42%; left: 50%;
    width: 500px; height: 500px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, var(--psplash-glow) 0%, var(--psplash-glow-mid) 35%, transparent 60%);
    pointer-events: none;
    animation: protectedGlow 3s ease-in-out infinite;
  }

  @keyframes protectedGlow {
    0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
    50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.1); }
  }

  .protected-splash__orbits {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -55%);
    pointer-events: none;
  }

  .protected-splash__orbit {
    position: absolute; border-radius: 50%;
    border: 1px solid transparent;
    top: 50%; left: 50%;
  }

  .protected-splash__orbit--1 {
    width: 140px; height: 140px; margin: -70px 0 0 -70px;
    border-top-color: var(--psplash-orbit-a);
    border-right-color: var(--psplash-orbit-b);
    animation: protectedOrbit 3s linear infinite;
  }

  .protected-splash__orbit--2 {
    width: 200px; height: 200px; margin: -100px 0 0 -100px;
    border-bottom-color: var(--psplash-orbit-c);
    animation: protectedOrbit 5s linear infinite reverse;
  }

  @keyframes protectedOrbit { to { transform: rotate(360deg); } }

  .protected-splash__logo {
    position: relative; z-index: 2;
    width: 56px; height: 56px;
    color: var(--psplash-logo);
    animation: protectedPulse 2s ease-in-out infinite;
    filter: drop-shadow(0 0 16px var(--psplash-logo-shadow));
  }
  .protected-splash__logo svg { width: 100%; height: 100%; }

  @keyframes protectedPulse {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50%      { transform: scale(1.06); opacity: 1; }
  }

  .protected-splash__content {
    position: relative; z-index: 2;
    text-align: center; margin-top: 24px;
    animation: protectedContentIn 0.5s ease-out 0.15s both;
  }

  @keyframes protectedContentIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .protected-splash__brand {
    font-size: 18px; font-weight: 600;
    color: var(--psplash-brand);
    margin: 0 0 6px; letter-spacing: 0.4px;
  }

  .protected-splash__message {
    font-size: 13px;
    color: var(--psplash-message);
    margin: 0 0 14px;
  }

  .protected-splash__dots {
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }

  .protected-splash__dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--psplash-dot);
    animation: protectedDot 1.4s ease-in-out infinite;
  }
  .protected-splash__dot:nth-child(2) { animation-delay: 0.16s; }
  .protected-splash__dot:nth-child(3) { animation-delay: 0.32s; }

  @keyframes protectedDot {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.35; }
    40%           { transform: scale(1.2); opacity: 1; }
  }

  .protected-splash__progress {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; background: var(--psplash-bar-bg); overflow: hidden;
  }

  .protected-splash__bar {
    height: 100%; width: 35%;
    background: linear-gradient(90deg, transparent, var(--psplash-bar), transparent);
    animation: protectedBar 2s ease-in-out infinite;
    border-radius: 2px;
  }

  @keyframes protectedBar {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(400%); }
  }
`;

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
      <>
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
        <style>{protectedSplashStyles}</style>
      </>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
