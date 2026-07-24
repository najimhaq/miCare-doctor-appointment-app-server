// middleware/auth.js
import { auth } from '../lib/auth.js'; // আপনার betterAuth() instance যেখানে init করা

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

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }
};
