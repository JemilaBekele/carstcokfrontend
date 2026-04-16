/* eslint-disable @typescript-eslint/no-explicit-any */
//  b authConfig.ts
import { api } from '@/service/api';
import { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const authConfig: NextAuthOptions = {
  debug: true,  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials): Promise<User | null> {
            console.log("LOGIN TRY:", credentials);

        try {
          const response = await api.post('/login', {
            email: credentials?.email,
            password: credentials?.password
          });
    console.log("LOGIN RESPONSE:", response.data);

          const user = response.data.user;
          const accessToken = response.data.tokens?.access?.token;
    if (!user || !accessToken) {
      console.log("INVALID LOGIN RESPONSE");
      return null; // IMPORTANT
    }
          if (!accessToken || !user) {
            throw new Error('Authentication failed');
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: String(user.role || ''),
            phone: user.phone,
            roleType: user.roleType,
            token: accessToken,
            status: user.status,
            permissions: Array.isArray(user.permissions) ? user.permissions : []
          } as User;
        } catch (err: any) {
    console.log("LOGIN ERROR:", err?.response?.data || err.message);
    return null; // IMPORTANT
  }
      }
    })
  ],
    cookies: {   // 👈 ADD HERE (same level as providers)
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true
      }
    }
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token = {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          roleType: user.roleType,
          accessToken: user.token,
          status: user.status,
          permissions: Array.isArray(user.permissions) ? user.permissions : [],
        };
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        id: token.id as string,
        name: token.name as string,
        email: token.email as string,
        role: token.role as string,
        phone: token.phone as string,
        roleType: token.roleType as string,
        accessToken: token.accessToken as string,
        status: token.status as string,
        permissions: Array.isArray(token.permissions)
          ? (token.permissions as string[])
          : []
      };

      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60 // 8 hours — aligned with backend JWT_ACCESS_EXPIRATION_MINUTES
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
};

export default authConfig;
