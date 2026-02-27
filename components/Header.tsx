
import React from 'react';
import { GearIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-eng-surface/80 backdrop-blur-md sticky top-0 z-50 border-b border-eng-border">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-eng-accent/10 p-2 rounded-lg border border-eng-accent/20">
            <GearIcon className="w-8 h-8 text-eng-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              AI ENGINEERING <span className="text-eng-accent font-mono text-sm bg-eng-accent/10 px-2 py-0.5 rounded border border-eng-accent/20">SUITE v2.0</span>
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Multidisciplinary Expert System // Autonomous Agents</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-eng-success rounded-full animate-pulse"></span>
            System Online
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-eng-accent rounded-full"></span>
            Gemini 3.1 Pro
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
