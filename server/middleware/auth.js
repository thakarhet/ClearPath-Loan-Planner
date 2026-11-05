import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authCookieName = 'clearpath_session';

export function cookieOptions() {
  return { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 8 * 60 * 60 * 1000 };
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[authCookieName];
    if (!token) return res.status(401).json({ message: 'Please sign in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'clearpath', audience: 'clearpath-web' });
    const user = await User.findById(payload.sub).select('_id name email role');
    if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
    req.user = user;
    return next();
  } catch {
    res.clearCookie(authCookieName, cookieOptions());
    return res.status(401).json({ message: 'Your session expired. Please sign in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ message: 'You do not have permission to access this resource.' });
}
