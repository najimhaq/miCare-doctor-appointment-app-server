// middleware/auth.js
import { auth } from '../lib/auth.js';
import prisma from '../lib/prisma.js';

export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        patientProfile: true,
        doctorProfile: true,
        adminProfile: true,
      },
    });

    if (!fullUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = fullUser;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
};

export const requireDoctor = async (req, res, next) => {
  if (!req.user?.doctorProfile) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Doctor account required',
    });
  }
  next();
};

export const requirePatient = async (req, res, next) => {
  if (!req.user?.patientProfile) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Patient account required',
    });
  }
  next();
};
