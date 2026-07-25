// routes/appointmentRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  bookAppointment,
  getMyAppointments,
  getAvailableSlots,
  updateAppointment,
  cancelAppointment,
  restoreAppointment,
} from '../controller/appointmentController.js';

const appointmentRoutes = express.Router();

appointmentRoutes.get('/:id/available-slots', getAvailableSlots);
appointmentRoutes.get('/my-appointments', requireAuth, getMyAppointments);
appointmentRoutes.patch('/:id', requireAuth, updateAppointment);
appointmentRoutes.delete('/:id', requireAuth, cancelAppointment);
appointmentRoutes.patch('/:id/restore', requireAuth, restoreAppointment);
appointmentRoutes.post('/book', requireAuth, bookAppointment);

export default appointmentRoutes;
