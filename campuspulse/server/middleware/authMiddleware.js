import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(req, res, next) {
  try {
    const cookieName = process.env.COOKIE_NAME || 'campuspulse_token';
    let token = req.cookies?.[cookieName];
    const header = req.headers.authorization;
    if (!token && header?.startsWith('Bearer ')) token = header.slice(7);

    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'User account not found' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}
