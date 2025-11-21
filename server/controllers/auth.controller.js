import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import zxcvbn from 'zxcvbn';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET || 'changeme', { expiresIn: '7d' });

const sendOnboardingEmail = async (email, username) => {
  if (!email) return;
  const message = `Hey ${username}, welcome to Zyntex! Add an avatar and bio to complete your profile.`;
  console.log(`[WELCOME EMAIL] -> ${email}: ${message}`);
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const lower = String(username).toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(lower)) {
      return res.status(400).json({ message: 'Username must be 3-20 chars, lowercase letters, numbers or _' });
    }
    const blacklist = new Set(['admin','root','support','api','login','signup','system']);
    if (blacklist.has(lower)) {
      return res.status(400).json({ message: 'Username is reserved' });
    }
    const strength = zxcvbn(password);
    if (strength.score < 2) {
      return res.status(400).json({ message: 'Password too weak. Try a longer passphrase with mixed words.' });
    }
    const existing = await User.findOne({ $or: [email ? { email } : null, { username: lower }].filter(Boolean) });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username: lower, email: email || undefined, passwordHash });
    const token = signToken(user._id);
    if (email) {
      await sendOnboardingEmail(email, lower);
      await Notification.create({
        user: user._id,
        title: 'Complete your profile',
        body: 'Add an avatar and bio so friends can recognize you. Tap to jump into settings.',
        link: '/profile'
      });
    }
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const loginId = identifier || email; // backward compat
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required' });
    }
    const user = await User.findOne({ $or: [{ email: loginId }, { username: loginId }] });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(user._id);
    res.json({ user: { id: user._id, username: user.username, email: user.email }, token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// naive mailer: logs to server console. Replace with nodemailer in production.
const sendResetCode = async (email, code) => {
  console.log(`[RESET CODE] Send to ${email}: ${code}`);
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email, identifier } = req.body;
    const lookup = email || identifier;
    if (!lookup) return res.status(400).json({ message: 'Email or username required' });
    const user = await User.findOne({ $or: [{ email: lookup }, { username: lookup }] });
    if (!user) return res.status(200).json({ message: 'If that email exists, a code was sent' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    if (user.email) {
      await sendResetCode(user.email, code);
    }
    const extra = process.env.NODE_ENV === 'production' ? {} : { devCode: code, note: user.email ? undefined : 'No email on file; use devCode.' };
    res.json({ message: 'If that email exists, a code was sent', ...extra });
  } catch (err) {
    res.status(500).json({ message: 'Failed to request reset', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, identifier, code, newPassword } = req.body;
    const lookup = email || identifier;
    if (!lookup || !code || !newPassword) {
      return res.status(400).json({ message: 'Email/username, code, and new password are required' });
    }
    const user = await User.findOne({ $or: [{ email: lookup }, { username: lookup }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.resetCode || !user.resetCodeExpires) {
      return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
    }
    if (user.resetCode !== String(code).trim() || user.resetCodeExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }
    const strength = zxcvbn(newPassword);
    if (strength.score < 2) {
      return res.status(400).json({ message: 'Password too weak.' });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reset password', error: err.message });
  }
};

