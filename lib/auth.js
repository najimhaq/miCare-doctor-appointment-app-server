// backend - lib/auth.js
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import prisma from './prisma.js';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:8000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    process.env.NEXT_PUBLIC_API_FRONTEND_URL || 'http://localhost:3000',
  ],

  database: prismaAdapter(prisma, { provider: 'postgresql' }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'PATIENT',
        input: false, // user নিজে role সেট করতে পারবে না — security এর জন্য
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
});
