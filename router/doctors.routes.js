// backend - router/doctors.routes.js
import express from 'express';
const doctorsRouter = express.Router();

import {
  getDoctors,
  getDoctorById,
  getDoctorSpecialties,
  getDoctorAvailableSlots,
} from '../controller/doctorsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

doctorsRouter.get('/specialties', getDoctorSpecialties);
doctorsRouter.get('/:id/available-slots', getDoctorAvailableSlots);
doctorsRouter.get('/', getDoctors);
doctorsRouter.get('/:id', getDoctorById);

export default doctorsRouter;
