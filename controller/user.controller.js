// backend - controllers/user.controller.js

import prisma from '../lib/prisma.js';
import asyncHandler from '../middleware/asyncHandler.js';

export const getMeUser = asyncHandler(async (req, res) => {
  console.log('[/api/me] user from JWT:', req.user);
  res.json({ success: true, user: req.user });
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password and role are required',
    });
  }

  const user = await prisma.user.create({
    data: { name, email, password, role },
  });

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully',
  });
});
