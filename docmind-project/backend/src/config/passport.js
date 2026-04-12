/**
 * Passport.js Configuration
 * Google OAuth 2.0 + GitHub OAuth strategies
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// ── Serialize / Deserialize ──────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// ── Helper: find or create OAuth user ────────────────────────────────────────
function findOrCreateOAuthUser({ email, fullName, profilePic, provider, providerId, username }) {
  // Try find by provider
  let user = db.prepare('SELECT * FROM users WHERE provider = ? AND provider_id = ?').get(provider, providerId);
  if (user) return user;

  // Try find by email
  user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user) {
    db.prepare('UPDATE users SET provider = ?, provider_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(provider, providerId, user.id);
    return user;
  }

  // Create new user
  const id = uuidv4();
  const safeUsername = (username || email.split('@')[0]).replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
  let finalUsername = safeUsername;
  let counter = 1;
  while (db.prepare('SELECT id FROM users WHERE username = ?').get(finalUsername)) {
    finalUsername = `${safeUsername}${counter++}`;
  }

  db.prepare(`
    INSERT INTO users (id, email, username, full_name, profile_pic, provider, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, finalUsername, fullName, profilePic || null, provider, providerId);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ── Google Strategy ───────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here') {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(new Error('No email from Google'));

        const user = findOrCreateOAuthUser({
          email,
          fullName: profile.displayName,
          profilePic: profile.photos?.[0]?.value,
          provider: 'google',
          providerId: profile.id,
          username: profile.displayName?.replace(/\s+/g, '').toLowerCase(),
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  console.log('✅ Google OAuth strategy registered');
} else {
  console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID)');
}

// ── GitHub Strategy ───────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here') {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email'],
    },
    (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;
        const user = findOrCreateOAuthUser({
          email,
          fullName: profile.displayName || profile.username,
          profilePic: profile.photos?.[0]?.value,
          provider: 'github',
          providerId: String(profile.id),
          username: profile.username,
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
  console.log('✅ GitHub OAuth strategy registered');
} else {
  console.log('⚠️  GitHub OAuth not configured (missing GITHUB_CLIENT_ID)');
}
