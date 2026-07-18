// backend/routes/auth.routes.js
import express from 'express';
import { authController } from '../controller/auth.controller.js';

const authRouter = express.Router();

authRouter.get('/jwt', authController);

export default authRouter;
