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

// Get single doctor by ID
export const getDoctorById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        schedules: true, // DoctorSchedule relation, actual availability
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    const formattedDoctor = {
      id: doctor.id,
      user: doctor.user,
      specialization: doctor.specialization,
      qualifications: doctor.qualifications,
      experienceYears: doctor.experienceYears,
      licenseNumber: doctor.licenseNumber,
      hospital: doctor.hospital,
      location: doctor.location,
      about: doctor.about,
      consultationFee: doctor.consultationFee,
      image: doctor.image,
      schedules: doctor.schedules || [],
      rating: doctor.rating ?? 0,
      totalReviews: doctor.totalReviews ?? 0,
      isApproved: doctor.isApproved,
      patientsCount: doctor._count?.appointments || 0,
    };

    res.status(200).json({
      success: true,
      data: formattedDoctor,
    });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor details',
    });
  }
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
