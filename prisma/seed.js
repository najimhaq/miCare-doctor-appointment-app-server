/*Create Admin -  Development Phase এ:
👉 Method 1 (Seeding) ব্যবহার করুন দ্রুত ডেভেলপমেন্ট শুরু করা যায় ,টিমের সবাই একই অ্যাডমিন ব্যবহার করতে পারে,
.env ফাইল গিটে কমিট করবেন না */
// prisma/seed.js

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 StayNest Database Seeding...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@staynest.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Super Admin';

  try {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // ১. User টেবিলে অ্যাডমিন তৈরি (password ছাড়া)
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        role: 'ADMIN',
        emailVerified: true,
        name: adminName,
      },
      create: {
        email: adminEmail,
        name: adminName,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    // ২. Account টেবিলে credential password সংরক্ষণ
    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: 'credential',
          accountId: adminEmail,
        },
      },
      update: {
        password: hashedPassword,
      },
      create: {
        userId: admin.id,
        providerId: 'credential',
        accountId: adminEmail,
        password: hashedPassword,
      },
    });

    console.log('✅ Admin User Ready:');
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👤 Name: ${admin.name}`);
    console.log(`   🔑 Role: ${admin.role}`);
    console.log(`   🔒 Password: ${adminPassword}\n`);
    console.log('🎉 Seeding completed successfully!\n');

  } catch (error) {
    console.error('❌ Seed Error:', error.message);

    if (error.code === 'P2002') {
      console.error('   Unique constraint error - admin already exists');
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();


  //npx prisma db seed
