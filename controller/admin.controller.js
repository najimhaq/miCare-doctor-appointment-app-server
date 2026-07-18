// backend/controller/admin.controller.js
import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      image: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: users });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value',
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
    message: `User status updated to ${status}`,
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role } = req.body;

  const allowedRoles = ['TENANT', 'OWNER', 'ADMIN'];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role value',
    });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    data: user,
    message: 'User updated successfully',
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  console.log('delete user in req.user:', req.user);
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({
      success: false,
      message: 'You cannot delete your own account',
    });
  }

  await prisma.user.delete({ where: { id } });

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});
