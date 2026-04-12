/**
 * JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'documind_secret';

/**
 * Generate a JWT for a user
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, username: user.username },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Express middleware — requires valid Bearer JWT
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Format user object for API responses (strip password)
 */
function formatUser(user) {
  const { password, ...safe } = user;
  return {
    id: safe.id,
    email: safe.email,
    username: safe.username,
    fullName: safe.full_name,
    organization: safe.organization,
    profilePic: safe.profile_pic,
    provider: safe.provider,
    createdAt: safe.created_at,
  };
}

module.exports = { generateToken, requireAuth, formatUser };
