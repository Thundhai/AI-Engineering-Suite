
import React from 'react';
import { GenerationMode } from '../types';

interface ModeSelectorProps {
  currentMode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  isDisabled: boolean;
}

const modes: { id: GenerationMode; label: string; description: string }[] = [
  { id: 'Fast', label: 'Fast', description: 'Quick responses, good for simple tasks.' },
  { id: 'Balanced', label: 'Balanced', description: 'Default performance and reasoning.' },
  { id: 'Complex', label: 'Complex', description: 'Enhanced reasoning for tough problems.' },
];

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, isDisabled }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-cyan-400">Generation Mode</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            disabled={isDisabled}
            className={`flex-1 p-3 text-left rounded-md border-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              currentMode === mode.id
                ? 'bg-cyan-800/60 border-cyan-500'
                : 'bg-gray-900/50 border-gray-700 hover:border-cyan-600'
            }`}
          >
            <p className="font-bold text-white">{mode.label}</p>
            <p className="text-xs text-gray-400">{mode.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
