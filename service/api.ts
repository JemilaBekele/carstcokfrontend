import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiConfig } from "@/config/apiConfig";
import { useAuthStore } from "@/stores/auth.store";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  tokens: {
    access: { token: string };
    refresh: { token: string };
  };
};

const axiosInstance = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT_MS,
});

// Separate instance for refresh calls to avoid interceptor loops
const refreshApi = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT_MS,
});

// Single-flight refresh promise to prevent concurrent refresh calls
let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

const shouldSkipRefresh = (url?: string) => {
  if (!url) return false;
  return url.includes("/login") || url.includes("/auth/refresh-tokens");
};

// ── Request interceptor: attach access token ──
axiosInstance.interceptors.request.use((config) => {
  const tokens = useAuthStore.getState().tokens;

  if (tokens?.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

// ── Response interceptor: 401 → refresh → retry ──
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (!error.response || !originalRequest) {
      return Promise.reject(error);
    }

    if (shouldSkipRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const tokens = useAuthStore.getState().tokens;

    if (!tokens?.refreshToken) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = refreshApi
          .post<RefreshResponse>("/auth/refresh-tokens", {
            refreshToken: tokens.refreshToken,
          })
          .then((response) => {
            const refreshedTokens = {
              accessToken: response.data.tokens.access.token,
              refreshToken: response.data.tokens.refresh.token,
            };

            // Update tokens in the unified store
            useAuthStore.getState().setTokens(refreshedTokens);
            return refreshedTokens;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshedTokens = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

/** Redirect to login (browser only) */
function redirectToLogin() {
  if (typeof window === "undefined") return;
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  const loginUrl = callbackUrl.startsWith("/login")
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  window.location.assign(loginUrl);
}

export const apiUrl = apiConfig.BASE_URL;
export { axiosInstance };
