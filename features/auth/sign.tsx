"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { login } from "@/service/authApi";
import { clearClientAuth } from "@/service/authSession";
import { useAuthStore } from "@/stores/auth.store";

/* ─── Ambient Particle Component ────────────────────────────── */
function AmbientParticle({ delay, size, x }: { delay: number; size: number; x: number }) {
  return (
    <div
      className="login-particle"
      style={{
        left: `${x}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ─── Animated Counter ──────────────────────────────────────── */
function AnimatedStat({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="login-stat">
      <span className="login-stat__value">
        {value}
        {suffix && <span className="login-stat__suffix">{suffix}</span>}
      </span>
      <span className="login-stat__label">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   THEME-AWARE  SPLASH / LOADING  STYLES
   Uses CSS custom properties with :root (light) / .dark overrides
   ═══════════════════════════════════════════════════════════════ */
const splashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  /* ── Theme tokens ── */
  :root {
    --splash-bg: #f5f6fa;
    --splash-glow: rgba(180, 145, 30, 0.10);
    --splash-glow-mid: rgba(180, 145, 30, 0.04);
    --splash-orbit-a: rgba(180, 145, 30, 0.22);
    --splash-orbit-b: rgba(180, 145, 30, 0.08);
    --splash-orbit-c: rgba(180, 145, 30, 0.12);
    --splash-orbit-d: rgba(180, 145, 30, 0.04);
    --splash-orbit-e: rgba(180, 145, 30, 0.06);
    --splash-logo: #B8962E;
    --splash-logo-shadow: rgba(180, 145, 30, 0.25);
    --splash-brand: #1a1a2e;
    --splash-message: rgba(0, 0, 0, 0.45);
    --splash-dot: rgba(180, 145, 30, 0.55);
    --splash-bar-bg: rgba(0, 0, 0, 0.05);
    --splash-bar: #C4A030;
    --splash-success: #16a34a;
    --splash-success-shadow: rgba(22, 163, 74, 0.2);
    --splash-success-dot: rgba(22, 163, 74, 0.5);
    --splash-success-glow: rgba(22, 163, 74, 0.08);
    --splash-success-glow-mid: rgba(22, 163, 74, 0.03);
    --splash-success-orbit-a: rgba(22, 163, 74, 0.18);
    --splash-success-orbit-b: rgba(22, 163, 74, 0.06);
    --splash-success-orbit-c: rgba(22, 163, 74, 0.10);
    --splash-success-orbit-d: rgba(22, 163, 74, 0.04);
    --splash-success-orbit-e: rgba(22, 163, 74, 0.05);
    --splash-success-bar: #16a34a;
  }

  .dark {
    --splash-bg: #0a0a0f;
    --splash-glow: rgba(212, 175, 55, 0.08);
    --splash-glow-mid: rgba(212, 175, 55, 0.03);
    --splash-orbit-a: rgba(212, 175, 55, 0.25);
    --splash-orbit-b: rgba(212, 175, 55, 0.08);
    --splash-orbit-c: rgba(212, 175, 55, 0.15);
    --splash-orbit-d: rgba(212, 175, 55, 0.05);
    --splash-orbit-e: rgba(212, 175, 55, 0.08);
    --splash-logo: #D4AF37;
    --splash-logo-shadow: rgba(212, 175, 55, 0.3);
    --splash-brand: #ffffff;
    --splash-message: rgba(255, 255, 255, 0.4);
    --splash-dot: rgba(212, 175, 55, 0.5);
    --splash-bar-bg: rgba(255, 255, 255, 0.04);
    --splash-bar: #D4AF37;
    --splash-success: #4ade80;
    --splash-success-shadow: rgba(74, 222, 128, 0.3);
    --splash-success-dot: rgba(74, 222, 128, 0.5);
    --splash-success-glow: rgba(74, 222, 128, 0.06);
    --splash-success-glow-mid: rgba(74, 222, 128, 0.02);
    --splash-success-orbit-a: rgba(74, 222, 128, 0.2);
    --splash-success-orbit-b: rgba(74, 222, 128, 0.06);
    --splash-success-orbit-c: rgba(74, 222, 128, 0.12);
    --splash-success-orbit-d: rgba(74, 222, 128, 0.04);
    --splash-success-orbit-e: rgba(74, 222, 128, 0.06);
    --splash-success-bar: #4ade80;
  }

  .login-splash {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--splash-bg);
    z-index: 9999;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    overflow: hidden;
    animation: splashFadeIn 0.5s ease-out;
  }

  @keyframes splashFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .login-splash__glow {
    position: absolute;
    top: 40%;
    left: 50%;
    width: 600px;
    height: 600px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, var(--splash-glow) 0%, var(--splash-glow-mid) 30%, transparent 60%);
    pointer-events: none;
    animation: splashGlowPulse 3s ease-in-out infinite;
  }

  @keyframes splashGlowPulse {
    0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
    50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
  }

  .login-splash__orbits {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -55%);
    pointer-events: none;
  }

  .login-splash__orbit {
    position: absolute;
    border-radius: 50%;
    border: 1px solid transparent;
    top: 50%;
    left: 50%;
    animation: splashOrbit linear infinite;
  }

  .login-splash__orbit--1 {
    width: 160px; height: 160px; margin: -80px 0 0 -80px;
    border-top-color: var(--splash-orbit-a);
    border-right-color: var(--splash-orbit-b);
    animation-duration: 3s;
  }

  .login-splash__orbit--2 {
    width: 220px; height: 220px; margin: -110px 0 0 -110px;
    border-bottom-color: var(--splash-orbit-c);
    border-left-color: var(--splash-orbit-d);
    animation-duration: 5s;
    animation-direction: reverse;
  }

  .login-splash__orbit--3 {
    width: 280px; height: 280px; margin: -140px 0 0 -140px;
    border-top-color: var(--splash-orbit-e);
    animation-duration: 8s;
  }

  @keyframes splashOrbit { to { transform: rotate(360deg); } }

  .login-splash__logo {
    position: relative; z-index: 2;
    width: 72px; height: 72px;
    color: var(--splash-logo);
    animation: splashLogoPulse 2s ease-in-out infinite;
    filter: drop-shadow(0 0 20px var(--splash-logo-shadow));
  }

  .login-splash__logo svg { width: 100%; height: 100%; }

  .login-splash__logo--success {
    animation: splashLogoSuccess 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
    color: var(--splash-success);
    filter: drop-shadow(0 0 20px var(--splash-success-shadow));
  }

  .login-splash__check {
    stroke-dasharray: 32; stroke-dashoffset: 32;
    animation: splashCheckDraw 0.5s ease-out 0.3s forwards;
  }

  @keyframes splashLogoPulse {
    0%, 100% { transform: scale(1); opacity: 0.85; }
    50%      { transform: scale(1.08); opacity: 1; }
  }
  @keyframes splashLogoSuccess {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes splashCheckDraw { to { stroke-dashoffset: 0; } }

  .login-splash__content {
    position: relative; z-index: 2;
    text-align: center; margin-top: 28px;
    animation: splashContentIn 0.6s ease-out 0.2s both;
  }

  @keyframes splashContentIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .login-splash__brand {
    font-size: 22px; font-weight: 600;
    color: var(--splash-brand);
    margin: 0 0 6px; letter-spacing: 0.5px;
  }

  .login-splash__message {
    font-size: 14px;
    color: var(--splash-message);
    margin: 0 0 16px; letter-spacing: 0.2px;
  }

  .login-splash__dots {
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }

  .login-splash__dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--splash-dot);
    animation: splashDotBounce 1.4s ease-in-out infinite;
  }
  .login-splash__dot:nth-child(2) { animation-delay: 0.16s; }
  .login-splash__dot:nth-child(3) { animation-delay: 0.32s; }

  .login-splash--redirect .login-splash__dot {
    background: var(--splash-success-dot);
  }

  @keyframes splashDotBounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1.2); opacity: 1; }
  }

  .login-splash__progress {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 3px; background: var(--splash-bar-bg); overflow: hidden;
  }

  .login-splash__progress-bar {
    height: 100%; width: 40%;
    background: linear-gradient(90deg, transparent, var(--splash-bar), transparent);
    animation: splashProgress 2s ease-in-out infinite;
    border-radius: 3px;
  }

  .login-splash__progress-bar--fast {
    background: linear-gradient(90deg, transparent, var(--splash-success-bar), transparent);
    animation-duration: 1s;
  }

  @keyframes splashProgress {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(350%); }
  }

  .login-splash--redirect .login-splash__glow {
    background: radial-gradient(circle, var(--splash-success-glow) 0%, var(--splash-success-glow-mid) 30%, transparent 60%);
  }
  .login-splash--redirect .login-splash__orbit--1 {
    border-top-color: var(--splash-success-orbit-a);
    border-right-color: var(--splash-success-orbit-b);
  }
  .login-splash--redirect .login-splash__orbit--2 {
    border-bottom-color: var(--splash-success-orbit-c);
    border-left-color: var(--splash-success-orbit-d);
  }
  .login-splash--redirect .login-splash__orbit--3 {
    border-top-color: var(--splash-success-orbit-e);
  }
`;

/* ─── Main Login Page ──────────────────────────────────────── */
export default function SignInViewPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard/overview";
  const { _hydrated: hydrated, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const clearAuthClientState = useCallback(() => {
    try {
      clearClientAuth();
    } catch (err) {
      console.warn("Error clearing auth client state:", err);
    }
  }, []);

  useEffect(() => {
    if (hydrated && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [callbackUrl, hydrated, isAuthenticated, router]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    clearAuthClientState();
    setLoading(true);

    try {
      // login() stores user + tokens in the unified store
      // The useEffect above will handle redirect when isAuthenticated becomes true
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Invalid email or password.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        delay: Math.random() * 8,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
      })),
    [],
  );

  /* ─── Loading / Guard States ──────────────────────────────── */
  if (!hydrated) {
    return (
      <>
        <div className="login-splash">
          <div className="login-splash__glow" />
          <div className="login-splash__orbits">
            <div className="login-splash__orbit login-splash__orbit--1" />
            <div className="login-splash__orbit login-splash__orbit--2" />
            <div className="login-splash__orbit login-splash__orbit--3" />
          </div>
          <div className="login-splash__logo">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="42" height="42" rx="10" stroke="currentColor" strokeWidth="2" />
              <path d="M14 16h20M14 24h20M14 32h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="login-splash__content">
            <h2 className="login-splash__brand">Car Stock</h2>
            <p className="login-splash__message">Verifying your session</p>
            <div className="login-splash__dots">
              <span className="login-splash__dot" />
              <span className="login-splash__dot" />
              <span className="login-splash__dot" />
            </div>
          </div>
          <div className="login-splash__progress">
            <div className="login-splash__progress-bar" />
          </div>
        </div>
        <style>{splashStyles}</style>
      </>
    );
  }

  if (isAuthenticated) {
    return (
      <>
        <div className="login-splash login-splash--redirect">
          <div className="login-splash__glow" />
          <div className="login-splash__orbits">
            <div className="login-splash__orbit login-splash__orbit--1" />
            <div className="login-splash__orbit login-splash__orbit--2" />
            <div className="login-splash__orbit login-splash__orbit--3" />
          </div>
          <div className="login-splash__logo login-splash__logo--success">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
              <path d="M16 24l5 5 11-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="login-splash__check" />
            </svg>
          </div>
          <div className="login-splash__content">
            <h2 className="login-splash__brand">Welcome back</h2>
            <p className="login-splash__message">Preparing your dashboard</p>
            <div className="login-splash__dots">
              <span className="login-splash__dot" />
              <span className="login-splash__dot" />
              <span className="login-splash__dot" />
            </div>
          </div>
          <div className="login-splash__progress">
            <div className="login-splash__progress-bar login-splash__progress-bar--fast" />
          </div>
        </div>
        <style>{splashStyles}</style>
      </>
    );
  }

  /* ─── Render ───────────────────────────────────────────────── */
  return (
    <div className="login-root">
      {/* Ambient particles */}
      <div className="login-particles" aria-hidden="true">
        {particles.map((p) => (
          <AmbientParticle key={p.id} delay={p.delay} size={p.size} x={p.x} />
        ))}
      </div>

      {/* ── Hero Panel ─────────────────────────── */}
      <div className="login-hero">
        <div className="login-hero__bg">
          <img src="/login-hero.png" alt="" className="login-hero__img" loading="eager" />
          <div className="login-hero__overlay" />
          <div className="login-hero__vignette" />
        </div>

        <div
          className="login-hero__content"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s",
          }}
        >
          <div className="login-brand">
            <div className="login-brand__icon">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="2" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2" />
                <path d="M12 14h16M12 20h16M12 26h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="login-brand__name">Car Stock</h2>
              <p className="login-brand__tagline">Inventory Management System</p>
            </div>
          </div>

          <div className="login-hero__quote">
            <blockquote>
              &ldquo;Streamline your vehicle inventory with precision tracking, real-time analytics,
              and seamless operations management.&rdquo;
            </blockquote>
          </div>

          <div className="login-hero__stats">
            <AnimatedStat value="12K" label="Vehicles Tracked" suffix="+" />
            <div className="login-hero__stats-divider" />
            <AnimatedStat value="98" label="Uptime" suffix="%" />
            <div className="login-hero__stats-divider" />
            <AnimatedStat value="4.9" label="User Rating" suffix="★" />
          </div>
        </div>
      </div>

      {/* ── Form Panel ─────────────────────────── */}
      <div className="login-form-panel">
        <div
          className="login-card"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0) scale(1)" : "translateY(32px) scale(0.96)",
            transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.5s",
          }}
        >
          <div className="login-card__header">
            <h1 className="login-card__title">Welcome Back</h1>
            <p className="login-card__subtitle">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSignIn} className="login-form">
            {/* Email */}
            <div className={`login-field ${emailFocused || email ? "login-field--active" : ""}`}>
              <label htmlFor="login-email" className="login-field__label">Email Address</label>
              <div className="login-field__input-wrap">
                <div className="login-field__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <input
                  id="login-email" type="email" placeholder="name@company.com"
                  autoCapitalize="none" autoComplete="email" autoCorrect="off"
                  disabled={loading} value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  className="login-field__input"
                />
              </div>
            </div>

            {/* Password */}
            <div className={`login-field ${passwordFocused || password ? "login-field--active" : ""}`}>
              <label htmlFor="login-password" className="login-field__label">Password</label>
              <div className="login-field__input-wrap">
                <div className="login-field__icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="login-password" type={showPassword ? "text" : "password"}
                  placeholder="••••••••" autoComplete="current-password"
                  disabled={loading} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className="login-field__input"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="login-field__toggle" tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="login-extras">
              <label className="login-checkbox" htmlFor="login-remember">
                <input type="checkbox" id="login-remember" />
                <span className="login-checkbox__mark" />
                <span className="login-checkbox__text">Remember me</span>
              </label>
              <a href="#" className="login-forgot">Forgot password?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-submit" id="login-submit-btn">
              {loading ? (
                <>
                  <svg className="login-submit__spinner" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Signing In…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-submit__arrow">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-card__footer">
            <div className="login-secure-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Secured with 256-bit encryption</span>
            </div>
          </div>
        </div>

        <p className="login-copyright">
          © {new Date().getFullYear()} Car Stock Management. All rights reserved.
        </p>
      </div>

      {/* ═══ THEME-AWARE  LOGIN PAGE STYLES ═══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        /* ── Theme Tokens ─────────────────────────── */
        :root {
          --login-bg: #f5f6fa;
          --login-panel-bg: linear-gradient(145deg, #edeef3 0%, #f5f6fa 50%, #eef0f5 100%);
          --login-card-bg: linear-gradient(160deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%);
          --login-card-border: rgba(0, 0, 0, 0.08);
          --login-card-shadow: 0 0 0 1px rgba(180,145,30,0.06), 0 20px 60px rgba(0,0,0,0.08), 0 0 80px rgba(180,145,30,0.03);
          --login-title: #1a1a2e;
          --login-subtitle: rgba(0, 0, 0, 0.45);
          --login-label: rgba(0, 0, 0, 0.55);
          --login-accent: #B8962E;
          --login-input-bg: rgba(0, 0, 0, 0.03);
          --login-input-border: rgba(0, 0, 0, 0.1);
          --login-input-text: #1a1a2e;
          --login-input-placeholder: rgba(0, 0, 0, 0.3);
          --login-input-focus-bg: rgba(180, 145, 30, 0.04);
          --login-input-focus-border: rgba(180, 145, 30, 0.45);
          --login-input-focus-ring: rgba(180, 145, 30, 0.1);
          --login-input-focus-glow: rgba(180, 145, 30, 0.06);
          --login-icon: rgba(0, 0, 0, 0.3);
          --login-icon-active: rgba(180, 145, 30, 0.75);
          --login-toggle: rgba(0, 0, 0, 0.3);
          --login-toggle-hover: rgba(180, 145, 30, 0.8);
          --login-checkbox-text: rgba(0, 0, 0, 0.5);
          --login-checkbox-border: rgba(0, 0, 0, 0.18);
          --login-checkbox-check-bg: #0a0a0f;
          --login-forgot: #B8962E;
          --login-btn-bg: linear-gradient(135deg, #C4A030 0%, #A8882A 100%);
          --login-btn-text: #ffffff;
          --login-btn-hover-shadow: 0 8px 24px rgba(180,145,30,0.25), 0 0 60px rgba(180,145,30,0.08);
          --login-btn-disabled-bg: rgba(0, 0, 0, 0.06);
          --login-btn-disabled-text: rgba(0, 0, 0, 0.3);
          --login-error-bg: rgba(239, 68, 68, 0.06);
          --login-error-border: rgba(239, 68, 68, 0.15);
          --login-error-text: #dc2626;
          --login-secure: rgba(0, 0, 0, 0.3);
          --login-secure-icon: rgba(22, 163, 74, 0.7);
          --login-copyright: rgba(0, 0, 0, 0.25);
          --login-particle: rgba(180, 145, 30, 0.4);
          --login-hero-overlay-a: rgba(245, 246, 250, 0.8);
          --login-hero-overlay-b: rgba(245, 246, 250, 0.5);
          --login-hero-overlay-c: rgba(245, 246, 250, 0.3);
          --login-hero-vignette-radial: rgba(180, 145, 30, 0.06);
          --login-hero-vignette-edge: rgba(245, 246, 250, 0.85);
          --login-brand-icon: #B8962E;
          --login-brand-name: #1a1a2e;
          --login-brand-tagline: rgba(0, 0, 0, 0.45);
          --login-quote: rgba(0, 0, 0, 0.7);
          --login-quote-border: rgba(180, 145, 30, 0.45);
          --login-stat-value: #B8962E;
          --login-stat-label: rgba(0, 0, 0, 0.4);
          --login-stat-divider: rgba(0, 0, 0, 0.08);
          --login-stats-border: rgba(0, 0, 0, 0.06);
          --login-mobile-brand: #B8962E;
        }

        .dark {
          --login-bg: #0a0a0f;
          --login-panel-bg: linear-gradient(145deg, #0e0e16 0%, #0a0a0f 50%, #0d0d14 100%);
          --login-card-bg: linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          --login-card-border: rgba(255, 255, 255, 0.08);
          --login-card-shadow: 0 0 0 1px rgba(212,175,55,0.05), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(212,175,55,0.03);
          --login-title: #ffffff;
          --login-subtitle: rgba(255, 255, 255, 0.4);
          --login-label: rgba(255, 255, 255, 0.55);
          --login-accent: #D4AF37;
          --login-input-bg: rgba(255, 255, 255, 0.04);
          --login-input-border: rgba(255, 255, 255, 0.08);
          --login-input-text: #ffffff;
          --login-input-placeholder: rgba(255, 255, 255, 0.2);
          --login-input-focus-bg: rgba(212, 175, 55, 0.04);
          --login-input-focus-border: rgba(212, 175, 55, 0.4);
          --login-input-focus-ring: rgba(212, 175, 55, 0.08);
          --login-input-focus-glow: rgba(212, 175, 55, 0.05);
          --login-icon: rgba(255, 255, 255, 0.25);
          --login-icon-active: rgba(212, 175, 55, 0.7);
          --login-toggle: rgba(255, 255, 255, 0.3);
          --login-toggle-hover: rgba(212, 175, 55, 0.8);
          --login-checkbox-text: rgba(255, 255, 255, 0.45);
          --login-checkbox-border: rgba(255, 255, 255, 0.15);
          --login-checkbox-check-bg: #0a0a0f;
          --login-forgot: #D4AF37;
          --login-btn-bg: linear-gradient(135deg, #D4AF37 0%, #B8962E 100%);
          --login-btn-text: #0a0a0f;
          --login-btn-hover-shadow: 0 8px 24px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1);
          --login-btn-disabled-bg: rgba(255, 255, 255, 0.08);
          --login-btn-disabled-text: rgba(255, 255, 255, 0.35);
          --login-error-bg: rgba(239, 68, 68, 0.08);
          --login-error-border: rgba(239, 68, 68, 0.2);
          --login-error-text: #f87171;
          --login-secure: rgba(255, 255, 255, 0.25);
          --login-secure-icon: rgba(74, 222, 128, 0.6);
          --login-copyright: rgba(255, 255, 255, 0.2);
          --login-particle: rgba(212, 175, 55, 0.6);
          --login-hero-overlay-a: rgba(10, 10, 15, 0.85);
          --login-hero-overlay-b: rgba(10, 10, 15, 0.55);
          --login-hero-overlay-c: rgba(10, 10, 15, 0.35);
          --login-hero-vignette-radial: rgba(212, 175, 55, 0.08);
          --login-hero-vignette-edge: rgba(10, 10, 15, 0.9);
          --login-brand-icon: #D4AF37;
          --login-brand-name: #ffffff;
          --login-brand-tagline: rgba(255, 255, 255, 0.45);
          --login-quote: rgba(255, 255, 255, 0.85);
          --login-quote-border: rgba(212, 175, 55, 0.5);
          --login-stat-value: #D4AF37;
          --login-stat-label: rgba(255, 255, 255, 0.4);
          --login-stat-divider: rgba(255, 255, 255, 0.1);
          --login-stats-border: rgba(255, 255, 255, 0.08);
          --login-mobile-brand: #D4AF37;
        }

        .login-root {
          display: flex;
          min-height: 100vh;
          background: var(--login-bg);
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* ── Particles ── */
        .login-particles { position: fixed; inset: 0; pointer-events: none; z-index: 1; }

        .login-particle {
          position: absolute; bottom: -10px; border-radius: 50%;
          background: radial-gradient(circle, var(--login-particle) 0%, transparent 70%);
          animation: loginParticleFloat 12s ease-in-out infinite;
        }

        @keyframes loginParticleFloat {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          10%  { opacity: 1; transform: scale(1); }
          90%  { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }

        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* ── Hero ── */
        .login-hero { display: none; position: relative; width: 55%; overflow: hidden; }
        @media (min-width: 1024px) { .login-hero { display: flex; } }

        .login-hero__bg { position: absolute; inset: 0; }
        .login-hero__img { width: 100%; height: 100%; object-fit: cover; object-position: center; }

        .login-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--login-hero-overlay-a) 0%, var(--login-hero-overlay-b) 40%, var(--login-hero-overlay-c) 100%);
        }

        .login-hero__vignette {
          position: absolute; inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, var(--login-hero-vignette-radial) 0%, transparent 60%),
            linear-gradient(to right, var(--login-hero-vignette-edge) 0%, transparent 30%);
        }

        .login-hero__content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 48px; height: 100%;
        }

        .login-brand { display: flex; align-items: center; gap: 14px; }
        .login-brand__icon { width: 44px; height: 44px; color: var(--login-brand-icon); flex-shrink: 0; }
        .login-brand__icon svg { width: 100%; height: 100%; }
        .login-brand__name { font-size: 22px; font-weight: 600; color: var(--login-brand-name); letter-spacing: 0.5px; margin: 0; }
        .login-brand__tagline { font-size: 13px; color: var(--login-brand-tagline); margin: 2px 0 0; letter-spacing: 0.3px; }

        .login-hero__quote { max-width: 520px; }
        .login-hero__quote blockquote {
          font-size: 24px; font-weight: 300; color: var(--login-quote);
          line-height: 1.5; letter-spacing: 0.2px; margin: 0;
          border-left: 3px solid var(--login-quote-border); padding-left: 20px;
        }

        .login-hero__stats {
          display: flex; align-items: center; gap: 32px;
          padding: 24px 0; border-top: 1px solid var(--login-stats-border);
        }
        .login-hero__stats-divider { width: 1px; height: 40px; background: var(--login-stat-divider); }

        .login-stat { display: flex; flex-direction: column; gap: 4px; }
        .login-stat__value { font-size: 28px; font-weight: 700; color: var(--login-stat-value); letter-spacing: -0.5px; }
        .login-stat__suffix { font-size: 18px; font-weight: 500; margin-left: 2px; }
        .login-stat__label { font-size: 12px; color: var(--login-stat-label); text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }

        /* ── Form Panel ── */
        .login-form-panel {
          position: relative; z-index: 2; flex: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 24px; background: var(--login-panel-bg);
        }
        @media (min-width: 1024px) { .login-form-panel { width: 45%; flex: none; } }

        /* ── Card ── */
        .login-card {
          width: 100%; max-width: 440px;
          background: var(--login-card-bg);
          border: 1px solid var(--login-card-border);
          border-radius: 24px; padding: 40px;
          backdrop-filter: blur(24px);
          box-shadow: var(--login-card-shadow);
        }

        .login-card__header { text-align: center; margin-bottom: 32px; }
        .login-card__title { font-size: 28px; font-weight: 600; color: var(--login-title); margin: 0 0 8px; letter-spacing: -0.3px; }
        .login-card__subtitle { font-size: 14px; color: var(--login-subtitle); margin: 0; line-height: 1.5; }

        .login-form { display: flex; flex-direction: column; gap: 20px; }

        /* ── Field ── */
        .login-field { display: flex; flex-direction: column; gap: 8px; }
        .login-field__label { font-size: 13px; font-weight: 500; color: var(--login-label); letter-spacing: 0.3px; transition: color 0.3s ease; }
        .login-field--active .login-field__label { color: var(--login-accent); }

        .login-field__input-wrap {
          display: flex; align-items: center;
          background: var(--login-input-bg);
          border: 1px solid var(--login-input-border);
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          overflow: hidden;
        }

        .login-field--active .login-field__input-wrap,
        .login-field__input-wrap:focus-within {
          border-color: var(--login-input-focus-border);
          background: var(--login-input-focus-bg);
          box-shadow: 0 0 0 3px var(--login-input-focus-ring), 0 0 20px var(--login-input-focus-glow);
        }

        .login-field__icon { display: flex; align-items: center; justify-content: center; padding-left: 14px; color: var(--login-icon); flex-shrink: 0; transition: color 0.3s ease; }
        .login-field--active .login-field__icon { color: var(--login-icon-active); }

        .login-field__input {
          flex: 1; background: transparent; border: none; outline: none;
          padding: 14px; font-size: 15px; color: var(--login-input-text);
          font-family: 'Inter', sans-serif; letter-spacing: 0.2px;
        }
        .login-field__input::placeholder { color: var(--login-input-placeholder); }
        .login-field__input:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-field__toggle {
          display: flex; align-items: center; justify-content: center;
          padding: 0 14px; background: none; border: none;
          color: var(--login-toggle); cursor: pointer; transition: color 0.2s ease;
        }
        .login-field__toggle:hover { color: var(--login-toggle-hover); }

        /* ── Extras ── */
        .login-extras { display: flex; align-items: center; justify-content: space-between; }
        .login-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--login-checkbox-text); user-select: none; }
        .login-checkbox input { display: none; }
        .login-checkbox__mark {
          width: 16px; height: 16px;
          border: 1.5px solid var(--login-checkbox-border);
          border-radius: 4px; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.2s ease; position: relative;
        }
        .login-checkbox input:checked + .login-checkbox__mark { background: var(--login-accent); border-color: var(--login-accent); }
        .login-checkbox input:checked + .login-checkbox__mark::after {
          content: ''; display: block; width: 4px; height: 8px;
          border: solid var(--login-checkbox-check-bg); border-width: 0 2px 2px 0;
          transform: rotate(45deg); margin-bottom: 2px;
        }
        .login-checkbox__text { line-height: 1; }

        .login-forgot { font-size: 13px; color: var(--login-forgot); text-decoration: none; font-weight: 500; transition: all 0.2s ease; opacity: 0.8; }
        .login-forgot:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }

        /* ── Error ── */
        .login-error {
          display: flex; align-items: center; gap: 10px; padding: 12px 16px;
          background: var(--login-error-bg); border: 1px solid var(--login-error-border);
          border-radius: 12px; color: var(--login-error-text);
          font-size: 13px; font-weight: 500; animation: loginShake 0.4s ease;
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ── Submit ── */
        .login-submit {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 15px 24px; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
          background: var(--login-btn-bg); color: var(--login-btn-text);
          letter-spacing: 0.3px; position: relative; overflow: hidden;
        }
        .login-submit::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%);
          opacity: 0; transition: opacity 0.35s ease;
        }
        .login-submit:hover:not(:disabled)::before { opacity: 1; }
        .login-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--login-btn-hover-shadow); }
        .login-submit:active:not(:disabled) { transform: translateY(0); }
        .login-submit:disabled { background: var(--login-btn-disabled-bg); color: var(--login-btn-disabled-text); cursor: not-allowed; }

        .login-submit__spinner { width: 20px; height: 20px; animation: loginSpin 0.7s linear infinite; }
        .login-submit__arrow { transition: transform 0.3s ease; }
        .login-submit:hover:not(:disabled) .login-submit__arrow { transform: translateX(4px); }

        /* ── Footer ── */
        .login-card__footer { margin-top: 28px; display: flex; justify-content: center; }
        .login-secure-badge { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--login-secure); letter-spacing: 0.3px; }
        .login-secure-badge svg { color: var(--login-secure-icon); }
        .login-copyright { margin-top: 32px; font-size: 12px; color: var(--login-copyright); text-align: center; }

        /* ── Mobile ── */
        @media (max-width: 480px) {
          .login-card { padding: 28px 24px; border-radius: 20px; }
          .login-card__title { font-size: 24px; }
          .login-hero__quote blockquote { font-size: 20px; }
        }
        @media (max-width: 1023px) {
          .login-form-panel::before {
            content: 'Car Stock'; display: block; position: absolute; top: 32px; left: 50%;
            transform: translateX(-50%); font-size: 20px; font-weight: 600;
            color: var(--login-mobile-brand); letter-spacing: 0.5px; font-family: 'Inter', sans-serif;
          }
        }
      `}</style>
    </div>
  );
}
