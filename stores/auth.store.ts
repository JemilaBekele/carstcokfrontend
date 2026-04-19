// stores/auth.store.ts
// Unified auth store: user + tokens + permissions (persisted)
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';

/* ── Types ─────────────────────────────────────── */

type Tokens = {
  accessToken: string;
  refreshToken: string;
};

interface AuthState {
  // State
  user: AuthUser | null;
  tokens: Tokens | null;
  permissions: string[];
  _hydrated: boolean;

  // Derived
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: AuthUser, tokens: Tokens) => void;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: Tokens) => void;
  setPermissions: (permissions: string[]) => void;
  clearAuth: () => void;
  setHydrated: (state: boolean) => void;

  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

/* ── Store ──────────────────────────────────────── */

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      permissions: [],
      _hydrated: false,
      isAuthenticated: false,

      // Full login — sets everything in one call
      setAuth: (user, tokens) => {
        const permissions = Array.isArray(user.permissions)
          ? user.permissions
          : [];
        set({
          user,
          tokens,
          permissions,
          isAuthenticated: true,
        });
      },

      // Update user only (e.g. profile refresh)
      setUser: (user) => {
        const permissions = Array.isArray(user.permissions)
          ? user.permissions
          : [];
        set({
          user,
          permissions,
          isAuthenticated: true,
        });
      },

      // Update tokens only (e.g. after refresh)
      setTokens: (tokens) => {
        set({ tokens });
      },

      // Overwrite permissions directly
      setPermissions: (permissions) => {
        set({ permissions: Array.isArray(permissions) ? permissions : [] });
      },

      // Full logout — clears everything
      clearAuth: () => {
        set({
          user: null,
          tokens: null,
          permissions: [],
          isAuthenticated: false,
        });
      },

      // Hydration flag (set by persist middleware)
      setHydrated: (state) => {
        set({ _hydrated: state });
      },

      // Permission check helpers
      hasPermission: (permission) => {
        return get().permissions.includes(permission);
      },

      hasAnyPermission: (perms) => {
        const current = get().permissions;
        return perms.some((p) => current.includes(p));
      },

      hasAllPermissions: (perms) => {
        const current = get().permissions;
        return perms.every((p) => current.includes(p));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        // SSR-safe — return a no-op storage on the server
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.setHydrated(true);
          }
        };
      },
    }
  )
);

/* ── Convenience hooks ─────────────────────────── */

/** True when Zustand has finished reading localStorage */
export const useStoreHydrated = () =>
  useAuthStore((s) => s._hydrated);

/** True when hydrated AND user is present */
export const useAuthReady = () => {
  const hydrated = useAuthStore((s) => s._hydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return hydrated && isAuthenticated;
};

/** Permission array (empty if not ready) */
export const useSafePermissions = () => {
  const hydrated = useAuthStore((s) => s._hydrated);
  const permissions = useAuthStore((s) => s.permissions);
  return hydrated ? permissions : [];
};