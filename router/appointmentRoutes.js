// routes/appointmentRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  bookAppointment,
  getMyAppointments,
} from '../controller/appointmentController.js';

const appointmentRoutes = express.Router();

appointmentRoutes.get('/my-appointments', requireAuth, getMyAppointments);
appointmentRoutes.post('/book', requireAuth, bookAppointment);

export default appointmentRoutes;
