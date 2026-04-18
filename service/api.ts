import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { apiConfig } from "@/config/apiConfig";
import { tokenService } from "./tokenService";
import { clearClientAuth, redirectToLogin } from "./authSession";

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type RefreshResponse = {
  tokens: {
    access: { token: string };
    refresh: { token: string };
  };
};

const api = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT_MS,
});

const refreshApi = axios.create({
  baseURL: apiConfig.BASE_URL,
  timeout: apiConfig.TIMEOUT_MS,
});

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken: string;
}> | null = null;

const shouldSkipRefresh = (url?: string) => {
  if (!url) {
    return false;
  }

  return url.includes("/login") || url.includes("/auth/refresh-tokens");
};

api.interceptors.request.use((config) => {
  const tokens = tokenService.get();

  if (tokens?.accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
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

    const tokens = tokenService.get();

    if (!tokens?.refreshToken) {
      clearClientAuth();
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

            tokenService.set(refreshedTokens);
            return refreshedTokens;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const refreshedTokens = await refreshPromise;
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${refreshedTokens.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearClientAuth();
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  },
);

export const apiUrl = apiConfig.BASE_URL;
export { api };
export default api;
