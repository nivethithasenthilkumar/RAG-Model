/**
 * Login Page - Professional redesign
 * Features: Google & GitHub OAuth, JWT login, animated UI
 */

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const GITHUB_CLIENT_ID = process.env.REACT_APP_GITHUB_CLIENT_ID || '';

export default function LoginPage({ onRoutechange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (onRoutechange) onRoutechange();
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    if (!GOOGLE_CLIENT_ID) {
      window.location.href = `${API_URL}/api/auth/google`;
    } else {
      window.location.href = `${API_URL}/api/auth/google`;
    }
  };

  const handleGithubAuth = () => {
    if (!GITHUB_CLIENT_ID) {
      window.location.href = `${API_URL}/api/auth/github`;
    } else {
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=user:email&redirect_uri=${window.location.origin}/auth/github/callback`;
    }
  };

  return (
    <div style={styles.page}>
      {/* Theme Toggle */}
      <button style={styles.themeBtn} onClick={toggleTheme} title="Toggle theme">
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      {/* Logo & Title */}
      <div style={styles.header} className="animate-fadeInUp">
        <div style={styles.logoWrap}>
          <span style={styles.logoEmoji}>📚</span>
          <div style={styles.logoPulse} />
        </div>
        <h1 style={styles.title}>DocuMind</h1>
        <p style={styles.subtitle}>AI-Powered Document Intelligence</p>
      </div>

      {/* Card */}
      <div style={styles.card} className="animate-scaleIn">
        <h2 style={styles.cardTitle}>Welcome back</h2>
        <p style={{ ...styles.cardSub, color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 18 }}>
          Sign in to your account
        </p>

        {/* OAuth Buttons */}
        <button
          style={{ ...styles.socialBtn, ...styles.googleBtn }}
          className="btn btn-social btn-social-google"
          onClick={handleGoogleAuth}
          type="button"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button
          style={{ ...styles.socialBtn, ...styles.githubBtn }}
          className="btn btn-social btn-social-github"
          onClick={handleGithubAuth}
          type="button"
        >
          <GitHubIcon />
          Continue with GitHub
        </button>

        <div className="divider">or sign in with email</div>

        {/* Error */}
        {error && (
          <div className="alert alert-error animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              className="form-input"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={styles.eyeBtn}
              tabIndex={-1}
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : '🔐 Sign In'}
          </button>
        </form>

        <p style={styles.linkText}>
          New to DocuMind?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            Create account →
          </Link>
        </p>
      </div>
    </div>
  );
}

// ---- Sub-components ----

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

// Inline styles (theme-aware via CSS vars)
const styles = {
  page: {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 20px 30px',
    position: 'relative',
  },
  themeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-full)',
    width: 36,
    height: 36,
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 250ms',
    boxShadow: 'var(--shadow-sm)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  logoWrap: {
    position: 'relative',
    display: 'inline-block',
    marginBottom: 8,
  },
  logoEmoji: {
    fontSize: '3rem',
    display: 'block',
    filter: 'drop-shadow(0 4px 12px var(--color-primary-glow))',
    animation: 'cursorBob 3s ease-in-out infinite',
  },
  logoPulse: {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '50%',
    border: '2px solid var(--color-primary)',
    opacity: 0.35,
    animation: 'spin 4s linear infinite',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    marginTop: 4,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  card: {
    width: '100%',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--bg-glass-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px 22px',
    boxShadow: 'var(--shadow-md)',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.3rem',
    fontWeight: 700,
    margin: '0 0 2px',
    color: 'var(--text-primary)',
  },
  cardSub: {},
  socialBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-color)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    transition: 'all 250ms',
    marginBottom: 10,
    fontFamily: 'var(--font-body)',
  },
  googleBtn: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
  },
  githubBtn: {
    background: '#161b22',
    color: '#fff',
    border: '1.5px solid #30363d',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(10%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: 4,
    color: 'var(--text-muted)',
  },
  linkText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
    marginTop: 16,
  },
};
