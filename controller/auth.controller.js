// backend/controller/auth.controller.js
import { auth } from '../lib/auth.js';

export const authController = async (req, res) => {
  try {
    // console.log('[/api/token/jwt] headers.cookie:', req.headers.cookie);

    const result = await auth.api.getSession({
      headers: req.headers,
      asResponse: true,
    });

    // console.log('[/api/token/jwt] result status:', result.status);

    const token = result.headers.get('set-auth-jwt');
    // console.log(token);

    if (!token) {
      return res.status(401).json({ message: 'No active session or JWT' });
    }

    return res.json({ token });
  } catch (err) {
    console.error('JWT endpoint error:', err);
    return res.status(500).json({ message: 'Failed to get JWT' });
  }
};
