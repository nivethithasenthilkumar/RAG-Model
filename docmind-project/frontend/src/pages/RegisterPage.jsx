/**
 * Register Page - Professional redesign
 * Features: Google & GitHub OAuth, profile photo, animated UI
 */

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function RegisterPage({ onRoutechange }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    fullName: '',
    organization: '',
  });
  const [profilePic, setProfilePic] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (onRoutechange) onRoutechange();
      if (formData.password.length < 6) throw new Error('Password must be at least 6 characters');
      await register(formData.email, formData.username, formData.password, formData.fullName, formData.organization, profilePic);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => { window.location.href = `${API_URL}/api/auth/google`; };
  const handleGithubAuth = () => { window.location.href = `${API_URL}/api/auth/github`; };

  return (
    <div style={styles.page}>
      {/* Theme toggle */}
      <button style={styles.themeBtn} onClick={toggleTheme}>{isDarkMode ? '☀️' : '🌙'}</button>

      {/* Header */}
      <div style={styles.header} className="animate-fadeInUp">
        <span style={styles.logoEmoji}>📚</span>
        <h1 style={styles.title}>Join DocuMind</h1>
        <p style={styles.subtitle}>AI Document Intelligence Platform</p>
      </div>

      {/* Card */}
      <div style={styles.card} className="animate-scaleIn">
        <h2 style={styles.cardTitle}>Create account</h2>

        {/* OAuth */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={handleGoogleAuth} style={{ ...styles.oauthBtn }} type="button">
            <GoogleIcon /> Google
          </button>
          <button onClick={handleGithubAuth} style={{ ...styles.oauthBtn, ...styles.githubBtn }} type="button">
            <GitHubIcon /> GitHub
          </button>
        </div>

        <div className="divider">or register with email</div>

        {error && <div className="alert alert-error animate-fadeIn">⚠️ {error}</div>}

        {/* Profile photo */}
        <div className="file-upload-wrapper" style={{ marginBottom: 16 }}>
          <img
            src={profilePic || `https://ui-avatars.com/api/?name=${formData.fullName || 'D'}&background=d4af37&color=fff&size=200`}
            alt="Profile"
            className="profile-preview"
          />
          <label className="upload-btn" style={{ fontSize: '0.82rem' }}>
            📷 Upload Photo
            <input type="file" accept="image/*" capture="user" className="file-input" onChange={handleImageUpload} />
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-input"
                placeholder="Jane Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
                style={{ padding: '10px 12px', fontSize: '0.875rem' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="janedoe"
                value={formData.username}
                onChange={handleChange}
                required
                style={{ padding: '10px 12px', fontSize: '0.875rem' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <input
              type={showPass ? 'text' : 'password'}
              name="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="form-group">
            <label className="form-label">Organization <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
            <input
              type="text"
              name="organization"
              className="form-input"
              placeholder="Your company"
              value={formData.organization}
              onChange={handleChange}
            />
          </div>

          {/* Password strength */}
          <PasswordStrength password={formData.password} />

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating...</> : '🚀 Create Account'}
          </button>
        </form>

        <p style={styles.linkText}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;
  const len = password.length;
  const score = len < 6 ? 1 : len < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 99,
            background: i <= score ? colors[score] : 'var(--border-color)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: '0.72rem', color: colors[score], fontWeight: 600, margin: 0 }}>{labels[score]}</p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}

const styles = {
  page: {
    minHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px 18px 30px',
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
    boxShadow: 'var(--shadow-sm)',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    paddingTop: 12,
  },
  logoEmoji: {
    fontSize: '2.2rem',
    filter: 'drop-shadow(0 4px 10px var(--color-primary-glow))',
  },
  title: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.7rem',
    fontWeight: 800,
    color: 'var(--color-primary)',
    margin: '4px 0 2px',
    letterSpacing: '-0.03em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
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
    padding: '22px 18px',
    boxShadow: 'var(--shadow-md)',
  },
  cardTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: 14,
    color: 'var(--text-primary)',
  },
  oauthBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '10px 8px',
    borderRadius: 'var(--radius-md)',
    border: '1.5px solid var(--border-color)',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    transition: 'all 250ms',
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
    marginTop: 14,
  },
};
