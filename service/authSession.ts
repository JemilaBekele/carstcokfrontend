import type { BackendAuthUser, AuthUser } from "@/types/auth";
import { tokenService } from "./tokenService";
import { useAuthStore } from "@/stores/authStore";
import { usePermissionStore } from "@/stores/auth.store";

export const normalizeAuthUser = (user: BackendAuthUser): AuthUser => ({
  id: user.id,
  name: user.name || "",
  email: user.email || "",
  phone: user.phone,
  status: user.status,
  roleType: user.roleType,
  role: typeof user.role === "string" ? user.role : user.role?.name || "",
  permissions: Array.isArray(user.permissions) ? user.permissions : [],
  branch: user.branch || null,
  shops: Array.isArray(user.shops) ? user.shops : [],
  stores: Array.isArray(user.stores) ? user.stores : [],
  lastLoginAt: user.lastLoginAt,
});

export const syncPermissions = (permissions: string[]) => {
  const permissionStore = usePermissionStore.getState();
  permissionStore.setHasHydrated(true);
  permissionStore.setPermissions(Array.isArray(permissions) ? permissions : []);
};

export const setAuthenticatedUser = (user: AuthUser) => {
  useAuthStore.getState().setUser(user);
  syncPermissions(user.permissions);
};

export const clearClientAuth = () => {
  tokenService.clear();
  useAuthStore.getState().clearAuth();

  const permissionStore = usePermissionStore.getState();
  permissionStore.setHasHydrated(true);
  permissionStore.clearPermissions();
  permissionStore.setIsInitialized(false);

  if (typeof window !== "undefined") {
    localStorage.removeItem("permission-storage");
  }
};

export const buildLoginRedirect = (callbackUrl?: string) => {
  if (!callbackUrl) {
    return "/login";
  }

  return `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
};

export const redirectToLogin = (callbackUrl?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  window.location.assign(buildLoginRedirect(callbackUrl));
};
