import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';

// Environment variables validation
const requiredEnv = ['BETTER_AUTH_URL', 'BETTER_AUTH_SECRET'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing ${key} in environment variables`);
  }
}

// Secret key length validation
if (process.env.BETTER_AUTH_SECRET.length < 32) {
  console.warn('⚠️ BETTER_AUTH_SECRET should be at least 32 characters long');
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean), // ✅ ফিল্টার করে undefined বাদ দেওয়া

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
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  // ✅ Rate limiting যোগ করা হয়েছে (প্রোডাকশনে জরুরি)
  rateLimit: {
    enabled: true,
    window: 60, // 60 seconds
    max: 100, // max 100 requests per window
  },

  // ✅ Account linking (social login-এর জন্য)
  accountLinking: {
    enabled: true,
    allowDifferentEmails: false,
  },

  // ✅ Callbacks
  callbacks: {
    async signIn({ user, account }) {
      console.log(`🔐 User signed in: ${user.email}`);
      return true;
    },
    async signUp({ user }) {
      console.log(`📝 New user signed up: ${user.email}`);
      // Automatically create patient profile
      try {
        await prisma.patient.create({
          data: { userId: user.id },
        });
      } catch (error) {
        console.error('Failed to create patient profile:', error);
      }
      return true;
    },
    async session({ session, user }) {
      // ✅ Add role to session
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role || 'PATIENT',
        },
      };
    },
  },

  logger: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info',
  },
});

export default auth;
