// middleware/auth.js
import { auth } from '../lib/auth.js';
import prisma from '../lib/prisma.js';

// backend - middleware/requireAuth.js
export const requireAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    console.log('🔍 Session:', session?.user?.id || 'NO SESSION'); // ✅ যুক্ত করুন

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

    console.log('🔍 Full User:', fullUser?.id || 'NOT FOUND'); // ✅ যুক্ত করুন

    if (!fullUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    req.user = fullUser;
    console.log('✅ req.user set:', req.user.id); // ✅ যুক্ত করুন
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
};

export const requireDoctor = async (req, res, next) => {
  console.log(req.user);
  if (!req.user?.doctorProfile) {
    return res.status(403).json({
      success: false,
      message: 'Access denied - Doctor account required',
    });
  }
  next();
};

// export const requirePatient = async (req, res, next) => {
//   if (!req.user?.patientProfile) {
//     return res.status(403).json({
//       success: false,
//       message: 'Access denied - Patient account required',
//     });
//   }
//   next();
// };

// backend - middleware/requirePatient.js
export const requirePatient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - Please login',
    });
  }

  if (req.user.role !== 'PATIENT') {
    return res.status(403).json({
      success: false,
      message: 'Only patients can book appointments',
    });
  }

  if (!req.user.patientProfile) {
    return res.status(403).json({
      success: false,
      message: 'Please complete your patient profile before booking an appointment',
    });
  }

  next();
};
