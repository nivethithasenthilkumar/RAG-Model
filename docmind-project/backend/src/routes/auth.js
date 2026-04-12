/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/profile
 * PUT  /api/auth/password
 * GET  /api/auth/google  → Google OAuth
 * GET  /api/auth/github  → GitHub OAuth
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { generateToken, requireAuth, formatUser } = require('../middleware/auth');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, fullName, organization, profilePic } = req.body;

    if (!email || !username || !password || !fullName) {
      return res.status(400).json({ error: 'email, username, password and fullName are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check duplicates
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (db.prepare('SELECT id FROM users WHERE username = ?').get(username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (id, email, username, password, full_name, organization, profile_pic)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase(), username, hashedPassword, fullName, organization || null, profilePic || null);

    console.log(`💾 DB_INSERT: User [${email}] successfully committed to disk.`);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    const token = generateToken(user);

    res.status(201).json({
      message: 'Account created successfully',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.password) return res.status(401).json({ error: 'Please use OAuth to login (Google/GitHub)' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    
    // Log the successful login session
    db.prepare(`
      INSERT INTO login_history (id, user_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), user.id, req.ip, req.headers['user-agent']);

    res.json({
      message: 'Login successful',
      data: { token, user: formatUser(user) },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Get Profile ───────────────────────────────────────────────────────────────
router.get('/profile', requireAuth, (req, res) => {
  res.json({ data: formatUser(req.user) });
});

// ── Update Password ───────────────────────────────────────────────────────────
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be ≥ 6 chars' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user.password) return res.status(400).json({ error: 'Account uses OAuth — no password to change' });

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Old password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashed, user.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const googleAuthAvailable = !!passport._strategies?.google;
  if (!googleAuthAvailable) {
    return res.redirect(`${FRONTEND_URL}/login?error=Google+OAuth+not+configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  (req, res, next) => {
    if (!passport._strategies?.google) {
      return res.redirect(`${FRONTEND_URL}/login?error=Google+OAuth+not+configured`);
    }
    passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=google_failed` })(req, res, next);
  },
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${FRONTEND_URL}?token=${token}`);
  }
);

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get('/github', (req, res, next) => {
  if (!passport._strategies?.github) {
    return res.redirect(`${FRONTEND_URL}/login?error=GitHub+OAuth+not+configured`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback',
  (req, res, next) => {
    if (!passport._strategies?.github) {
      return res.redirect(`${FRONTEND_URL}/login?error=GitHub+OAuth+not+configured`);
    }
    passport.authenticate('github', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=github_failed` })(req, res, next);
  },
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${FRONTEND_URL}?token=${token}`);
  }
);

module.exports = router;
