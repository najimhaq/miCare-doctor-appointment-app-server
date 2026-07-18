// backend - scripts/createAdmin.js
// Terminal theke run korbe: node scripts/create-admin.js

import { auth } from '../lib/auth.js';
import prisma from '../lib/prisma.js';

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log('Admin already exists:', email);
    return;
  }

  const result = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: 'Super Admin',
    },
  });

  await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
  });

  console.log('Admin created:', email);
}

createAdmin()
  .catch(console.error)
  .finally(() => process.exit());

//bash - node scripts/createAdmin.js
