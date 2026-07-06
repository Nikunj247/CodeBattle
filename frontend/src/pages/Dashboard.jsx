import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Zap, Clock, Shield, Target, Flame, Crown, Star, Diamond, Lock, Loader2, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext'; 
import { getRankInfo, BADGE_DEFINITIONS, getEarnedBadgeIds, PROBLEM_TOPICS } from '../utils/constants';

const IconMap = { Flame, Shield, Zap, Target, Crown, Star, Diamond, Swords, Trophy };

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const [recentMatches, setRecentMatches] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [currentElo, setCurrentElo] = useState(user?.eloRating || 1200);

  const [duelCode, setDuelCode] = useState('');
  const [generatedDuel, setGeneratedDuel] = useState(null);
  const [duelQCount, setDuelQCount] = useState(2);
  const [duelTopic, setDuelTopic] = useState('All');

  useEffect(() => {
    if (!socket) return;

    const onDuelCreated = ({ duelId }) => setGeneratedDuel(duelId);
    const onMatchError = (msg) => alert(`🚨 Command Rejected: ${msg}`); 

    socket.on('private_duel_created', onDuelCreated);
    socket.on('match_error', onMatchError);

    return () => {
      socket.off('private_duel_created', onDuelCreated);
      socket.off('match_error', onMatchError);
    }
  }, [socket]); 

  const handleCreateDuel = () => {
    if (socket && user) {
      socket.emit('create_private_duel', { 
        userId: user._id, 
        questionCount: duelQCount, 
        topic: duelTopic 
      });
    }
  };

  const handleJoinDuel = () => {
    if (socket && user && duelCode) {
      socket.emit('join_private_duel', { duelId: duelCode, userId: user._id });
    }
  };

  const handleCancelDuel = () => {
    if (socket && generatedDuel) {
      socket.emit('cancel_private_duel', { duelId: generatedDuel });
      setGeneratedDuel(null); // Resets the UI instantly
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const matchRes = await api.get(`/matches/${user._id}`);
        setRecentMatches(matchRes.data);

        const userRes = await api.get(`/users/${user._id}`);
        if (userRes.data?.eloRating) setCurrentElo(userRes.data.eloRating);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const handleQueueClick = () => navigate('/contest'); 

  if (!user) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-neutral-400">
      <Loader2 className="animate-spin mr-3 text-amber-500"/> Decrypting profile...
    </div>
  );

  const totalMatches = recentMatches.length;
  const wins = recentMatches.filter(match => match.winner._id === user._id).length;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  
  let currentStreak = 0;
  for (const match of recentMatches) {
    if (match.winner._id === user._id) currentStreak++;
    else break; 
  }

  const earnedBadgeIds = getEarnedBadgeIds(totalMatches, wins, currentStreak, currentElo);

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#050505] text-neutral-200 p-8 font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER: Profile & Rank */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl">
          <div className="flex items-center space-x-6 z-10">
            <div className="w-24 h-24 bg-[#111] border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 relative overflow-hidden group">
              <Trophy size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-widest">{user.username}</h1>
              <p className="text-neutral-400 font-mono text-sm flex items-center mt-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Online & Ready
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-10 z-10 bg-[#111] px-8 py-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="text-center">
              <p className="text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-widest mb-2">
                {getRankInfo(currentElo).name}
              </p>
              <p className={`text-4xl font-bold flex items-center justify-center space-x-1 ${getRankInfo(currentElo).color}`}>
                <Zap size={24} className="opacity-80" />
                <span className="tracking-tight">{currentElo}</span>
              </p>
            </div>
            <div className="w-px h-16 bg-white/5"></div>
            <div className="text-center">
              <p className="text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-widest mb-2">Win Rate</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {winRate}<span className="text-xl text-neutral-500 ml-1">%</span>
              </p>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            <button 
              onClick={handleQueueClick}
              className="group relative w-full p-6 rounded-2xl font-bold text-lg uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 bg-amber-500 hover:bg-amber-400 text-black shadow-lg hover:-translate-y-1 overflow-hidden"
            >
              <Swords size={24} className="group-hover:rotate-12 transition-transform duration-300 relative z-10" strokeWidth={2.5} />
              <span className="relative z-10">Enter Arena</span>
            </button>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg relative overflow-hidden">
              <h3 className="text-white font-bold tracking-widest uppercase text-sm flex items-center space-x-2">
                <Shield className="text-rose-500" size={16} />
                <span>Private Duel</span>
              </h3>

              {generatedDuel ? (
                <div className="bg-[#111] border border-rose-500/30 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Duel Code</p>
                  <p className="text-2xl font-bold text-rose-500 tracking-[0.2em]">{generatedDuel}</p>
                  <p className="text-xs text-neutral-400 mt-2 flex items-center justify-center">
                    <Loader2 size={12} className="animate-spin mr-2" />
                    Waiting for opponent...
                  </p>
                  {/* === NEW CANCEL BUTTON === */}
                  <button 
                    onClick={handleCancelDuel}
                    className="mt-4 w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-mono font-bold uppercase tracking-widest rounded-lg border border-rose-500/20 transition-colors"
                  >
                    Cancel Duel
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <select 
                      value={duelQCount} 
                      onChange={(e) => setDuelQCount(Number(e.target.value))}
                      className="bg-[#111] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-neutral-300 outline-none focus:border-rose-500/50"
                    >
                      <option value={1}>1 Question</option>
                      <option value={2}>2 Questions</option>
                      <option value={3}>3 Questions</option>
                    </select>
                    <select 
                      value={duelTopic} 
                      onChange={(e) => setDuelTopic(e.target.value)}
                      className="bg-[#111] border border-white/10 rounded-lg p-2 text-[10px] font-mono text-neutral-300 outline-none focus:border-rose-500/50"
                    >
                      <option value="All">All Topics</option>
                      {PROBLEM_TOPICS.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleCreateDuel}
                    className="w-full p-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20"
                  >
                    Create Duel Room
                  </button>
                </div>
              )}

              <div className="flex space-x-2 pt-2 border-t border-white/5">
                <input
                  type="text"
                  placeholder="ENTER CODE"
                  value={duelCode}
                  onChange={(e) => setDuelCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-center text-white focus:outline-none focus:border-rose-500/50 placeholder:text-neutral-600"
                />
                <button
                  onClick={handleJoinDuel}
                  disabled={!duelCode || duelCode.length < 6}
                  className="px-4 py-2 bg-[#111] border border-white/10 hover:border-rose-500 hover:text-rose-500 text-neutral-400 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 flex flex-col h-[370px] shadow-xl relative">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2 tracking-wide">
                  <Star className="text-amber-500" size={20} strokeWidth={2} />
                  <span>Badges</span>
                </h2>
                <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20">
                  {earnedBadgeIds.length} / {BADGE_DEFINITIONS.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-10">
                {[...BADGE_DEFINITIONS]
                  .sort((a, b) => {
                    const aEarned = earnedBadgeIds.includes(a.id);
                    const bEarned = earnedBadgeIds.includes(b.id);
                    return bEarned - aEarned; 
                  })
                  .map((badge) => {
                    const isUnlocked = earnedBadgeIds.includes(badge.id);
                    const IconElement = IconMap[badge.iconName] || Trophy;
                    const cleanBorder = isUnlocked ? badge.border.replace('border-', '') : '';

                    return (
                      <div 
                        key={badge.id} 
                        className={`group relative flex items-center p-4 rounded-2xl border transition-all duration-300 ${
                          isUnlocked 
                            ? `bg-[#111] border-${cleanBorder} hover:border-${cleanBorder}/70 shadow-sm overflow-hidden hover:-translate-y-0.5` 
                            : 'bg-white/[0.02] border-white/5 grayscale opacity-50 hover:opacity-80 hover:bg-white/[0.04]'
                        }`}
                      >
                        {isUnlocked && <div className={`absolute top-0 left-0 w-1 h-full bg-${cleanBorder}`}></div>}
                        <div className="w-12 h-12 flex items-center justify-center shrink-0">
                          {isUnlocked ? (
                            <IconElement className={`${badge.color} group-hover:scale-110 transition-transform duration-300`} size={26} strokeWidth={1.5} />
                          ) : (
                            <Lock className="text-neutral-600" size={22} strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <p className={`font-semibold tracking-wider text-sm ${isUnlocked ? 'text-white' : 'text-neutral-500'}`}>
                            {badge.name}
                          </p>
                          <p className={`text-xs mt-1 font-mono leading-relaxed ${isUnlocked ? 'text-neutral-400' : 'text-neutral-600'}`}>
                            {badge.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REAL MATCH HISTORY */}
          <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 flex flex-col h-[655px] shadow-xl relative overflow-hidden">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2 shrink-0 relative z-10 tracking-wide">
              <Clock className="text-amber-500" size={20} strokeWidth={2} />
              <span>Combat Logs</span>
            </h2>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 relative z-10">
              {isLoadingHistory ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 space-y-3">
                  <Loader2 className="animate-spin text-amber-500" size={28} />
                  <p className="text-sm font-mono tracking-widest">DECRYPTING LOGS...</p>
                </div>
              ) : recentMatches.length > 0 ? (
                recentMatches.map((match) => {
                  const isWinner = match.winner._id === user._id;
                  const opponent = isWinner ? match.loser : match.winner;
                  const eloChange = isWinner ? `+${match.eloChanges.winnerGain}` : `-${Math.abs(match.eloChanges.loserLoss)}`;
                  const matchDate = new Date(match.createdAt);
                  const timeDisplay = `${matchDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} • ${matchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  return (
                    <div key={match._id} className="group bg-[#111] border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                      <div className="flex items-center space-x-5">
                        <div className={`w-2 h-12 rounded-full ${isWinner ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h3 className="font-semibold text-neutral-200 tracking-wide truncate max-w-[200px] md:max-w-xs group-hover:text-white transition-colors">
                            {match.problems.map(p => p.title).join(' & ')}
                          </h3>
                          <p className="text-xs font-mono text-neutral-500 mt-1.5">
                            vs <span className="font-semibold text-neutral-300">{opponent.username}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold tracking-widest text-lg ${isWinner ? 'text-green-500' : 'text-red-500'}`}>
                          {eloChange} Elo
                        </p>
                        <p className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest mt-1">
                          {timeDisplay}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.01] rounded-2xl mt-4">
                  <Swords size={32} className="text-neutral-700 mb-4" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-neutral-400 tracking-wide">No ranked combat data found.</p>
                  <button onClick={handleQueueClick} className="mt-4 flex items-center space-x-1 text-xs font-mono font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest">
                    <span>Initialize Matchmaking</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}