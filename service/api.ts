// api.ts
import authConfig from '@/auth.config';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';

export const apiUrl = 'http://system.ordere.net/api';
// export const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export const api = axios.create({
  baseURL: apiUrl
});

api.interceptors.request.use(
  async (config) => {
    try {
      const session = await getServerSession(authConfig);
      const accessToken = session?.user?.accessToken;

      if (accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      } else {
      }

      return config;
    } catch (error) {
      throw error;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);
