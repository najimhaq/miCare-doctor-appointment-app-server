import express from 'express';

const doctorRouter = express.Router();

import {
  getDoctors,
  getDoctorById,
  getDoctorSpecialties,
  getDoctorAvailableSlots,
} from '../controller/doctorsController.js';

doctorRouter.get('/specialties', getDoctorSpecialties);
doctorRouter.get('/:id/available-slots', getDoctorAvailableSlots);
doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getDoctorById);


export default doctorRouter;
