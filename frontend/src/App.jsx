import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext'; // <-- ADDED THIS

import Navbar from './components/Navbar';
import Contest from './pages/Contest'; 
import Dashboard from './pages/Dashboard';
import Arena from './pages/Arena';
import Problems from './pages/Problems';
import Leaderboard from './pages/Leaderboard';
import Auth from './pages/Auth';
import RankedArena from './pages/RankedArena';
import LandingPage from './pages/LandingPage';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  
  // If no user is logged in, redirect them to the Landing page
  if (!user) return <Navigate to="/" replace />;
  
  // If they are logged in, let them through to the page
  return children;
};

// === Layout Component to manage the Navbar and Global Theme ===
const Layout = ({ children }) => {
  const location = useLocation();
  // Don't show the main app Navbar on the Landing Page or Auth Page
  const hideNavbar = location.pathname === '/' || location.pathname === '/auth';

  return (
    // Updated to the new premium aesthetic colors
    <div className="min-h-screen bg-[#050505] text-neutral-200 font-sans selection:bg-amber-500/30">
      {!hideNavbar && <Navbar />}
      {children}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          {/* QueueProvider MUST be inside Router because it uses useNavigate internally */}
          <QueueProvider> 
            <Layout>
              <Routes>
                {/* === PUBLIC ROUTES === */}
                <Route path="/" element={<LandingPage />} /> 
                <Route path="/auth" element={<Auth />} />

                {/* === PROTECTED ROUTES (Must be logged in) === */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/arena/:roomId?" 
                  element={
                    <ProtectedRoute>
                      <Arena />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/contest/:roomId" 
                  element={
                    <ProtectedRoute>
                      <RankedArena />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/contest" 
                  element={
                    <ProtectedRoute>
                      <Contest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/problems" 
                  element={
                    <ProtectedRoute>
                      <Problems />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/leaderboard" 
                  element={
                    <ProtectedRoute>
                      <Leaderboard />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
          </QueueProvider>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;