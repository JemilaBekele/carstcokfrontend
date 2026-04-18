import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: true,
      hydrated: true,
    }),
  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      hydrated: true,
    }),
}));
