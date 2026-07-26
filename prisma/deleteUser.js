// backend/prisma/deleteUser.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'rafa@email.com';
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log('User not found');
    return;
  }

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.patient.deleteMany({ where: { userId: user.id } });
  await prisma.doctor.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  console.log(`✅ Deleted user and related records for ${email}`);
}

main().finally(() => prisma.$disconnect());
