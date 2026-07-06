import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Trophy, Terminal, Zap, Crosshair, MonitorPlay, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-neutral-200 selection:bg-amber-500/30 font-sans">
      
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all duration-300">
            <Terminal size={22} className="text-black" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-widest text-white">
            CODE<span className="text-amber-500">BATTLE</span>
          </span>
        </div>
        <div className="flex items-center space-x-8 font-mono text-sm">
          <Link to="/auth" className="text-neutral-400 hover:text-white transition-colors duration-200">Login</Link>
          <Link to="/auth" state={{ isLogin: false }} className="relative inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-semibold text-black bg-amber-500 rounded-lg group">
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative tracking-wide font-bold">Enter Arena</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Sleek Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
            <span className="text-xs font-mono text-amber-500/90 uppercase tracking-widest">Servers Online • Season 1</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white leading-tight">
            COMPILE. <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600 drop-shadow-sm">
              CONQUER.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-2xl mx-auto font-mono leading-relaxed">
            The ultimate 1v1 competitive programming arena. Queue up, lock in, and out-code opponents in real-time to climb the global Elo ranks.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/auth" state={{ isLogin: false }} className="group relative flex items-center justify-center space-x-3 w-full sm:w-auto bg-amber-500 text-black px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-400 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] hover:-translate-y-1 tracking-wide">
              <Swords size={22} className="group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.5} />
              <span>Start Battling</span>
            </Link>
            
            <a href="#features" className="group flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white border border-white/10 hover:bg-white/5 transition-all duration-300 tracking-wide">
              <span>View Features</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative z-10 border-t border-white/5 bg-[#0a0a0a] py-24 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="group bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(245,158,11,0.05)] hover:-translate-y-2 cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full group-hover:bg-amber-500/10 transition-colors duration-500"></div>
              <Crosshair className="text-amber-500 mb-6 transform group-hover:scale-110 transition-transform duration-500" size={32} strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">Skill-Based Matchmaking</h3>
              <p className="text-neutral-400 font-mono text-sm leading-relaxed">
                No smurfing. Our dynamic Elo engine ensures you only face opponents at your exact skill level across custom difficulty curves.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(245,158,11,0.05)] hover:-translate-y-2 cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full group-hover:bg-amber-500/10 transition-colors duration-500"></div>
              <Zap className="text-amber-500 mb-6 transform group-hover:scale-110 transition-transform duration-500" size={32} strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">Live Execution Engine</h3>
              <p className="text-neutral-400 font-mono text-sm leading-relaxed">
                Powered by Judge0. Submit your code and watch hidden test cases execute in milliseconds with detailed runtime metrics.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-[#111] border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(245,158,11,0.05)] hover:-translate-y-2 cursor-default relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full group-hover:bg-amber-500/10 transition-colors duration-500"></div>
              <MonitorPlay className="text-amber-500 mb-6 transform group-hover:scale-110 transition-transform duration-500" size={32} strokeWidth={1.5} />
              <h3 className="text-xl font-semibold text-white mb-3 tracking-wide">Creator Ready UI</h3>
              <p className="text-neutral-400 font-mono text-sm leading-relaxed">
                Zero clutter. A slick, high-contrast dark mode environment perfectly optimized for screen recording and clipping your best clutches.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-white/5 py-16 bg-[#050505] text-center relative overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-amber-500/5 blur-[100px] pointer-events-none"></div>
        <Trophy className="mx-auto text-amber-500/50 mb-6" size={48} strokeWidth={1.5} />
        <h2 className="text-2xl font-semibold text-white mb-8 tracking-wide">Ready to claim your rank?</h2>
        <Link to="/auth" state={{ isLogin: false }} className="inline-block border-b border-amber-500/50 text-amber-500 font-mono font-semibold hover:text-amber-400 hover:border-amber-400 transition-colors pb-1 tracking-wide">
          Create your free account today
        </Link>
      </footer>
    </div>
  );
}