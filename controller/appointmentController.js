// controllers/appointmentController.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

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
  const [h, m] = time.split(':').map(Number);
  const endDateObj = new Date(0, 0, 0, h, m + duration);
  const endTime = `${String(endDateObj.getHours()).padStart(2, '0')}:${String(endDateObj.getMinutes()).padStart(2, '0')}`;

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
