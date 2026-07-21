// backend/prisma/seed.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import doctorsData from './doctorsData.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const { doctors } = doctorsData;

function toEmail(name) {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@hospital.com`;
}

function toLicense(name, index) {
  return `LIC-${name.replace(/\s+/g, '').toUpperCase()}-${index + 1}-2024`;
}

async function main() {
  console.log('🌱 Seeding database...');

  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const email = toEmail(doc.name);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: doc.name,
        role: 'DOCTOR',
        status: 'ACTIVE',
        isVerified: true,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        licenseNumber: toLicense(doc.name, i),
        specialization: doc.specialty,
        experienceYears: parseInt(doc.experience) || 0,
        about: doc.description,
        consultationFee: doc.fee,
        image: doc.image,
        hospital: doc.hospital,
        location: doc.location,
        isApproved: true,
        approvedAt: new Date(),
      },
    });

    for (const slot of doc.availability) {
      const [startTime, endTime] = slot.split(' - ');
      await prisma.doctorSchedule.upsert({
        where: {
          doctorId_dayOfWeek_startTime: {
            doctorId: doctor.id,
            dayOfWeek: 1,
            startTime,
          },
        },
        update: {},
        create: {
          doctorId: doctor.id,
          dayOfWeek: 1,
          startTime,
          endTime,
        },
      });
    }

    console.log(`✅ Seeded doctor: ${doc.name}`);
  }

  console.log('🎉 Doctor seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
