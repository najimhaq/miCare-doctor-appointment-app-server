// routes/appointmentRoutes.js
import express from 'express';
import { requireAuth, requireDoctor, requirePatient } from '../middleware/requireAuth.js';
import {
  bookAppointment,
  getMyAppointments,
  getAvailableSlots,
  updateAppointment,
  cancelAppointment,
  restoreAppointment,
  getDoctorAppointments,
  updateAppointmentStatus,
} from '../controller/appointmentController.js';

const appointmentRoutes = express.Router();

//patient routes
appointmentRoutes.get('/:id/available-slots',requireAuth, requirePatient, getAvailableSlots);
appointmentRoutes.get('/my-appointments', requireAuth, requirePatient, getMyAppointments);
appointmentRoutes.patch('/:id', requireAuth, requirePatient, updateAppointment);
appointmentRoutes.delete('/:id', requireAuth, requirePatient, cancelAppointment);
appointmentRoutes.patch('/:id/restore', requireAuth, requirePatient, restoreAppointment);
appointmentRoutes.post('/book', requireAuth, requirePatient, bookAppointment);

//Doctor routes
appointmentRoutes.get(
  '/doctor/history',
  requireAuth,
  requireDoctor,
  getDoctorAppointments
);
appointmentRoutes.patch(
  '/:id/status',
  requireAuth,
  requireDoctor,
  updateAppointmentStatus
);

export default appointmentRoutes;
