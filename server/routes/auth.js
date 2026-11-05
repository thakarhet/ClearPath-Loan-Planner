import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import User from '../models/User.js';
import { authCookieName, cookieOptions, requireAuth } from '../middleware/auth.js';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many requests. Try again in 15 minutes.' } });
const dummyHash = '$2a$12$0bD9s4PMrW9WHLdbWFoB/.xOrj2RCmx6TUSyK7X7QZbQGFKLwnW3G';
const safeUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

function issueSession(user, res) {
  const token = jwt.sign({}, process.env.JWT_SECRET, { algorithm: 'HS256', subject: String(user._id), issuer: 'clearpath', audience: 'clearpath-web', expiresIn: '8h' });
  res.cookie(authCookieName, token, cookieOptions());
}

router.post('/register', loginLimiter, async (req, res, next) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ message: 'Enter a valid name and email. Passwords must be 12–72 characters.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    issueSession(user, res);
    res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    next(error);
  }
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select('+passwordHash +failedLoginAttempts +lockUntil');
    if (!user) {
      await bcrypt.compare(password.slice(0, 72), dummyHash);
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(401).json({ message: 'Email or password is incorrect, or sign-in is temporarily unavailable.' });
    }
    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }
    const valid = Buffer.byteLength(password, 'utf8') <= 72 && await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 3) user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();
      return res.status(401).json({ message: 'Email or password is incorrect, or sign-in is temporarily unavailable.' });
    }
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    issueSession(user, res);
    res.json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: safeUser(req.user) }));
router.post('/logout', (_req, res) => { res.clearCookie(authCookieName, cookieOptions()); res.status(204).end(); });

export default router;
