
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentSelector from './components/AgentSelector';
import OutputDisplay from './components/OutputDisplay';
import { EngineeringOutput, GenerationMode, ChatMessage } from './types';
import { detectActiveAgents, generateEngineeringOutput, generateSpeech } from './services/geminiService';
import ModeSelector from './components/ModeSelector';
import Chatbot from './components/Chatbot';
import { ChatIcon } from './components/Icons';
import { playAudio } from './utils/audioUtils';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [suggestedAgents, setSuggestedAgents] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [output, setOutput] = useState<EngineeringOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('Balanced');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);


  const debounceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (prompt.trim().length > 10) {
      setIsDetecting(true);
      debounceTimeoutRef.current = window.setTimeout(() => {
        detectActiveAgents(prompt).then(agents => {
          setSuggestedAgents(agents);
          setSelectedAgents(prev => new Set([...prev, ...agents]));
          setIsDetecting(false);
        });
      }, 1000);
    } else {
        setIsDetecting(false);
        setSuggestedAgents([]);
    }
  }, [prompt]);

  const handleAgentToggle = useCallback((agentName: string) => {
    setSelectedAgents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agentName)) {
        newSet.delete(agentName);
      } else {
        newSet.add(agentName);
      }
      return newSet;
    });
  }, []);
  
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || selectedAgents.size === 0) {
      setError("Please enter a prompt and select at least one agent.");
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setOutput(null);

    try {
      const result = await generateEngineeringOutput(prompt, Array.from(selectedAgents), generationMode);
      setOutput(result);
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedAgents, generationMode]);

  const handleSpeak = useCallback(async (text: string) => {
    if (!text || isAudioPlaying) return;
    setIsAudioPlaying(true);
    try {
      const audioData = await generateSpeech(text);
      await playAudio(audioData);
    } catch (e: any) {
      setError(e.message || "Failed to play audio.");
    } finally {
      setIsAudioPlaying(false);
    }
  }, [isAudioPlaying]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 flex flex-col gap-6">
          <PromptInput 
            prompt={prompt} 
            setPrompt={setPrompt} 
            onGenerate={handleGenerate} 
            isGenerating={isGenerating} 
          />
          <ModeSelector
            currentMode={generationMode}
            onModeChange={setGenerationMode}
            isDisabled={isGenerating}
          />
          <AgentSelector
            selectedAgents={selectedAgents}
            suggestedAgents={new Set(suggestedAgents)}
            onAgentToggle={handleAgentToggle}
            isDetecting={isDetecting}
          />
        </div>
        <div className="lg:w-2/3 flex flex-col">
          <OutputDisplay 
            output={output} 
            error={error} 
            isGenerating={isGenerating}
            onSpeak={handleSpeak}
            isAudioPlaying={isAudioPlaying}
          />
        </div>
      </main>
      <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full p-4 shadow-lg transition-transform duration-300 hover:scale-110"
        aria-label="Open Chatbot"
      >
        <ChatIcon className="w-8 h-8" />
      </button>
    </div>
  );
};

export default App;
