/* eslint-disable @typescript-eslint/no-unused-vars */
import { IncomingMessage } from "http";
import api, { apiUrl } from "./api";
import { tokenService } from "./tokenService";

export const getAccessToken = async (
  req?: IncomingMessage,
): Promise<string | null> => {
  return tokenService.get()?.accessToken || null;
};

export const axiosWithAuth = (req?: IncomingMessage) => {
  return api;
};
