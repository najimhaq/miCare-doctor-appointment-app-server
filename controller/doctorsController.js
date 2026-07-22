// controllers/doctorController.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getDoctors = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';
  const specialty = req.query.specialty || '';

  const where = {
    isApproved: true,
    ...(specialty && { specialization: specialty }),
    ...(search && {
      OR: [
        { specialization: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ],
    }),
  };

  const [doctors, total] = await prisma.$transaction([
    prisma.doctor.findMany({
      where,
      include: { user: { select: { name: true, email: true, image: true } }, schedules: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.doctor.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: doctors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  });
});

export const getDoctorById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const doctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true, schedules: true, reviews: true },
  });

  if (!doctor) {
    return res
      .status(404)
      .json({ success: false, message: 'Doctor not found' });
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
