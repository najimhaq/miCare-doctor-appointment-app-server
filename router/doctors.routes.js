import express from 'express';

const doctorRouter = express.Router();

import {
  getDoctors,
  getDoctorById,
  getDoctorSpecialties,
} from '../controller/doctorsController.js';

doctorRouter.get('/specialties', getDoctorSpecialties);
doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getDoctorById);


export default doctorRouter;
