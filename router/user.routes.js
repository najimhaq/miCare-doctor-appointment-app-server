// backend/router/user.routes.js
import express from 'express';
import { createUser, getMeUser } from '../controller/user.controller.js';
import protect from '../middleware/tokenProtect.js';

const userRouter = express.Router();

// GET /api/users/me
userRouter.get('/users/me', protect, getMeUser);

// POST /api/users
userRouter.post('/users', createUser);

export default userRouter;
