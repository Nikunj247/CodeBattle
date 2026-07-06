import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Swords, User, LogOut, Zap, Flame } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  // === 1. Pull the user and logout functions ===
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // === 2. REMOVE the local liveElo state entirely. Just keep winStreak ===
  const [winStreak, setWinStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchLiveStats = async () => {
      try {
        // We removed the local Elo fetch because AuthContext handles it now!
        // Just calculate the current active win streak
        const matchRes = await axios.get(`http://localhost:5000/api/matches/${user._id}`);
        const matches = matchRes.data; 
        
        let currentStreak = 0;
        for (const match of matches) {
          if (match.winner._id === user._id) {
            currentStreak++;
          } else {
            break; 
          }
        }
        setWinStreak(currentStreak);
      } catch (error) {
        console.error("Failed to fetch navbar stats", error);
      }
    };
    
    fetchLiveStats();
  }, [user]); // Now, if 'user' changes (like Elo updating), the streak will recalculate too!

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Don't show the navbar on the Auth page to keep it clean
  if (location.pathname === '/auth') return null;

  // Helper to highlight the active tab
  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav className="h-[73px] bg-zinc-950 border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-50 shrink-0">
      
      {/* Left: Logo & Navigation */}
      <div className="flex items-center space-x-8">
        {/* Route logo to dashboard if logged in, otherwise landing page */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-amber-500 hover:text-amber-400 transition-colors">
          <Swords size={24} />
          <span className="text-xl font-black uppercase tracking-tighter">CodeBattle</span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center space-x-4">
            
            {/* 1. The Practice Arena */}
            <Link 
              to="/arena" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isActive('/arena') 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              <Swords size={16} /> <span>Practice Arena</span>
            </Link>

            {/* 2. The Ranked Contest Tab */}
            <Link 
              to="/contest" 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isActive('/contest') 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              <Flame size={16} /> <span>Ranked Contest</span>
            </Link>

            {/* 3. Problem Bank */}
            <Link 
              to="/problems" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isActive('/problems') 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              Problem Bank
            </Link>
            
            {/* 4. Leaderboard */}
            <Link 
              to="/leaderboard" 
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                isActive('/leaderboard') 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                  : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-500/5 border border-transparent'
              }`}
            >
              Leaderboard
            </Link>
          </div>
        )}
      </div>

      {/* Right: User Profile or Login */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center space-x-4 mr-2 border-r border-zinc-800 pr-6">
              <div className="flex items-center space-x-1 text-amber-500 font-bold text-sm" title="Current Elo">
                <Zap size={16} /> <span>{user.eloRating}</span>
              </div>
              <div className="flex items-center space-x-1 text-orange-500 font-bold text-sm" title="Active Win Streak">
                <Flame size={16} /> <span>{winStreak}</span>
              </div>
            </div>

            {/* Profile Button (Links to Dashboard) */}
            <Link 
              to="/dashboard" 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all relative group ${
                isActive('/dashboard') 
                  ? 'bg-zinc-800 text-amber-500 border-amber-500 border-2' 
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-amber-500 hover:border-amber-500'
              }`}
            >
              <User size={20} />
              {/* Tooltip */}
              <div className="absolute top-12 right-0 bg-zinc-800 text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {user.username}
              </div>
            </Link>

            {/* Logout Button (Includes logout-btn class for interceptor) */}
            <button 
              onClick={handleLogout}
              className="logout-btn p-2 text-zinc-500 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <Link 
            to="/auth" 
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold rounded-md transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}