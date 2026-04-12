/**
 * DocuMind Backend - Main Entry Point
 * Node.js + Express + Passport OAuth + Endee Vector DB
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const fs = require('fs');

// Routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const ragRoutes = require('./routes/rag');
const healthRoutes = require('./routes/health');

// Passport config
require('./config/passport');

// Init DB
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Ensure upload directory exists ──────────────────────────────────────────
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true, // Allow all origins during development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'documind_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());

// ── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadDir));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api', healthRoutes);

// ── Root ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    name: 'DocuMind API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET  /api/health',
      'GET  /api/stats',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/profile',
      'GET  /api/auth/google',
      'GET  /api/auth/github',
      'GET  /api/documents',
      'POST /api/documents/upload',
      'DELETE /api/documents/:id',
      'POST /api/rag/search',
      'GET  /api/rag/analytics',
      'GET  /api/rag/history',
    ],
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get()?.count || 0;
  console.log(`\n🚀 DocuMind Backend running at http://127.0.0.1:${PORT}`);
  console.log(`💾 LOCAL STORAGE: documind.db holds [${userCount}] Registered Users`);
  console.log(`📊 Endee Vector DB expected at ${process.env.ENDEE_BASE_URL || 'http://localhost:8080'}`);
  console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? '✅ Configured' : '⚠️  Missing client ID'}`);
  console.log(`🐙 GitHub OAuth: ${process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here' ? '✅ Configured' : '⚠️  Missing client ID'}`);
  console.log(`🤖 Gemini AI Engine: ${process.env.GEMINI_API_KEY ? '✅ ACTIVE (Pro Mode)' : '⚠️  Disconnected (Demo Mode)'}\n`);
});

module.exports = app;
