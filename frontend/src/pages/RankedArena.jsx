import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Timer, CheckCircle2, MessageSquareWarning, GripVertical, GripHorizontal, Send, Flame, Shield, Zap, Target, Crown, Star, Diamond, Swords, Trophy } from 'lucide-react'; 
import { useTimer } from '../hooks/useTimer';
import CodeEditor from '../components/CodeEditor';
import Editor from '@monaco-editor/react'; // === NEW: For the read-only reviewer ===
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getRankInfo, BADGE_DEFINITIONS } from '../utils/constants'; 

const IconMap = { Flame, Shield, Zap, Target, Crown, Star, Diamond, Swords, Trophy };

// === UPDATED: Receives onReview function ===
const MatchResultModal = ({ matchResult, liveElo, navigate, onReview }) => {
  const oldElo = liveElo;
  const newElo = matchResult.status === 'win' 
    ? oldElo + matchResult.points 
    : matchResult.status === 'loss' 
      ? oldElo - matchResult.points 
      : oldElo; 
  
  const rank = getRankInfo(newElo);
  const rankRange = rank.max === Infinity ? 100 : (rank.max - rank.min + 1);
  
  const currentProgress = newElo - rank.min;
  const targetPercent = Math.max(0, Math.min(100, (currentProgress / rankRange) * 100));

  const oldProgress = oldElo - rank.min;
  const startingPercent = Math.max(0, Math.min(100, (oldProgress / rankRange) * 100));

  const [barWidth, setBarWidth] = useState(startingPercent);
  const [displayElo, setDisplayElo] = useState(oldElo);
  const [activeBadgeIndex, setActiveBadgeIndex] = useState(0);
  const [showBadge, setShowBadge] = useState(false);

  const newlyUnlocked = matchResult.newlyUnlockedBadges || [];

  const slideAudioRef = useRef(null);
  const badgeAudioRef = useRef(null);

  if (!slideAudioRef.current) {
    slideAudioRef.current = new Audio('/sounds/slide.mp3');
    slideAudioRef.current.preload = 'auto'; 
  }
  if (!badgeAudioRef.current) {
    badgeAudioRef.current = new Audio('/sounds/coin-flip.mp3');
    badgeAudioRef.current.preload = 'auto';
  }

  useEffect(() => {
    slideAudioRef.current.load();
    badgeAudioRef.current.load();

    if (matchResult.status === 'draw') return;

    slideAudioRef.current.volume = 0.5;
    slideAudioRef.current.loop = true;
    badgeAudioRef.current.volume = 1.0;

    const barTimer = setTimeout(() => {
      setBarWidth(targetPercent);
      slideAudioRef.current.currentTime = 0; 
      const playPromise = slideAudioRef.current.play();
      if (playPromise !== undefined) playPromise.catch(err => {});
    }, 500);

    const tickerDelay = setTimeout(() => {
      const duration = 2000; 
      const frames = 120;   
      const step = (newElo - oldElo) / frames;
      let current = oldElo;
      let frame = 0;

      const interval = setInterval(() => {
        frame++;
        current += step;
        setDisplayElo(Math.round(current));
        
        if (frame >= frames) {
          clearInterval(interval);
          setDisplayElo(newElo);
          slideAudioRef.current.pause(); 
        }
      }, duration / frames);
      
      return () => clearInterval(interval);
    }, 500);

    if (newlyUnlocked.length > 0) {
      const badgeTimer = setTimeout(() => {
        setShowBadge(true);
        const badgePromise = badgeAudioRef.current.play();
        if (badgePromise !== undefined) badgePromise.catch(err => {});
      }, 4000); 
      
      const rotationInterval = setInterval(() => {
        setShowBadge(false);
        setTimeout(() => {
          setActiveBadgeIndex((prev) => (prev + 1) % newlyUnlocked.length);
          setShowBadge(true);
          const replayPromise = badgeAudioRef.current.play();
          if (replayPromise !== undefined) replayPromise.catch(e => {}); 
        }, 400); 
      }, 9000); 

      return () => {
        clearTimeout(barTimer);
        clearTimeout(tickerDelay);
        clearTimeout(badgeTimer);
        clearInterval(rotationInterval);
        slideAudioRef.current.pause();
      };
    }

    return () => {
      clearTimeout(barTimer);
      clearTimeout(tickerDelay);
      slideAudioRef.current.pause();
    };
  }, [oldElo, newElo, targetPercent, newlyUnlocked.length, matchResult.status]);

  const currentBadgeData = BADGE_DEFINITIONS.find(b => b.id === newlyUnlocked[activeBadgeIndex]);
  const BadgeIcon = currentBadgeData ? IconMap[currentBadgeData.iconName] : null;
  
  const auraGlow = matchResult.status === 'draw' ? 'from-neutral-800/20' : matchResult.status === 'win' ? 'from-emerald-900/20' : 'from-rose-900/20';
  const titleColor = matchResult.status === 'draw' 
    ? 'text-neutral-300 drop-shadow-sm' 
    : matchResult.status === 'win' 
      ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
      : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]';

  const titleText = matchResult.status === 'draw' ? 'Stalemate' : matchResult.status === 'win' ? 'Victory' : 'Defeat';

  let subtitleText = matchResult.reason || '';
  if (!subtitleText) {
    if (matchResult.status === 'draw') subtitleText = 'Time expired. Neither player solved a question.';
    else if (matchResult.status === 'win') subtitleText = matchResult.isForfeit ? 'Opponent abandoned the match!' : 'You solved all questions first!';
    else subtitleText = matchResult.isForfeit ? 'You abandoned the match.' : 'Opponent finished all questions first.';
  }

  return (
    <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${auraGlow} via-[#050505]/95 to-black/95 backdrop-blur-md overflow-hidden font-sans`}>
      <style>
        {`
          @keyframes coinFlipJam {
            0% { transform: translateY(-50%) rotateY(0deg) scale(0.2) translateX(-100px); opacity: 0; }
            50% { transform: translateY(-50%) rotateY(720deg) scale(1.2) translateX(10px); opacity: 1; }
            100% { transform: translateY(-50%) rotateY(1080deg) scale(1) translateX(0); opacity: 1; }
          }
        `}
      </style>

      <div className="relative flex items-center justify-center max-w-md w-full animate-in zoom-in duration-500">
        <div className={`relative p-10 rounded-3xl border border-white/10 text-center w-full bg-[#0a0a0a]/80 backdrop-blur-xl shadow-2xl z-20`}>
          
          <h2 className={`text-4xl font-bold mb-2 uppercase tracking-widest ${titleColor}`}>{titleText}</h2>
          <p className="text-neutral-400 font-mono text-sm mb-8 tracking-wide">{subtitleText}</p>

          <div className="mb-8 py-8 bg-[#111] rounded-2xl border border-white/5 relative overflow-hidden shadow-inner">
            <div className={`absolute inset-0 opacity-10 ${rank.bg}`}></div>
            <h3 className={`text-3xl font-bold uppercase tracking-widest relative z-10 ${rank.color}`}>{rank.name}</h3>
            <div className={`text-2xl font-bold tracking-widest mt-2 relative z-10 ${matchResult.status === 'draw' ? 'text-neutral-400' : matchResult.status === 'win' ? 'text-emerald-400' : 'text-rose-500'}`}>
              {matchResult.status === 'draw' ? '+0' : matchResult.status === 'win' ? `+${matchResult.points}` : `-${matchResult.points}`} ELO
            </div>
          </div>

          <div className="mb-10 text-left">
            <div className="flex justify-between text-[10px] font-mono font-bold mb-3 uppercase tracking-widest">
              <span className="text-neutral-600">{rank.min}</span>
              <span className="text-neutral-400"><span className="text-amber-500 text-sm mr-1">{displayElo}</span> / {rank.max === Infinity ? 'MAX' : rank.max}</span>
            </div>
            <div className="h-3 w-full bg-[#050505] rounded-full overflow-hidden border border-white/5 shadow-inner relative">
              <div 
                className="h-full rounded-full ease-out bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] relative" 
                style={{ width: `${barWidth}%`, transitionProperty: 'width', transitionDuration: matchResult.status === 'draw' ? '0s' : '2s' }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40 rounded-t-full"></div>
              </div>
            </div>
          </div>

          {/* === THE FIX: Analyze Code Button === */}
          {matchResult.codes && (
            <button onClick={onReview} className="w-full mb-3 py-4 bg-[#111] hover:bg-white/10 text-white border border-white/10 font-bold uppercase tracking-widest rounded-xl transition-colors shadow-lg">
              Analyze Match Code
            </button>
          )}

          <button onClick={() => navigate('/dashboard', { replace: true })} className="w-full py-4 bg-white hover:bg-neutral-200 text-black font-bold uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            Return to Base
          </button>
        </div>

        {showBadge && currentBadgeData && BadgeIcon && matchResult.status === 'win' && (
          <div 
            className="absolute top-1/2 -right-4 md:-right-36 bg-[#0a0a0a] border border-amber-500/50 rounded-2xl px-5 py-6 shadow-[0_0_40px_rgba(245,158,11,0.3)] flex flex-col items-center justify-center space-y-4 z-10 w-36"
            style={{ animation: 'coinFlipJam 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transformStyle: 'preserve-3d' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-[#111] border border-amber-500/30 flex items-center justify-center shadow-inner">
              <BadgeIcon className={`${currentBadgeData.color} drop-shadow-lg`} size={32} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-[9px] text-amber-500 font-mono font-bold uppercase tracking-widest mb-1">Unlocked</p>
              <p className="text-xs font-bold text-white uppercase tracking-wider leading-tight">{currentBadgeData.name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function RankedArena() {
  const { roomId } = useParams(); 
  const navigate = useNavigate();
  const socket = useSocket();
  const auth = useAuth() || {}; 
  const user = auth.user;
  const updateUserElo = auth.updateUserElo;

  const [liveElo, setLiveElo] = useState(user?.eloRating || 1000);
  const { formattedTime, startSyncTimer, stopTimer } = useTimer(1800); 
  
  const [matchResult, setMatchResult] = useState(null); 
  const [showForfeitWarning, setShowForfeitWarning] = useState(false);
  const [completedProblems, setCompletedProblems] = useState([]); 
  
  const [battleLogs, setBattleLogs] = useState([]); 
  const [chatInput, setChatInput] = useState('');

  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);

  // === NEW: Review Mode States ===
  const [showReviewMode, setShowReviewMode] = useState(false);

  const arenaRef = useRef(null);
  const commsEndRef = useRef(null); 
  const matchActiveRef = useRef(!matchResult);
  const timeoutFiredRef = useRef(false);
  
  const [leftWidth, setLeftWidth] = useState(40); 
  const [leftTopHeight, setLeftTopHeight] = useState(65); 
  const [draggingResizer, setDraggingResizer] = useState(null); 

  useEffect(() => {
    matchActiveRef.current = !matchResult;
  }, [matchResult]);

  useEffect(() => {
    let isMounted = true;
    if (user?._id) {
      api.get(`/users/${user._id}`)
        .then(res => {
          if (isMounted && matchActiveRef.current && res.data?.eloRating) {
            setLiveElo(res.data.eloRating);
          }
        })
        .catch(err => console.error("Failed to fetch live Elo:", err));
    }
    return () => { isMounted = false; };
  }, [user?._id]); 

  useEffect(() => {
    if (formattedTime === '00:00' && !matchResult && socket && !timeoutFiredRef.current) {
      timeoutFiredRef.current = true;
      socket.emit('match_timeout', { roomId });
    }
  }, [formattedTime, matchResult, socket, roomId]);

  useEffect(() => {
    if (!socket || matchResult) return;

    socket.emit('join_room', roomId);

    const handleMatchState = async (serverState) => {
      const { problemIds, startTime, duration } = serverState;
      if (startSyncTimer) startSyncTimer(parseInt(startTime), parseInt(duration)); 

      try {
        const response = await api.get('/problems');
        const matchProbs = problemIds.map(id => response.data.find(p => p._id === id)).filter(Boolean);
        setProblems(matchProbs);
        setActiveProblem(matchProbs[0]);
      } catch (error) {
        console.error("Failed to fetch secure match problems:", error);
      }
    };

    socket.on('match_state', handleMatchState);
    socket.on('match_error', (msg) => { alert(msg); navigate('/dashboard', { replace: true }); });

    return () => {
      socket.off('match_state', handleMatchState);
      socket.off('match_error');
    };
  }, [socket, roomId, startSyncTimer, navigate, matchResult]); 

  useEffect(() => {
    if (!socket) return;
    
    // === UPDATED: Captures the 'codes' payload from the server ===
    const handleGameOver = ({ winnerId, winnerGain, loserLoss, isForfeit, isDraw, reason, newlyUnlockedBadges = [], codes }) => {
      stopTimer();
      let finalElo; 
      
      if (isDraw) {
        setMatchResult({ status: 'draw', points: 0, reason, newlyUnlockedBadges: [], codes });
        finalElo = liveElo;
      } else if (winnerId === socket.id) {
        const winnerReason = reason ? reason.replace('They', 'You') : '';
        setMatchResult({ status: 'win', points: winnerGain, isForfeit, reason: winnerReason, newlyUnlockedBadges, codes }); 
        finalElo = liveElo + winnerGain;
      } else {
        setMatchResult({ status: 'loss', points: Math.abs(loserLoss), isForfeit, reason, newlyUnlockedBadges: [], codes });
        finalElo = liveElo - Math.abs(loserLoss);
      }
      if (updateUserElo) updateUserElo(finalElo);
    };

    const handleBattleAlert = (alert) => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setBattleLogs(prev => [...prev, { id: Date.now(), time: timeStr, ...alert }]);
    };

    const handleReceiveChat = (chatData) => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setBattleLogs(prev => [...prev, { id: Date.now(), time: timeStr, ...chatData }]);
    };

    socket.on('game_over', handleGameOver);
    socket.on('battle_alert', handleBattleAlert);
    socket.on('receive_chat', handleReceiveChat);
    
    return () => {
      socket.off('game_over', handleGameOver);
      socket.off('battle_alert', handleBattleAlert);
      socket.off('receive_chat', handleReceiveChat);
    };
  }, [socket, stopTimer, liveElo, updateUserElo]);

  // === THE LOCKDOWN INTERCEPTOR ===
  useEffect(() => {
    // 1. Intercept Navbar & Link Clicks (React Router Navigation)
    const handleGlobalClick = (e) => {
      // If the match is already over, let them navigate normally
      if (matchResult) return;

      const targetLink = e.target.closest('a') || e.target.closest('button');
      
      if (targetLink) {
        // Identify if the click came from the header navbar or the logout trigger
        const isNavbarClick = targetLink.closest('nav') || targetLink.classList.contains('logout-btn');
        
        if (isNavbarClick) {
          e.preventDefault();
          e.stopPropagation(); // Stops React Router from seeing the click event
          setShowForfeitWarning(true); // Triggers your custom Abandon Match dialog
        }
      }
    };

    // 2. Intercept Hard Refreshes & Browser Tab Closures (Native Navigation)
    const handleBeforeUnload = (e) => {
      if (matchResult) return;
      e.preventDefault();
      e.returnValue = 'Forfeiting will drop your Elo rating. Are you sure you want to leave?';
      return e.returnValue;
    };

    // Attach listeners on mount if match is active
    if (!matchResult) {
      document.addEventListener('click', handleGlobalClick, true); // True activates the capture phase
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Cleanup listeners on unmount
    return () => {
      document.removeEventListener('click', handleGlobalClick, true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [matchResult]);

  // === NEW: Syncs code to server when they hit run ===
  const handleSyncCode = (code, pId) => {
    if (socket && roomId) {
      socket.emit('sync_code', { roomId, problemId: pId, code });
    }
  };

  const handleSuccessfulSubmission = (resolvedId) => {
    if (completedProblems.includes(resolvedId)) return;
    const newCompletedList = [...completedProblems, resolvedId];
    setCompletedProblems(newCompletedList);

    if (socket) {
      if (newCompletedList.length === problems.length) {
        socket.emit('match_won', { roomId });
      } else {
        const solvedProblemInfo = problems.find(p => p._id === resolvedId);
        socket.emit('problem_solved', { roomId, problemTitle: solvedProblemInfo?.title });
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setBattleLogs(prev => [...prev, { id: Date.now(), time: timeStr, message: `System Secured: "${solvedProblemInfo?.title}"`, type: 'success' }]);
      }
    }
  };

  const handleForfeit = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (socket) {
      socket.emit('forfeit_match', { roomId });
      setShowForfeitWarning(false);
    }
  };

  // Resizer Drag Logic
  const startDrag = (e, type) => {
    e.preventDefault();
    setDraggingResizer(type);
    document.body.style.cursor = type === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };
  const handleMouseUp = useCallback(() => {
    setDraggingResizer(null);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);
  const handleMouseMove = useCallback((e) => {
    if (!draggingResizer || !arenaRef.current) return;
    const arenaRect = arenaRef.current.getBoundingClientRect();
    if (draggingResizer === 'horizontal') {
      const newLeftWidth = ((e.clientX - arenaRect.left) / arenaRect.width) * 100;
      if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
    } else if (draggingResizer === 'left-vertical') {
      const newTopHeight = ((e.clientY - arenaRect.top) / arenaRect.height) * 100;
      if (newTopHeight > 20 && newTopHeight < 80) setLeftTopHeight(newTopHeight);
    }
  }, [draggingResizer]);
  useEffect(() => {
    if (draggingResizer) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); } 
    else { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); }
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [draggingResizer, handleMouseMove, handleMouseUp]);


  // === NEW: FULL SCREEN CODE REVIEWER ===
  if (showReviewMode && matchResult) {
    const opponentSocketId = Object.keys(matchResult.codes || {}).find(id => id !== socket.id);
    const myCode = matchResult.codes?.[socket.id]?.[activeProblem?._id] || '// No code submitted or synchronized.';
    const opponentCode = matchResult.codes?.[opponentSocketId]?.[activeProblem?._id] || '// Opponent did not execute or synchronize code.';

    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col font-sans">
        <div className="h-14 flex items-center justify-between px-6 bg-[#0a0a0a] border-b border-white/5">
          <div className="flex items-center space-x-6">
            <h2 className="text-white font-bold uppercase tracking-widest text-sm">Post-Match Analysis</h2>
            <div className="flex space-x-2 border-l border-white/10 pl-6">
               {problems.map((p, idx) => (
                 <button key={p._id} onClick={() => setActiveProblem(p)} className={`px-4 py-1 rounded-md text-xs font-mono uppercase tracking-widest font-bold transition-colors ${activeProblem?._id === p._id ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-[#111] text-neutral-500 hover:text-white'}`}>
                   Q{idx+1}
                 </button>
               ))}
            </div>
          </div>
          <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-neutral-200 transition-colors shadow-lg">
            Exit to Dashboard
          </button>
        </div>
        <div className="flex-1 flex overflow-hidden">
           <div className="flex-1 border-r border-white/5 flex flex-col relative bg-[#0a0a0a]">
              <div className="absolute top-4 right-4 z-10 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-sm">Your Solution</div>
              <Editor height="100%" theme="vs-dark" language="cpp" value={myCode} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: { top: 24 } }} />
           </div>
           <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
              <div className="absolute top-4 right-4 z-10 px-4 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-mono font-bold uppercase tracking-widest rounded-md shadow-lg backdrop-blur-sm">Opponent's Solution</div>
              <Editor height="100%" theme="vs-dark" language="cpp" value={opponentCode} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: { top: 24 } }} />
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] bg-[#050505] text-neutral-200 overflow-hidden relative font-sans selection:bg-amber-500/30">
      
      {/* Updated to pass down onReview */}
      {matchResult && !showReviewMode && <MatchResultModal matchResult={matchResult} liveElo={liveElo} navigate={navigate} onReview={() => setShowReviewMode(true)} />}

      {showForfeitWarning && !matchResult && (
        <div className="absolute inset-0 z-[60] bg-[#050505]/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="p-8 rounded-3xl border border-rose-500/30 bg-[#0a0a0a] text-center max-w-md w-full shadow-[0_0_50px_rgba(225,29,72,0.15)]">
            <h2 className="text-3xl font-bold mb-4 uppercase tracking-widest text-rose-500">Abandon Match?</h2>
            <div className="bg-[#111] border border-white/5 p-5 rounded-2xl mb-8">
              <p className="text-rose-500 font-mono font-bold text-xs mb-2 uppercase tracking-widest">⚠️ Extreme Warning ⚠️</p>
              <p className="text-neutral-400 text-sm leading-relaxed tracking-wide">Forfeiting will immediately drop your Elo rating and award the victory to your opponent.</p>
            </div>
            <div className="flex space-x-4">
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowForfeitWarning(false); }} className="flex-1 py-4 bg-[#111] hover:bg-white/5 border border-white/5 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-colors">Return</button>
              <button onClick={handleForfeit} className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-colors shadow-[0_0_20px_rgba(225,29,72,0.3)]">Accept Defeat</button>
            </div>
          </div>
        </div>
      )}

      {/* Arena Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border-b border-white/5 shrink-0 z-10 shadow-md">
        <div className="flex items-center space-x-5">
          <div className="relative flex items-center bg-[#111] border border-white/5 rounded-xl p-1 shadow-inner">
            <div className="flex items-center space-x-2 font-bold px-4 py-2 rounded-lg text-amber-500 cursor-default">
              <Timer size={18} className="animate-pulse text-rose-500" strokeWidth={2} />
              <span className="font-mono text-xl tracking-wider drop-shadow-sm">{formattedTime}</span>
            </div>
          </div>
          <div className="flex items-center space-x-5 hidden md:flex">
            <span className="text-neutral-500 text-xs font-mono font-bold uppercase tracking-widest border-l border-white/10 pl-5">Ranked Match • Room {roomId}</span>
            <button onClick={() => setShowForfeitWarning(true)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest transition-colors">Forfeit</button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden" ref={arenaRef}>
        
        {/* === LEFT PANE === */}
        <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-[#050505] shrink-0 h-full relative">
          
          <div style={{ height: `${leftTopHeight}%` }} className="overflow-y-auto p-8 custom-scrollbar flex flex-col shrink-0 relative z-10">
            {problems.length > 1 && ( 
              <div className="flex space-x-3 mb-8 pb-5 border-b border-white/5 shrink-0">
                {problems.map((pInfo, idx) => {
                  const isSolved = completedProblems.includes(pInfo._id);
                  return (
                    <button
                      key={pInfo._id} onClick={() => setActiveProblem(pInfo)}
                      className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                        activeProblem?._id === pInfo._id 
                          ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : isSolved 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-[#111] text-neutral-400 hover:text-white border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {isSolved && <CheckCircle2 size={16} strokeWidth={2.5} />}
                      <span>Question {idx + 1}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activeProblem ? (
              <div className="flex-1 pb-4">
                <div className="flex items-center space-x-4 mb-6">
                  <h1 className="text-3xl font-bold text-white tracking-wide">{activeProblem.title}</h1>
                  <span className={`px-3 py-1 rounded-md border text-[10px] font-mono font-bold tracking-widest uppercase ${
                    activeProblem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    activeProblem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {activeProblem.difficulty}
                  </span>
                </div>
                <div className="prose prose-invert max-w-none text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {activeProblem.description}
                </div>
              </div>
            ) : null}
          </div>

          <div 
            onMouseDown={(e) => startDrag(e, 'left-vertical')}
            className={`h-2 z-20 cursor-row-resize flex flex-col items-center justify-center shrink-0 border-y border-white/5 transition-colors duration-300 group ${draggingResizer === 'left-vertical' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#050505] hover:bg-amber-500/10'}`}
          >
            <div className={`flex items-center justify-center space-x-1 transition-colors ${draggingResizer === 'left-vertical' ? 'text-amber-500' : 'text-neutral-600 group-hover:text-amber-500'}`}>
              <GripHorizontal size={14} />
            </div>
          </div>

          <div style={{ height: `${100 - leftTopHeight}%` }} className="bg-[#0a0a0a] flex flex-col shadow-inner shrink-0 relative z-10 border-t border-white/5">
            <div className="px-5 py-3 bg-[#111] border-b border-white/5 flex items-center space-x-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest shrink-0">
              <MessageSquareWarning size={14} className="text-amber-500" strokeWidth={2} />
              <span>Battle Comms</span>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
              {battleLogs.length === 0 ? (
                <div className="text-neutral-600 font-mono text-[13px] h-full flex items-center justify-center">Waiting for output...</div>
              ) : (
                <div className="space-y-1.5">
                  {battleLogs.map(log => {
                    const isSystem = log.type === 'danger' || log.type === 'success';
                    if (isSystem) {
                      return (
                        <div key={log.id} className="flex items-start space-x-3 font-mono text-[13px] leading-relaxed animate-in fade-in duration-200">
                          <span className="text-neutral-600 shrink-0">[{log.time}]</span>
                          <span className={log.type === 'danger' ? 'text-rose-400 font-medium' : 'text-emerald-400 font-medium'}>{log.type === 'danger' ? '⚠️' : '✅'} {log.message}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={log.id} className="flex items-start space-x-3 font-mono text-[13px] leading-relaxed animate-in fade-in duration-200">
                        <span className="text-neutral-600 shrink-0">[{log.time}]</span>
                        <div className="flex-1 break-words">
                          <span className={`font-semibold ${log.type === 'chat-self' ? 'text-neutral-400' : 'text-blue-400'}`}>{log.senderName}: </span>
                          <span className="text-neutral-300">{log.message}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commsEndRef} />
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if (chatInput.trim() && socket) { socket.emit('send_chat', { roomId, message: chatInput, senderName: user?.username || 'Player' }); setBattleLogs(prev => [...prev, { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: chatInput, senderName: 'You', type: 'chat-self' }]); setChatInput(''); } }} className="p-4 bg-[#0a0a0a] border-t border-white/5 flex items-center gap-3 shrink-0">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Transmit message..." className="flex-1 bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder:text-neutral-600" />
              <button type="submit" disabled={!chatInput.trim()} className="p-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-all duration-300 disabled:opacity-30 disabled:hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Send size={18} strokeWidth={2.5} />
              </button>
            </form>
          </div>
        </div>

        {/* === MAIN LEFT/RIGHT SPLITTER === */}
        <div 
          onMouseDown={(e) => startDrag(e, 'horizontal')}
          className={`w-2 z-20 cursor-col-resize flex flex-col items-center justify-center shrink-0 border-x border-white/5 transition-colors duration-300 group ${draggingResizer === 'horizontal' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#050505] hover:bg-amber-500/10'}`}
        >
          <div className={`flex flex-col space-y-1 transition-colors ${draggingResizer === 'horizontal' ? 'text-amber-500' : 'text-neutral-600 group-hover:text-amber-500'}`}><GripVertical size={14} /></div>
        </div>

        {/* === RIGHT PANE (EDITOR) === */}
        <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col shrink-0 relative bg-[#0a0a0a]">
          {problems.length > 0 ? ( 
            problems.map((pInfo) => {
              const isActive = activeProblem?._id === pInfo._id;
              return (
                <div key={pInfo._id} className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${isActive ? 'z-10 opacity-100 pointer-events-auto' : 'z-0 opacity-0 pointer-events-none'}`}>
                  {/* === UPDATED: Passed onSyncCode so the backend grabs it === */}
                  <CodeEditor problemId={pInfo._id} starterCode={pInfo?.starterCode} onSuccess={() => handleSuccessfulSubmission(pInfo._id)} onSyncCode={handleSyncCode} />
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center absolute inset-0 z-10 bg-[#0a0a0a]">
              <span className="text-neutral-600 font-mono font-bold text-xs uppercase tracking-widest">Compiler standing by...</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}