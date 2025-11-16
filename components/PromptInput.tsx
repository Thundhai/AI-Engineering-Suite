
import React from 'react';
import { GenerateIcon } from './Icons';
import Spinner from './Spinner';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isGenerating }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <h2 className="text-lg font-semibold mb-3 text-cyan-400">1. Engineering Request</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g., Design a 10m long simply supported concrete beam to carry a UDL of 25 kN/m..."
        className="w-full h-40 bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 resize-none"
        disabled={isGenerating}
      />
      <button
        onClick={onGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-300"
      >
        {isGenerating ? (
          <>
            <Spinner />
            Generating...
          </>
        ) : (
          <>
            <GenerateIcon className="w-5 h-5" />
            Generate Engineering Report
          </>
        )}
      </button>
    </div>
  );
};

export default PromptInput;
