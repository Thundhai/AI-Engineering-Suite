
import React from 'react';
import { motion } from 'motion/react';
import { GenerationMode } from '../types';
import { ZapIcon, LayersIcon, ShieldIcon } from './Icons';

interface ModeSelectorProps {
  currentMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  isDisabled: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, isDisabled }) => {
  const modes: { id: GenerationMode; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'Fast', 
      label: 'Rapid Prototype', 
      icon: <ZapIcon className="w-4 h-4" />,
      description: 'Optimized for speed and initial conceptualization.'
    },
    { 
      id: 'Balanced', 
      label: 'Standard Engineering', 
      icon: <LayersIcon className="w-4 h-4" />,
      description: 'Balanced precision and performance for general tasks.'
    },
    { 
      id: 'Complex', 
      label: 'High Fidelity', 
      icon: <ShieldIcon className="w-4 h-4" />,
      description: 'Maximum depth and rigorous validation of outputs.'
    },
  ];

  return (
    <div className="eng-panel p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 bg-eng-accent rounded-full animate-pulse"></span>
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Processing Protocol</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modes.map((m) => (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onModeChange(m.id)}
            disabled={isDisabled}
            className={`relative flex flex-col p-3 rounded border transition-all duration-300 text-left ${
              currentMode === m.id 
                ? 'bg-eng-accent/10 border-eng-accent shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                : 'bg-slate-900/50 border-eng-border/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`${currentMode === m.id ? 'text-eng-accent' : 'text-slate-500'}`}>
                {m.icon}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${currentMode === m.id ? 'text-white' : 'text-slate-400'}`}>
                {m.label}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-sans leading-relaxed">
              {m.description}
            </p>
            {currentMode === m.id && (
              <motion.div 
                layoutId="activeMode"
                className="absolute -top-1 -right-1 w-2 h-2 bg-eng-accent rounded-full shadow-[0_0_8px_#22d3ee]"
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
