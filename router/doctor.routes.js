// backend - router/doctor.routes.js
import express from 'express';
import {
  getDoctorProfile,
  upsertDoctorProfile,
  getDoctorPatients,
} from '../controller/doctorController.js';
import { requireAuth, requireDoctor } from '../middleware/requireAuth.js';

const doctorRouter = express.Router();

doctorRouter.get('/profile', requireAuth, getDoctorProfile);
doctorRouter.put('/profile', requireAuth, upsertDoctorProfile);
doctorRouter.get('/patients', requireAuth, getDoctorPatients);

export default doctorRouter;
