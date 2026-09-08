
import React from 'react';
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
      label: 'Quick draft',
      icon: <ZapIcon className="w-4 h-4" />,
      description: 'Optimized for speed and early-stage ideas.'
    },
    {
      id: 'Balanced',
      label: 'Standard',
      icon: <LayersIcon className="w-4 h-4" />,
      description: 'Balanced depth and speed for most requests.'
    },
    {
      id: 'Complex',
      label: 'Thorough',
      icon: <ShieldIcon className="w-4 h-4" />,
      description: 'Maximum depth and validation for complex work.'
    },
  ];

  return (
    <div className="eng-panel p-4">
      <h3 className="eng-label mb-3">Report depth</h3>

      <div className="grid grid-cols-1 gap-2">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => onModeChange(m.id)}
            disabled={isDisabled}
            className={`flex items-start gap-3 p-3 rounded-md border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
              currentMode === m.id
                ? 'bg-eng-accent-soft border-eng-accent'
                : 'bg-white border-eng-border hover:border-slate-300'
            }`}
          >
            <div className={`mt-0.5 ${currentMode === m.id ? 'text-eng-accent' : 'text-eng-muted'}`}>
              {m.icon}
            </div>
            <div>
              <span className={`text-sm font-medium ${currentMode === m.id ? 'text-eng-navy' : 'text-eng-ink'}`}>
                {m.label}
              </span>
              <p className="text-xs text-eng-muted leading-relaxed mt-0.5">
                {m.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
