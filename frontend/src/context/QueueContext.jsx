import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './SocketContext';
import { Loader2, X } from 'lucide-react';

const QueueContext = createContext();

export const useQueue = () => useContext(QueueContext);

export const QueueProvider = ({ children }) => {
  const socket = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [isQueueing, setIsQueueing] = useState(false);
  const [queueTime, setQueueTime] = useState(0);

  // Global Timer Loop
  useEffect(() => {
    let interval;
    if (isQueueing) {
      interval = setInterval(() => setQueueTime(prev => prev + 1), 1000);
    } else {
      setQueueTime(0);
    }
    return () => clearInterval(interval);
  }, [isQueueing]);

  // Global Match Found Listener (Triggers no matter what page you are on)
  useEffect(() => {
    if (!socket) return;
    const handleMatchFound = ({ roomId }) => {
      setIsQueueing(false);
      navigate(`/contest/${roomId}`);
    };
    
    socket.on('match_found', handleMatchFound);
    return () => socket.off('match_found', handleMatchFound);
  }, [socket, navigate]);

  const joinQueue = (preferences) => {
    if (socket) {
      socket.emit('join_queue', preferences);
      setIsQueueing(true);
    }
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leave_queue');
      setIsQueueing(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Only show the floating banner if they are queueing AND navigating other pages
  // Adjust '/contest' to whatever route your Contest.jsx is rendered on
  const showFloatingBanner = isQueueing && location.pathname !== '/contest';

  return (
    <QueueContext.Provider value={{ isQueueing, queueTime, joinQueue, leaveQueue, formatTime }}>
      {children}

      {/* Sleak Global Floating Banner */}
      {showFloatingBanner && (
        <div className="fixed bottom-8 right-8 z-[100] bg-[#0a0a0a] border border-amber-500/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(245,158,11,0.15)] flex items-center space-x-5 animate-in slide-in-from-bottom-8 font-sans">
          <div className="w-12 h-12 bg-[#111] rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
            <Loader2 size={24} className="text-amber-500 animate-spin" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col pr-2">
            <span className="text-white font-bold text-sm tracking-wide uppercase">Queue Active</span>
            <span className="text-amber-500 font-mono text-xs font-bold tracking-widest mt-0.5">{formatTime(queueTime)}</span>
          </div>
          <div className="pl-5 border-l border-white/10 h-10 flex items-center">
            <button
              onClick={leaveQueue}
              className="p-2 hover:bg-white/5 rounded-lg text-neutral-500 hover:text-rose-500 transition-colors"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </QueueContext.Provider>
  );
};