// backend/src/middleware/auth.js

import { auth } from '../lib/auth.js';

// ============== AUTHENTICATION MIDDLEWARE ==============
export const authenticate = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
    }

    // Attach user and session to request
    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message,
    });
  }
};

// ============== OPTIONAL AUTH (for public routes with auth awareness) ==============
export const optionalAuth = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    req.user = session?.user || null;
    next();
  } catch {
    req.user = null;
    next();
  }
};
