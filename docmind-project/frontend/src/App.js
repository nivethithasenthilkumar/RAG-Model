/**
 * Main App Component - DocuMind
 */

import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnimatedBackground from './components/AnimatedBackground';
import BookCursor from './components/BookCursor';
import './styles/global.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppContent({ onRoutechange }) {
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <LoginPage onRoutechange={onRoutechange} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage onRoutechange={onRoutechange} /> : <Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Trigger flip animation on transition
  const handleFlip = () => {
    setIsFlipped(true);
    setTimeout(() => setIsFlipped(false), 2000); // 2s flip duration
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          {/* Custom book cursor with glitter trail */}
          <BookCursor />

          {/* Animated background balls & blobs */}
          <AnimatedBackground />

          <div className="desktop-wrapper">
            <div className="app-3d-wrapper">
              <div className={`phone-3d-container ${isFlipped ? 'is-flipped' : ''}`}>
                
                {/* FRONT FACE (Main App) */}
                <div className="phone-face phone-face-front mobile-frame">
                  <div className="app-content">
                    <AppContent onRoutechange={handleFlip} />
                  </div>
                </div>

                {/* BACK FACE (iPhone 17 Pro Model) */}
                <div className="phone-face phone-face-back">
                  <div className="iphone-camera-island">
                    <div className="iphone-lens lens-top"></div>
                    <div className="iphone-lens lens-bottom"></div>
                    <div className="iphone-lens lens-right"></div>
                    <div className="iphone-flash"></div>
                  </div>
                  <div className="iphone-logo"></div>
                  <div style={{
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    fontSize: '0.7rem',
                    marginBottom: '20px'
                  }}>IPHONE 17 PRO</div>
                </div>

              </div>
            </div>
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
