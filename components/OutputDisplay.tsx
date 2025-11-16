
import React, { useState, useMemo } from 'react';
import { EngineeringOutput } from '../types';
import { CopyIcon, CheckIcon, ErrorIcon, SpeakerIcon, PauseIcon } from './Icons';
import Spinner from './Spinner';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';

interface OutputDisplayProps {
  output: EngineeringOutput | null;
  error: string | null;
  isGenerating: boolean;
  onPlayPause: (text: string) => void;
  audioState: AudioState;
}

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, error, isGenerating, onPlayPause, audioState }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [copied, setCopied] = useState(false);

  const tabs = useMemo(() => {
    if (!output) return [];
    return ['all', ...Object.keys(output)];
  }, [output]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderPlayPauseIcon = () => {
    switch (audioState) {
      case 'generating':
        return <Spinner size="sm" />;
      case 'playing':
        return <PauseIcon className="w-5 h-5" />;
      case 'paused':
      case 'idle':
      default:
        return <SpeakerIcon className="w-5 h-5" />;
    }
  };
  
  const renderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <Spinner size="lg" />
          <p className="mt-4 text-lg">Generating Engineering Report...</p>
          <p className="text-sm">This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
          <ErrorIcon className="w-16 h-16" />
          <h3 className="text-xl font-bold mt-4">Generation Failed</h3>
          <p className="mt-2 text-center bg-red-900/50 p-3 rounded-md">{error}</p>
        </div>
      );
    }
    
    if (!output) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <h3 className="text-2xl font-bold">AI Engineering Suite</h3>
            <p className="mt-2">Your generated report will appear here.</p>
        </div>
      );
    }
    
    const contentToDisplay = activeTab === 'all' ? output : { [activeTab]: (output as any)[activeTab] };

    return (
      <div className="relative h-full">
        <div className="absolute top-2 right-2 flex gap-2">
            <button 
              onClick={() => onPlayPause(output.final_recommendation)} 
              disabled={audioState === 'generating' || !output.final_recommendation}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={audioState === 'playing' ? 'Pause recommendation' : 'Play recommendation'}
            >
              {renderPlayPauseIcon()}
            </button>
            <button onClick={handleCopy} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition">
              {copied ? <CheckIcon className="w-5 h-5 text-green-400" /> : <CopyIcon className="w-5 h-5" />}
            </button>
        </div>
        <pre className="h-full w-full overflow-auto bg-gray-900/80 p-4 rounded-b-lg text-sm text-cyan-200 whitespace-pre-wrap">
          <code>
            {JSON.stringify(contentToDisplay, null, 2)}
          </code>
        </pre>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 flex flex-col flex-grow min-h-[500px] lg:min-h-0">
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-cyan-400 px-2">3. Generated Output</h2>
      </div>
      {output && (
        <div className="border-b border-gray-700 overflow-x-auto">
          <nav className="flex space-x-2 p-2">
            {tabs.map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition capitalize ${
                  activeTab === tab 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </nav>
        </div>
      )}
      <div className="flex-grow p-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default OutputDisplay;
