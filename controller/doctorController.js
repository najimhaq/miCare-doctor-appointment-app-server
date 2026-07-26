// backend - controller/doctorController.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

// GET /api/doctor/profile
export const getDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          phone: true,
          role: true,
          status: true,
        },
      },
      schedules: true,
    },
  });

  res.status(200).json({
    success: true,
    data: doctor || null,
  });
});

// PUT /api/doctor/profile — Upsert (create if not exists, update if exists)
export const upsertDoctorProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const {
    specialization,
    qualifications,
    licenseNumber,
    experienceYears,
    consultationFee,
    about,
    hospital,
    location,
    image,
    name,
    phone,
  } = req.body;

  if (!specialization || !licenseNumber) {
    return res.status(400).json({
      success: false,
      message: 'Specialization and License Number are required',
    });
  }

  if (experienceYears !== undefined && experienceYears < 0) {
    return res.status(400).json({
      success: false,
      message: 'Experience cannot be negative',
    });
  }

  if (consultationFee !== undefined && consultationFee < 0) {
    return res.status(400).json({
      success: false,
      message: 'Consultation fee cannot be negative',
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (name || phone) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(name && { name }),
            ...(phone && { phone }),
          },
        });
      }

      const doctor = await tx.doctor.upsert({
        where: { userId },
        update: {
          ...(specialization !== undefined && { specialization }),
          ...(qualifications !== undefined && { qualifications }),
          ...(licenseNumber !== undefined && { licenseNumber }),
          ...(experienceYears !== undefined && { experienceYears }),
          ...(consultationFee !== undefined && { consultationFee }),
          ...(about !== undefined && { about }),
          ...(hospital !== undefined && { hospital }),
          ...(location !== undefined && { location }),
          ...(image !== undefined && { image }),
        },
        create: {
          userId,
          specialization,
          qualifications: qualifications || null,
          licenseNumber,
          experienceYears: experienceYears || 0,
          consultationFee: consultationFee || 0,
          about: about || null,
          hospital: hospital || null,
          location: location || null,
          image: image || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              phone: true,
              role: true,
            },
          },
        },
      });

      return doctor;
    });

    res.status(200).json({
      success: true,
      message: 'Doctor profile saved successfully',
      data: result,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message:
          'This license number is already registered with another account',
      });
    }
    throw err;
  }
});
