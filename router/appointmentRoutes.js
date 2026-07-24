// routes/appointmentRoutes.js
import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { bookAppointment } from '../controller/appointmentController.js';

const appointmentRoutes = express.Router();

appointmentRoutes.post('/book', requireAuth, bookAppointment);

export default appointmentRoutes;
