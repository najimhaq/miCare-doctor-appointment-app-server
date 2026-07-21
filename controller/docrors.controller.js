// controllers/doctorController.js


import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';


export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.doctor.findMany({
    where: { isApproved: true },
    include: {
      user: {
        select: { name: true, email: true, image: true },
      },
      schedules: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, count: doctors.length, data: doctors });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true, schedules: true, reviews: true },
  });

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }
  res.status(200).json({ success: true, data: doctor });
});

export const getDoctorProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          image: true,
          status: true,
          isVerified: true,
        },
      },
      schedules: true,
      reviews: {
        include: { reviewer: { select: { name: true, image: true } } },
      },
      documents: true,
    },
  });

  if (!doctor) {
    return res
      .status(404)
      .json({ success: false, message: 'Doctor not found' });
  }

  res.status(200).json({ success: true, data: doctor });
});


