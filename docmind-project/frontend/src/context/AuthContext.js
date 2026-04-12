/**
 * Authentication Context
 * Manages JWT auth + Google/GitHub OAuth callback token
 */

import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle OAuth callback — token passed as ?token=xxx in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthToken = params.get('token');
    if (oauthToken) {
      localStorage.setItem('token', oauthToken);
      setToken(oauthToken);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load profile when token is available
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) loadUserProfile();
  }, [token]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
        setError(null);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, username, password, fullName, organization, profilePic) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, fullName, organization, profilePic }),
      });
      const data = await res.json();
      if (res.ok) {
        setError(null);
        return data;
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        setError(null);
        return data;
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};
