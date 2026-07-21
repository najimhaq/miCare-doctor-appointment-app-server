// backend/src/lib/auth.js
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8000',
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-here',

  trustedOrigins: [
    process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Signup এর পর auto sign-in
    requireEmailVerification: false, // Production এ true করতে পারেন
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'PATIENT',
        input: false, // User নিজে role সেট করতে পারবে না
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookie: {
      name: 'better-auth-session',
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  // Social Providers
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            scope: ['email', 'profile'],
            callbackURL: `${process.env.BETTER_AUTH_URL || 'http://localhost:8000'}/api/auth/callback/google`,
          },
        },
      }
    : {}),

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // Max 100 requests per window
  },

  // Account linking
  accountLinking: {
    enabled: true,
    allowDifferentEmails: false,
  },

  // Callbacks
  callbacks: {
    async signIn({ user, account }) {
      console.log('User signed in:', user.email);
      return true;
    },

    async signUp({ user, account }) {
      console.log('User signed up:', user.email);

      // Create patient profile automatically
      try {
        await prisma.patient.create({
          data: {
            userId: user.id,
          },
        });
      } catch (error) {
        console.error('Failed to create patient profile:', error);
      }

      return true;
    },

    async session({ session, user }) {
      // Add custom data to session
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role,
        },
      };
    },
  },

  // Logging
  logger: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info',
  },

  // Cross-Origin Resource Sharing
  cors: {
    origin: process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

export default auth;
