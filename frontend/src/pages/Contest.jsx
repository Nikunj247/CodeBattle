import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Loader2, Layers, Filter, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { PROBLEM_TOPICS } from '../utils/constants';

export default function Contest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { isQueueing, queueTime, joinQueue, leaveQueue, formatTime } = useQueue();
  
  const [questionCount, setQuestionCount] = useState(1);
  const [topic, setTopic] = useState('All');

  const handleQueueClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Only allow joining. Cancelling is now exclusively handled by the Cancel button.
    if (!isQueueing) {
      joinQueue({ 
        userId: user._id,
        questionCount,
        topic
      });
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-amber-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg z-10 space-y-8 animate-in fade-in duration-500"> 
        <div className="text-center space-y-2"> 
          <h1 className="text-3xl md:text-4xl font-bold text-white uppercase tracking-widest drop-shadow-sm whitespace-nowrap"> 
            Ranked Matchmaking
          </h1>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Configure Battle Parameters</p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 shadow-2xl"> 
          
          <div className="mb-8"> 
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
              <Filter size={12} className="mr-2" /> Select Topic
            </label>
            <select 
              value={topic} onChange={(e) => !isQueueing && setTopic(e.target.value)} disabled={isQueueing}
              className="w-full bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-sm text-neutral-300 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
            >
              <option value="All">Any Available Topic</option>
              {PROBLEM_TOPICS.map((topicItem) => (
                <option key={topicItem} value={topicItem}>{topicItem}</option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-3 flex items-center">
              <Layers size={12} className="mr-2" /> Match Duration
            </label>
            <div className="grid grid-cols-3 gap-3"> 
              {[ { q: 1, time: '30m' }, { q: 2, time: '60m' }, { q: 3, time: '90m' } ].map((option) => (
                <button
                  key={option.q} onClick={() => !isQueueing && setQuestionCount(option.q)}
                  className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-300 ${
                    questionCount === option.q 
                      ? 'bg-amber-500/10 border border-amber-500/50 text-amber-500' 
                      : 'bg-[#111] border border-white/5 text-neutral-500 hover:border-white/10'
                  } ${isQueueing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-xl font-bold">{option.q}Q</span> 
                  <span className="text-[10px] font-mono font-bold mt-1 opacity-70">{option.time}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleQueueClick}
              disabled={isQueueing} // Completely locks the button during search
              className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all duration-300 flex items-center justify-center space-x-3 ${
                isQueueing 
                  ? 'bg-[#111] text-amber-500 border border-amber-500/30 cursor-default' 
                  : 'bg-amber-500 hover:bg-amber-400 text-black cursor-pointer'
              }`}
            >
              {isQueueing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="tracking-widest">Searching... {formatTime(queueTime)}</span>
                </>
              ) : (
                <>
                  <Swords size={18} />
                  <span className="tracking-widest">Start Matchmaking</span>
                </>
              )}
            </button>

            {isQueueing && (
              <button 
                onClick={leaveQueue} 
                className="w-full flex items-center justify-center space-x-1.5 text-[10px] font-mono font-bold text-neutral-500 hover:text-rose-500 uppercase tracking-widest transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
                <span>Cancel Search</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}