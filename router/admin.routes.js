// backend/router/admin.routes.js
import express from 'express';
import protect from '../middleware/tokenProtect.js';
import requireRole from '../middleware/requireRole.js';
import {
  getAllUsers,
  updateUserStatus,
  updateUser,
  deleteUser,
} from '../controller/admin.controller.js';

const adminRouter = express.Router();

// সব admin route-এর জন্য একবারে auth + role check
adminRouter.use(protect, requireRole('ADMIN'));

adminRouter.get('/users', getAllUsers);
adminRouter.patch('/users/:id/status', updateUserStatus);
adminRouter.patch('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);

export default adminRouter;
