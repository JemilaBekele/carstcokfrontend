import { AxiosError } from "axios";
import api from "./api";
import { tokenService } from "./tokenService";
import { clearClientAuth, normalizeAuthUser } from "./authSession";
import type { BackendAuthUser } from "@/types/auth";

type LoginResponse = {
  user: BackendAuthUser;
  tokens: {
    access: { token: string };
    refresh: { token: string };
  };
};

type ProfileResponse = {
  user: BackendAuthUser;
};

export const login = async (email: string, password: string) => {
  const response = await api.post<LoginResponse>("/login", { email, password });

  tokenService.set({
    accessToken: response.data.tokens.access.token,
    refreshToken: response.data.tokens.refresh.token,
  });

  return normalizeAuthUser(response.data.user);
};

export const getProfile = async () => {
  const response = await api.get<ProfileResponse>("/users/Usermy/data");
  return normalizeAuthUser(response.data.user);
};

export const logout = () => {
  clearClientAuth();

  if (typeof window !== "undefined") {
    window.location.assign("/login");
  }
};

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || fallback;
  }

  return fallback;
};
