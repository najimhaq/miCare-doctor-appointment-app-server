// backend - router/doctor.routes.js
import express from 'express';
import {
  getDoctorProfile,
  upsertDoctorProfile,
} from '../controller/doctorController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const doctorRouter = express.Router();

doctorRouter.get('/profile',requireAuth, getDoctorProfile);
doctorRouter.put('/profile',requireAuth, upsertDoctorProfile);

export default doctorRouter;
