import express from 'express';
import { getMe } from '../controller/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const authRouter = express.Router();

authRouter.get('/me', requireAuth, getMe);

export default authRouter;
