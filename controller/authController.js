// controllers/authController.js
import asyncHandler from '../middleware/asyncHandler.js';
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      image: req.user.image,
      role: req.user.role,
    },
  });
});
