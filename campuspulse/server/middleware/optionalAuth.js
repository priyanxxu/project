import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function optionalProtect(req, _res, next) {
  try {
    const cookieName = process.env.COOKIE_NAME || 'campuspulse_token';
    let token = req.cookies?.[cookieName];
    const header = req.headers.authorization;
    if (!token && header?.startsWith('Bearer ')) token = header.slice(7);
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select('-password');
    }
  } catch {
    // The public AI remains usable when no valid session exists.
  }
  next();
}
