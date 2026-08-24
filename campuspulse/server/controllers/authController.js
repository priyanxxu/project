import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { generateToken, setAuthCookie } from '../utils/generateToken.js';

const publicUser = user => ({
  id: user._id,
  name: user.name,
  email: user.email,
  college: user.college,
  department: user.department,
  year: user.year,
  role: user.role,
  avatar: user.avatar,
  provider: user.provider
});

export async function register(req, res, next) {
  try {
    const { name, email, password, college, department, year, role = 'student' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    if (!['student', 'organizer'].includes(role)) return res.status(400).json({ success: false, message: 'Only student or organizer registration is available publicly' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword, college, department, year, role, provider: 'local' });
    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);
    return res.status(201).json({ success: true, message: 'Account created successfully', data: { user: publicUser(user) } });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, portalRole } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (portalRole && user.role !== portalRole) {
      return res.status(403).json({ success: false, message: `You do not have ${portalRole} access.` });
    }

    const token = generateToken(user._id.toString());
    setAuthCookie(res, token);
    return res.json({ success: true, message: 'Login successful', data: { user: publicUser(user) } });
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res) {
  return res.json({ success: true, data: { user: publicUser(req.user) } });
}

export function logout(req, res) {
  const cookieName = process.env.COOKIE_NAME || 'campuspulse_token';
  res.clearCookie(cookieName, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
}

export function oauthStart(provider) {
  return (req, res, next) => {
    const config = {
      google: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
      github: ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'],
      facebook: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET']
    }[provider];
    if (!config?.every(key => process.env[key]?.trim())) {
      return res.status(503).json({ success: false, message: `${provider[0].toUpperCase() + provider.slice(1)} OAuth is not configured. Add the provider credentials to server/.env.` });
    }
    next();
  };
}

export function oauthCallback(provider) {
  return (req, res) => {
    try {
      const token = generateToken(req.user._id.toString());
      setAuthCookie(res, token);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/auth/callback?provider=${encodeURIComponent(provider)}`);
    } catch (error) {
      console.error(`OAuth ${provider} callback failed: ${error.message}`);
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientUrl}/login?oauthError=${encodeURIComponent(`${provider[0].toUpperCase() + provider.slice(1)} login failed. Please check the OAuth provider configuration and try again.`)}`);
    }
  };
}

export function oauthFailure(provider) {
  return (req, res) => {
    console.error(`OAuth ${provider} failed during callback.`);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientUrl}/login?oauthError=${encodeURIComponent(`${provider[0].toUpperCase() + provider.slice(1)} login failed. Please try again.`)}`);
  };
}
