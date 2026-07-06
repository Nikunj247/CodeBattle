import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Timer, Play, Pause, RotateCcw, Search, Filter, 
  GripVertical, Loader2, PanelLeftClose, PanelLeft 
} from 'lucide-react';
import { useTimer } from '../hooks/useTimer';
import CodeEditor from '../components/CodeEditor';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PROBLEM_TOPICS } from '../utils/constants';

export default function Arena() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); 

  const { formattedTime, startTimer, stopTimer, setCustomTime, isActive } = useTimer(1800);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  // === Problem State ===
  const [problems, setProblems] = useState([]);
  const [activeProblem, setActiveProblem] = useState(null);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  
  // === Filters ===
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [topicFilter, setTopicFilter] = useState('All');

  // === DRAGGABLE SPLIT PANE ===
  const arenaRef = useRef(null);
  const [leftWidth, setLeftWidth] = useState(40); 
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await api.get('/problems');
        setProblems(response.data);
        const singleTargetId = searchParams.get('problemId'); 
        if (singleTargetId) {
          const foundProblem = response.data.find(p => p._id === singleTargetId);
          setActiveProblem(foundProblem || response.data[0]);
        } else {
          setActiveProblem(response.data[0]); 
        }
      } catch (error) {
        console.error("Failed to fetch problems:", error);
      } finally {
        setIsLoadingProblems(false);
      }
    };
    fetchProblems();
  }, [searchParams]);

  // === SMART FILTERING ===
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || p.difficulty === difficultyFilter;
    const isSolved = user?.solvedProblems?.includes(p._id) || false; 
    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Solved' && isSolved) || 
      (statusFilter === 'To Do' && !isSolved);
    const matchesTopic = 
      topicFilter === 'All' || 
      p.topic === topicFilter || 
      (Array.isArray(p.topics) && p.topics.includes(topicFilter));

    return matchesSearch && matchesDifficulty && matchesStatus && matchesTopic;
  });

  // Drag handlers
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !arenaRef.current) return;
    const arenaRect = arenaRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - arenaRect.left) / arenaRect.width) * 100;
    if (newLeftWidth > 20 && newLeftWidth < 80) setLeftWidth(newLeftWidth);
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleProblemSelect = (problem) => {
    setActiveProblem(problem);
    setCustomMinutes(30);
    setCustomTime(30 * 60);
    stopTimer(); 
  };

  const handleSuccessfulSubmission = (resolvedId) => {
    // Replaced the blocking alert with a silent success handling logic
    console.log("Problem successfully verified by Judge0:", resolvedId);
  };

  return (
    <div className="flex h-[calc(100vh-73px)] bg-[#050505] text-neutral-200 overflow-hidden relative font-sans selection:bg-amber-500/30">
      
      {/* SIDEBAR (Practice Mode Explorer) */}
      <div className={`${isSidebarOpen ? 'w-80 border-r border-white/5' : 'w-0 border-none'} transition-all duration-300 flex flex-col bg-[#0a0a0a] shrink-0 overflow-hidden relative z-20 shadow-2xl`}>
        <div className="p-5 border-b border-white/5 space-y-4 w-80 shrink-0">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center space-x-2">
            <Filter size={14} className="text-amber-500" strokeWidth={2} />
            <span>Problem Explorer</span>
          </h2>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full bg-[#111] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500/50 transition-colors uppercase tracking-wider cursor-pointer">
              <option value="All">Difficulty: All</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500/50 transition-colors uppercase tracking-wider cursor-pointer">
              <option value="All">Status: All</option>
              <option value="To Do">To Do</option>
              <option value="Solved">Solved</option>
            </select>

            <select 
              value={topicFilter} 
              onChange={(e) => setTopicFilter(e.target.value)} 
              className="col-span-2 w-full bg-[#111] border border-white/5 rounded-lg px-2 py-2 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500/50 transition-colors uppercase tracking-wider cursor-pointer"
            >
              <option value="All">Topic: All</option>
              {PROBLEM_TOPICS.map((topic) => (
                <option key={topic} value={topic}>
                  {topic}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto w-80 custom-scrollbar pb-6">
          {isLoadingProblems ? (
            <div className="flex flex-col justify-center items-center h-40 text-neutral-500 space-y-3">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <span className="text-xs font-mono tracking-widest uppercase">Fetching Databanks...</span>
            </div>
          ) : filteredProblems.map((problem) => {
            
            const originalIndex = problems.findIndex(p => p._id === problem._id);
            const originalNumber = originalIndex + 1;
            const isActive = activeProblem?._id === problem._id;

            return (
              <button 
                key={problem._id} 
                onClick={() => handleProblemSelect(problem)} 
                className={`w-full text-left px-5 py-4 border-b border-white/5 transition-colors duration-200 ${isActive ? 'bg-[#111] border-l-4 border-l-amber-500 shadow-inner' : 'hover:bg-white/[0.02] border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-semibold text-sm truncate pr-3 tracking-wide ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                    {originalNumber}. {problem.title} 
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-1 rounded border shrink-0 tracking-widest uppercase ${
                    problem.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    problem.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                    'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN ARENA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a] border-b border-white/5 shrink-0 z-10 shadow-md relative">
          <div className="flex items-center space-x-4">
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 text-neutral-400 hover:text-amber-500 bg-[#111] border border-white/5 rounded-xl transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              title={isSidebarOpen ? "Close Explorer" : "Open Explorer"}
            >
              {isSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
            </button>

            <div className="relative flex items-center bg-[#111] border border-white/5 rounded-xl p-1 shadow-inner">
              <button onClick={() => setIsEditingTime(!isEditingTime)} className="flex items-center space-x-2 font-bold px-3 py-1.5 rounded-lg transition-colors text-amber-500 hover:bg-white/[0.04] cursor-pointer">
                <Timer size={16} className={isActive ? "animate-pulse text-rose-500" : "text-amber-500"} strokeWidth={2} />
                <span className="font-mono text-lg tracking-wider drop-shadow-sm">{formattedTime}</span>
              </button>
              <div className="flex items-center space-x-1 border-l border-white/10 pl-2 ml-1">
                {isActive ? (
                  <button onClick={stopTimer} className="p-2 text-neutral-400 hover:text-amber-500 rounded-lg hover:bg-white/[0.04] transition-colors"><Pause size={14} fill="currentColor" /></button>
                ) : (
                  <button onClick={startTimer} className="p-2 text-neutral-400 hover:text-emerald-400 rounded-lg hover:bg-white/[0.04] transition-colors"><Play size={14} fill="currentColor" /></button>
                )}
                <button onClick={() => {stopTimer(); setCustomTime(customMinutes * 60);}} className="p-2 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-white/[0.04] transition-colors"><RotateCcw size={14} strokeWidth={2.5} /></button>
              </div>
              {isEditingTime && (
                <div className="absolute top-full left-0 mt-3 p-4 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 flex items-center space-x-3 animate-in fade-in zoom-in duration-200">
                  <input type="number" min="1" max="120" value={customMinutes} onChange={(e) => setCustomMinutes(Number(e.target.value))} className="w-16 bg-[#111] border border-white/10 rounded-lg px-2 py-2 text-white text-sm outline-none focus:border-amber-500/50 text-center font-mono transition-colors" />
                  <span className="text-xs text-neutral-500 font-mono font-bold tracking-widest uppercase">MIN</span>
                  <button onClick={() => {setCustomTime(customMinutes * 60); setIsEditingTime(false);}} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase tracking-widest rounded-lg transition-colors">Set</button>
                </div>
              )}
            </div>
            <span className="text-neutral-500 text-[10px] font-mono font-bold uppercase tracking-widest hidden md:block">Practice Mode</span>
          </div>
        </div>

        {/* Split Screen */}
        <div className="flex flex-1 overflow-hidden" ref={arenaRef}>
          <div style={{ width: `${leftWidth}%` }} className="flex flex-col bg-[#050505] shrink-0 p-8 overflow-y-auto custom-scrollbar relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            {activeProblem ? (
              <div className="relative z-10">
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
            ) : (
              <div className="text-neutral-600 font-mono text-sm uppercase tracking-widest text-center mt-32 relative z-10">
                Select a problem from the databanks to begin
              </div>
            )}
          </div>

          <div onMouseDown={handleMouseDown} className={`w-2 z-20 cursor-col-resize flex flex-col items-center justify-center shrink-0 border-x border-white/5 transition-colors duration-300 group ${isDragging ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#050505] hover:bg-amber-500/10'}`}>
            <GripVertical size={14} className={`transition-colors ${isDragging ? 'text-amber-500' : 'text-neutral-600 group-hover:text-amber-500'}`} />
          </div>

          <div style={{ width: `${100 - leftWidth}%` }} className="flex flex-col shrink-0 relative bg-[#0a0a0a]">
            {activeProblem && (
              <CodeEditor 
                key={activeProblem._id} 
                problemId={activeProblem._id} 
                starterCode={activeProblem.starterCode} 
                onSuccess={() => handleSuccessfulSubmission(activeProblem._id)} 
                userId={user?._id}  // <-- THE FIX: Pass the user ID to the backend
                mode="practice"     // <-- THE FIX: Explicitly set the mode
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}