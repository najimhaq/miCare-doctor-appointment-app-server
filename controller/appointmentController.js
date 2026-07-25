// controllers/appointmentController.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';
// Get available slots
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { id: doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Date is required',
    });
  }

  const requestedDate = new Date(date);
  if (isNaN(requestedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format',
    });
  }

  const dayOfWeek = requestedDate.getDay(); // 0=Sun ... 6=Sat

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { id: true, isApproved: true },
  });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found',
    });
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId,
      dayOfWeek,
      isAvailable: true,
    },
  });

  if (schedules.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No schedule available for this day',
    });
  }

  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: { gte: startOfDay, lte: endOfDay },
      status: {
        notIn: ['CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'NO_SHOW'],
      },
    },
    select: { startTime: true },
  });

  const bookedCounts = {};
  bookedAppointments.forEach((appt) => {
    bookedCounts[appt.startTime] = (bookedCounts[appt.startTime] || 0) + 1;
  });

  const allSlots = [];

  for (const schedule of schedules) {
    const slots = generateTimeSlots(
      schedule.startTime,
      schedule.endTime,
      schedule.slotDuration
    );

    for (const slot of slots) {
      const bookedCount = bookedCounts[slot] || 0;
      if (bookedCount < schedule.maxPatientsPerSlot) {
        allSlots.push(slot);
      }
    }
  }

  const today = new Date();
  const isToday = requestedDate.toDateString() === today.toDateString();
  const currentTime = today.getHours() * 60 + today.getMinutes();

  const filteredSlots = isToday
    ? allSlots.filter((slot) => parseTimeToMinutes(slot) > currentTime)
    : allSlots;

  res.status(200).json({
    success: true,
    data: filteredSlots,
  });
});

function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  let current = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  while (current + duration <= end) {
    slots.push(formatMinutesToTime(current));
    current += duration;
  }

  return slots;
}

function parseTimeToMinutes(timeStr) {
  const [time, modifier] = timeStr.trim().split(' ');
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  let hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${modifier}`;
}

// Book an appointment
export const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time } = req.body;
  const userId = req.user?.id;

  if (!doctorId || !date || !time) {
    return res.status(400).json({
      success: false,
      message: 'doctorId, date, and time are required',
    });
  }

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient profile not found. Please complete your profile first.',
    });
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return res
      .status(404)
      .json({ success: false, message: 'Doctor not found' });
  }
  if (!doctor.isApproved) {
    return res
      .status(400)
      .json({ success: false, message: 'Doctor is not available for booking' });
  }

  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate.getDay();

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek, isAvailable: true },
  });

  if (!schedule) {
    return res.status(400).json({
      success: false,
      message: 'Doctor is not available on this day',
    });
  }

  // ওই সময় schedule window-এর ভেতরে আছে কিনা যাচাই
  if (time < schedule.startTime || time >= schedule.endTime) {
    return res.status(400).json({
      success: false,
      message: 'Selected time is outside doctor availability',
    });
  }

  const duration = schedule.slotDuration || 30;
  const startMinutes = parseTimeToMinutes(time);
  const endTime = formatMinutesToTime(startMinutes + duration);

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate,
        startTime: time,
        endTime,
        status: 'PENDING',
        amount: doctor.consultationFee,
      },
    });

    // ডাক্তারকে notification পাঠানো (optional কিন্তু ভালো practice)
    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: 'New Appointment Request',
        message: `New appointment request for ${date} at ${time}`,
        type: 'APPOINTMENT',
        link: `/dashboard/doctor/appointments/${appointment.id}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'This slot is already booked. Please choose another time.',
      });
    }
    console.error('Booking error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to book appointment' });
  }
});

// Get my appointments
export const getMyAppointments = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient profile not found',
    });
  }

  const appointments = await prisma.appointment.findMany({
    where: { patientId: patient.id },
    include: {
      doctor: {
        include: { user: { select: { name: true, image: true } } },
      },
    },
    orderBy: { appointmentDate: 'desc' },
  });

  res.status(200).json({ success: true, data: appointments });
});

// Cancel/delete appointment
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    return res
      .status(404)
      .json({ success: false, message: 'Patient profile not found' });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment || appointment.patientId !== patient.id) {
    return res
      .status(404)
      .json({ success: false, message: 'Appointment not found' });
  }

  if (
    appointment.status === 'CANCELLED_BY_PATIENT' ||
    appointment.status === 'COMPLETED'
  ) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel an appointment that is already ${appointment.status.toLowerCase()}`,
    });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: 'CANCELLED_BY_PATIENT' },
  });

  res
    .status(200)
    .json({ success: true, message: 'Appointment cancelled', data: updated });
});

// Update (reschedule) appointment
export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;
  const userId = req.user?.id;

  if (!date || !time) {
    return res
      .status(400)
      .json({ success: false, message: 'date and time are required' });
  }

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    return res
      .status(404)
      .json({ success: false, message: 'Patient profile not found' });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment || appointment.patientId !== patient.id) {
    return res
      .status(404)
      .json({ success: false, message: 'Appointment not found' });
  }

  if (
    [
      'CANCELLED_BY_PATIENT',
      'CANCELLED_BY_DOCTOR',
      'COMPLETED',
      'NO_SHOW',
    ].includes(appointment.status)
  ) {
    return res.status(400).json({
      success: false,
      message: `Cannot reschedule an appointment that is ${appointment.status.toLowerCase()}`,
    });
  }

  const appointmentDate = new Date(date);
  const dayOfWeek = appointmentDate.getDay();

  const schedule = await prisma.doctorSchedule.findFirst({
    where: { doctorId: appointment.doctorId, dayOfWeek, isAvailable: true },
  });

  if (!schedule) {
    return res
      .status(400)
      .json({ success: false, message: 'Doctor is not available on this day' });
  }

  const timeMinutes = parseTimeToMinutes(time);
  const scheduleStartMinutes = parseTimeToMinutes(schedule.startTime);
  const scheduleEndMinutes = parseTimeToMinutes(schedule.endTime);

  if (timeMinutes < scheduleStartMinutes || timeMinutes >= scheduleEndMinutes) {
    return res
      .status(400)
      .json({
        success: false,
        message: 'Selected time is outside doctor availability',
      });
  }

  const duration = schedule.slotDuration || 30;
  const endTime = formatMinutesToTime(timeMinutes + duration);

  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        appointmentDate,
        startTime: time,
        endTime,
        status: 'PENDING',
      },
    });

    res
      .status(200)
      .json({
        success: true,
        message: 'Appointment rescheduled',
        data: updated,
      });
  } catch (error) {
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ success: false, message: 'This slot is already booked' });
    }
    console.error('Reschedule error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to reschedule appointment' });
  }
});

// Restore cancelled appointment
export const restoreAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const patient = await prisma.patient.findUnique({ where: { userId } });
  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment || appointment.patientId !== patient.id) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  if (appointment.status !== 'CANCELLED_BY_PATIENT') {
    return res.status(400).json({
      success: false,
      message: 'Only appointments cancelled by you can be restored',
    });
  }


  const now = new Date();
  const apptDate = new Date(appointment.appointmentDate);
  if (apptDate < new Date(now.toDateString())) {
    return res.status(400).json({
      success: false,
      message: 'Cannot restore a past appointment',
    });
  }

  // ওই স্লট এর মধ্যে অন্য কেউ বুক করে ফেলেছে কিনা চেক
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      status: { in: ['PENDING', 'CONFIRMED'] },
      id: { not: id },
    },
  });

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: 'This slot has been booked by someone else. Please choose a new time.',
    });
  }

  const restored = await prisma.appointment.update({
    where: { id },
    data: { status: 'PENDING' },
  });

  res.status(200).json({ success: true, message: 'Appointment restored', data: restored });
});
