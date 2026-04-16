/* eslint-disable import/no-unresolved */
import authConfig from '@/auth.config';
import axios from 'axios';
import { IncomingMessage, ServerResponse } from 'http';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';

export const apiUrl = process.env.NEXT_PUBLIC_API_URL;



// Utility to get the access token (SSR or CSR)
export const getAccessToken = async (
  req?: IncomingMessage
): Promise<string | null> => {
  try {
    if (req) {
      const res = {} as ServerResponse<IncomingMessage>;
      const session = await getServerSession({ req, res, ...authConfig });
      return session?.user?.accessToken || null;
    } else {
      const session = await getSession();
      return session?.user?.accessToken || null;
    }
  } catch (error) {
    return null;
  }
};

// Axios instance with interceptor
export const axiosWithAuth = (req?: IncomingMessage) => {
  const instance = axios.create({
    baseURL: apiUrl
  });

  instance.interceptors.request.use(
    async (config) => {
      try {
        const accessToken = await getAccessToken(req);

        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
      } catch (error) {
        return config; // Still allow request without token if needed
      }
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};
