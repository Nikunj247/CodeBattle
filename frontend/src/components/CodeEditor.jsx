import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send, Loader2, Terminal, CheckCircle2, XCircle, GripHorizontal } from 'lucide-react';
import api from '../utils/api';

const LANGUAGE_TEMPLATES = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        \n    }\n}`
};

export default function CodeEditor({ problemId, starterCode, onSuccess, mode = 'practice', userId, onSyncCode }) {
  const editorRef = useRef(null);
  
  // === THE FIX 1: Remember the user's selected language globally ===
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferred_language') || 'cpp';
  });

  // === THE BULLETPROOF CACHE EXTRACTOR ===
  const getCodeForLanguage = useCallback((lang, currentProblemId) => {
    const key = `saved_code_${currentProblemId}_${lang}`;
    let cached = localStorage.getItem(key);

    if (cached === '[object Object]') {
      localStorage.removeItem(key);
      cached = null;
    }

    const defaultCode = starterCode ? starterCode[lang] : null;
    return cached || defaultCode || LANGUAGE_TEMPLATES[lang] || '';
  }, [starterCode]);

  // 1. Initialize code safely on first load
  const [code, setCode] = useState(() => getCodeForLanguage(language, problemId));

  // 2. Handle Problem Switch
  useEffect(() => {
    setCode(getCodeForLanguage(language, problemId));
  }, [problemId, getCodeForLanguage, language]); 

  // === TERMINAL & UI STATES ===
  const [isRunning, setIsRunning] = useState(false); 
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [cooldown, setCooldown] = useState(0); 

  const editorContainerRef = useRef(null);
  const [topHeight, setTopHeight] = useState(70); 
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null); 
  const [metrics, setMetrics] = useState(null);

  // === THE FIX 2: Save the new language to localStorage on switch ===
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    localStorage.setItem('preferred_language', newLang); // <-- SAVES PREFERENCE
    setCode(getCodeForLanguage(newLang, problemId)); 
    
    setStatus(null);
    setOutput('');
    setMetrics(null);
  };

  const handleCodeChange = (val) => {
    setCode(val);
    if (val && typeof val === 'string') {
      localStorage.setItem(`saved_code_${problemId}_${language}`, val);
    }
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const startDragVertical = (e) => {
    e.preventDefault();
    setIsDraggingVertical(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = useCallback(() => {
    setIsDraggingVertical(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingVertical || !editorContainerRef.current) return;
    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const newTopHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
    
    if (newTopHeight > 20 && newTopHeight < 80) {
      setTopHeight(newTopHeight);
    }
  }, [isDraggingVertical]);

  useEffect(() => {
    if (isDraggingVertical) {
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
  }, [isDraggingVertical, handleMouseMove, handleMouseUp]);

  const handleRun = async (isSubmit = false) => {
    if (cooldown > 0) return;
    
    isSubmit ? setIsSubmitting(true) : setIsRunning(true);
    setStatus(null);
    setOutput('');
    setMetrics(null);

    if (onSyncCode) {
      onSyncCode(code, problemId);
    }

    try {
      const response = await api.post('/execute', {
        problemId,
        sourceCode: code,
        language,
        isSubmit,
        mode,
        userId
      });

      const { success, status: execStatus, output: execOutput, time, memory } = response.data;
      
      setOutput(execOutput);
      setStatus(success ? (isSubmit ? 'accepted' : 'executed') : 'error');
      if (time && memory) setMetrics({ time, memory });

      if (success && isSubmit) {
        localStorage.removeItem(`saved_code_${problemId}_${language}`); 
        if (onSuccess) onSuccess();
      }

    } catch (error) {
      setStatus('error');
      setOutput(error.response?.data?.output || 'Failed to connect to execution server.');
    } finally {
      isSubmit ? setIsSubmitting(false) : setIsRunning(false);
      setCooldown(5);
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]" ref={editorContainerRef}>
      
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-white/5 shrink-0">
        <div className="flex items-center space-x-3">
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-[#050505] border border-white/10 text-neutral-300 text-xs font-mono rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50 transition-colors"
          >
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => handleRun(false)}
            disabled={isRunning || isSubmitting || cooldown > 0}
            className="flex items-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-4 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
          >
            {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            <span>{cooldown > 0 && isRunning ? `Cooldown (${cooldown}s)` : 'Run Code'}</span>
          </button>
          
          <button 
            onClick={() => handleRun(true)}
            disabled={isRunning || isSubmitting || cooldown > 0}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-black px-5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ height: `${topHeight}%` }} className="relative shrink-0 z-0">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, monospace',
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            formatOnPaste: true,
          }}
        />
      </div>

      {/* Resizer */}
      <div 
        onMouseDown={startDragVertical}
        className={`h-2 z-20 cursor-row-resize flex flex-col items-center justify-center shrink-0 border-y border-white/5 transition-colors duration-300 group ${isDraggingVertical ? 'bg-amber-500/20 border-amber-500/50' : 'bg-[#050505] hover:bg-amber-500/10'}`}
      >
        <GripHorizontal size={14} className={`${isDraggingVertical ? 'text-amber-500' : 'text-neutral-600 group-hover:text-amber-500'}`} />
      </div>

      {/* Execution Console */}
      <div style={{ height: `${100 - topHeight}%` }} className="flex flex-col bg-[#050505] shrink-0 z-10 relative">
        <div className="px-5 py-3 bg-[#111] border-b border-white/5 flex items-center space-x-2 text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest shrink-0">
          <Terminal size={14} className="text-amber-500" strokeWidth={2} />
          <span>Execution Console</span>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto font-mono text-sm custom-scrollbar">
          {status && (
            <div className={`flex items-center space-x-2 mb-4 font-bold tracking-wide ${status === 'error' ? 'text-rose-500' : 'text-emerald-400'}`}>
              {status === 'error' ? <XCircle size={18} strokeWidth={2} /> : <CheckCircle2 size={18} strokeWidth={2} />}
              <span className="text-sm uppercase">
                {status === 'accepted' && 'Accepted'}
                {status === 'executed' && 'Code Executed Successfully'}
                {status === 'error' && 'Runtime / Compilation Error'}
              </span>
            </div>
          )}

          {metrics && (
            <div className="flex space-x-8 text-neutral-500 mb-5 text-xs font-mono uppercase tracking-widest bg-[#111] border border-white/5 p-3 rounded-lg inline-flex">
              <span>Runtime: <strong className="text-neutral-200 ml-2">{metrics.time}s</strong></span>
              <span>Memory: <strong className="text-neutral-200 ml-2">{metrics.memory} KB</strong></span>
            </div>
          )}

          <pre className={`whitespace-pre-wrap text-sm leading-relaxed ${status === 'error' ? 'text-rose-400' : 'text-neutral-300'}`}>
            {output || (
              <span className="text-neutral-600 font-mono text-xs uppercase tracking-widest">
                Compiler standing by...
              </span>
            )}
          </pre>
        </div>
      </div>

    </div>
  );
}