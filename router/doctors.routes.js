import express from 'express';

const doctorRouter = express.Router();

import { getDoctors, getDoctorById } from '../controller/doctorsController.js';

doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getDoctorById);
doctorRouter.get('/specialties', getDoctorSpecialties);


export default doctorRouter;
