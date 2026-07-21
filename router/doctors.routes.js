import express from 'express';

const doctorRouter = express.Router();

import { getDoctors, getSingleDoctor } from '../controller/doctors.controller.js';

doctorRouter.get('/', getDoctors);
doctorRouter.get('/:id', getSingleDoctor);

export default doctorRouter;
