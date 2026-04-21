// api.ts
import axios from 'axios';
import { getServerSession } from 'next-auth/next';

// export const apiUrl = 'https://ordere.net/api';
export const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export const api = axios.create({
  baseURL: apiUrl
});

