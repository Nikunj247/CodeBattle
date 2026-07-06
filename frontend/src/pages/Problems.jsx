import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, Loader2, Code2, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Problems() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('All'); // 'All', 'Solved', 'Unsolved'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const problemsRes = await api.get('/problems');
        setProblems(problemsRes.data);

        // Fetching solved problems array directly from the User schema
        if (user) {
          const userRes = await api.get(`/users/${user._id}`);
          // Extract the solvedProblems array, defaulting to empty if none exist
          setSolvedProblems(userRes.data.solvedProblems || []); 
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // === THE FIX: Applied Search AND Status Filtering ===
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isSolved = solvedProblems.includes(p._id);
    
    if (filterMode === 'Solved') return matchesSearch && isSolved;
    if (filterMode === 'Unsolved') return matchesSearch && !isSolved;
    return matchesSearch;
  });

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#050505] p-8 text-white font-sans selection:bg-amber-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <BookOpen className="text-amber-500" size={32} />
            <h1 className="text-3xl font-bold uppercase tracking-widest">Problem Databanks</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
              <input 
                type="text" 
                placeholder="Search problems..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono text-neutral-200 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
            
            {/* === THE FIX: Filter Buttons === */}
            <div className="flex bg-[#111] rounded-xl border border-white/10 p-1">
              {['All', 'Solved', 'Unsolved'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${
                    filterMode === mode ? 'bg-amber-500 text-black shadow-sm' : 'text-neutral-500 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problem List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="animate-spin text-amber-500" size={40} />
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            {filteredProblems.length > 0 ? (
              filteredProblems.map((problem, index) => {
                const isSolved = solvedProblems.includes(problem._id); // Check status
                
                return (
                  <div key={problem._id} className="grid grid-cols-12 gap-4 items-center p-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                    <div className="col-span-1 text-center text-neutral-600 font-mono font-bold text-sm">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    
                    <div className="col-span-7 flex flex-col justify-center">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-neutral-200 group-hover:text-amber-500 transition-colors">{problem.title}</span>
                        {/* === THE FIX: Solved Badge === */}
                        {isSolved && (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[9px] font-mono uppercase tracking-widest flex items-center">
                            <CheckCircle2 size={10} className="mr-1" /> Solved
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest mt-1">{problem.topic}</span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      {/* Difficulty rendering... */}
                      <span className={`px-3 py-1 rounded-md border text-[10px] font-mono font-bold tracking-widest uppercase ${
                        problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {problem.difficulty}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <button 
                        onClick={() => navigate(`/arena?problemId=${problem._id}`)}
                        className="flex items-center justify-center space-x-2 bg-[#111] border border-white/10 hover:border-amber-500 hover:text-amber-500 text-neutral-400 px-5 py-2.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                      >
                        <Code2 size={16} strokeWidth={2} />
                        <span>Solve</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-32 text-center flex flex-col items-center justify-center space-y-4">
                <Search size={40} className="text-neutral-700" strokeWidth={1.5} />
                <p className="text-neutral-500 font-mono text-sm tracking-wide">
                  No problems match your current search parameters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}