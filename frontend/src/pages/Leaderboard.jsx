import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Zap, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/users/leaderboard');
        setLeaders(response.data);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Helper function to render top 3 icons cleanly
  const getRankIcon = (index) => {
    if (index === 0) return <Crown className="text-amber-500" size={24} strokeWidth={2} />;
    if (index === 1) return <Medal className="text-neutral-300" size={24} strokeWidth={2} />;
    if (index === 2) return <Medal className="text-orange-600" size={24} strokeWidth={2} />;
    return <span className="text-neutral-500 font-bold text-sm w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#050505] text-neutral-200 p-8 relative overflow-hidden font-sans selection:bg-amber-500/30">
      
      {/* Very Subtle Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#111] border border-amber-500/30 rounded-2xl mb-4 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Trophy size={36} className="text-amber-500" strokeWidth={1.5} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white uppercase tracking-widest drop-shadow-sm">
            Global Leaderboard
          </h1>
          <p className="text-neutral-400 font-mono text-sm tracking-wide mt-3">
            The top 50 highest-rated coders in the arena.
          </p>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-5 border-b border-white/5 bg-[#111] text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-widest">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-4 text-right pr-4">Elo Rating</div>
          </div>

          <div className="flex flex-col">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-neutral-500 space-y-4">
                <Loader2 className="animate-spin text-amber-500" size={32} />
                <p className="text-xs font-mono font-bold uppercase tracking-widest">Compiling Rankings...</p>
              </div>
            ) : leaders.length > 0 ? (
              leaders.map((leader, index) => {
                const isMe = user && user.username === leader.username;
                
                return (
                  <div 
                    key={leader._id} 
                    className={`grid grid-cols-12 gap-4 p-5 items-center border-b border-white/5 transition-all duration-300 hover:bg-white/[0.02] ${
                      isMe ? 'bg-amber-500/5 border-l-4 border-l-amber-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    {/* Rank */}
                    <div className="col-span-2 flex justify-center items-center">
                      {getRankIcon(index)}
                    </div>

                    {/* Player Info */}
                    <div className="col-span-6 flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-transform hover:scale-105 ${
                        index === 0 ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                        index === 1 ? 'bg-neutral-200 text-black shadow-md' :
                        index === 2 ? 'bg-orange-600 text-white shadow-md' :
                        'bg-[#111] text-neutral-400 border border-white/5'
                      }`}>
                        {leader.username.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`font-semibold tracking-wide truncate max-w-[150px] sm:max-w-[200px] ${isMe ? 'text-amber-500' : 'text-neutral-200'}`}>
                          {leader.username}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20 ml-3 uppercase tracking-widest shrink-0 hidden sm:inline-block">
                            You
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Elo Rating */}
                    <div className="col-span-4 text-right pr-4 flex items-center justify-end space-x-2">
                      <Zap size={18} className={index < 3 ? 'text-amber-500' : 'text-neutral-600'} strokeWidth={2} />
                      <span className={`font-bold tracking-widest text-xl ${index < 3 ? 'text-amber-500 drop-shadow-sm' : 'text-white'}`}>
                        {leader.eloRating}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
                <Crown size={32} className="text-neutral-700" strokeWidth={1.5} />
                <p className="text-neutral-500 font-mono text-sm tracking-wide">
                  No ranked players yet. Enter the arena to claim rank #1.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}