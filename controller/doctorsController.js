// controllers/doctorsController.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

// Get all doctors
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
      include: {
        user: { select: { name: true, email: true, image: true } },
        schedules: true,
      },
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
          select: { id: true, name: true, email: true, image: true },
        },
        schedules: true,
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
      consultationFee: Number(doctor.consultationFee), // Decimal → Number
      image: doctor.image,
      schedules: doctor.schedules || [],
      rating: Number(doctor.rating ?? 0),
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

// ✅ নতুন: নির্দিষ্ট তারিখের জন্য available time slots বের করা
export const getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res
      .status(400)
      .json({ success: false, message: 'Date is required' });
  }

  const dayOfWeek = new Date(date).getDay();

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId: id, dayOfWeek, isAvailable: true },
  });

  if (!schedule) {
    return res.status(200).json({ success: true, data: [] });
  }

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId: id,
      appointmentDate: new Date(date),
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: { startTime: true },
  });
  const bookedTimes = bookedAppointments.map((a) => a.startTime);

  function to24Hour(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const slots = [];
  let current = new Date(`2000-01-01T${to24Hour(schedule.startTime)}:00`);
  const endTime = new Date(`2000-01-01T${to24Hour(schedule.endTime)}:00`);
  const duration = schedule.slotDuration || 30;

  while (current < endTime) {
    const hh = String(current.getHours()).padStart(2, '0');
    const mm = String(current.getMinutes()).padStart(2, '0');
    const time24 = `${hh}:${mm}`;

    const hour12 = current.getHours() % 12 || 12;
    const ampm = current.getHours() >= 12 ? 'PM' : 'AM';
    const displaySlot = `${String(hour12).padStart(2, '0')}:${mm} ${ampm}`;

    if (!bookedTimes.includes(time24) && !bookedTimes.includes(displaySlot)) {
      slots.push(displaySlot);
    }
    current.setMinutes(current.getMinutes() + duration);
  }

  res.status(200).json({ success: true, data: slots });
});

// Get all specialties
export const getDoctorSpecialties = asyncHandler(async (req, res) => {
  const result = await prisma.doctor.findMany({
    where: { isApproved: true },
    select: { specialization: true },
    distinct: ['specialization'],
  });
  const specialties = result.map((d) => d.specialization).filter(Boolean);
  res.status(200).json({ success: true, data: specialties });
});
