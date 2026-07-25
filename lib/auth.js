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
    requireEmailVerification: false,
    resetPasswordTokenExpiresIn: 3600,
  },

  trustedOrigins: [
    process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
  ].filter(Boolean),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
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

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },

  accountLinking: {
    enabled: true,
    allowDifferentEmails: false,
  },

  // ✅ সঠিক hook structure
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log(`📝 New user signed up: ${user.email}`);
          try {
            if (!user.role || user.role === 'PATIENT') {
              await prisma.patient.create({
                data: { userId: user.id },
              });
              console.log(`✅ Patient profile created for ${user.email}`);
            }
          } catch (error) {
            console.error('Failed to create patient profile:', error);
          }
        },
      },
    },
  },

  logger: {
    enabled: process.env.NODE_ENV === 'development',
    level: 'info',
  },
});

export default auth;


