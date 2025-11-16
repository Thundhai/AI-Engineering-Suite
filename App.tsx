


import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentSelector from './components/AgentSelector';
import OutputDisplay from './components/OutputDisplay';
import { Project, EngineeringOutput, GenerationMode, ChatMessage, UploadedFile, GeoLocation } from './types';
import { detectActiveAgents, generateEngineeringOutput, generateSpeech, generateChatResponse } from './services/geminiService';
import ModeSelector from './components/ModeSelector';
import Chatbot from './components/Chatbot';
import { ChatIcon } from './components/Icons';
import { decode, decodeAudioData } from './utils/audioUtils';
import ProjectManager from './components/ProjectManager';
import AlphaEarthConnector from './components/AlphaEarthConnector';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';

const sanitizeModelResponse = (text: string): string => {
  return text.replace(/(\*+)/g, '').trim();
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [suggestedAgents, setSuggestedAgents] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [audioState, setAudioState] = useState<AudioState>('idle');

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pausedAtTimeRef = useRef<number>(0);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // Load projects from localStorage on initial mount
  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('ai-engineering-projects');
      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      }
      const savedActiveId = localStorage.getItem('ai-engineering-active-project-id');
      if (savedActiveId) {
        setActiveProjectId(savedActiveId);
      }
    } catch (e) {
      console.error("Failed to load projects from localStorage", e);
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ai-engineering-projects', JSON.stringify(projects));
      if (activeProjectId) {
        localStorage.setItem('ai-engineering-active-project-id', activeProjectId);
      } else {
        localStorage.removeItem('ai-engineering-active-project-id');
      }
    } catch (e) {
      console.error("Failed to save projects to localStorage", e);
    }
  }, [projects, activeProjectId]);

  useEffect(() => {
    // AudioContext setup
    if (typeof window !== 'undefined' && !audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
        if(audioSourceRef.current) audioSourceRef.current.stop();
        audioContextRef.current?.close();
    };
  }, []);

  const updateActiveProject = (updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => {
    if (!activeProjectId) return;
    setProjects(prevProjects => 
      prevProjects.map(p => 
        p.id === activeProjectId ? { ...p, ...updates } : p
      )
    );
  };

  const handleDetectAgents = useCallback(async () => {
    if (!activeProject || !activeProject.prompt.trim()) {
        setError("Please enter a prompt before detecting agents.");
        return;
    }
    setIsDetecting(true);
    setError(null);
    try {
        const agents = await detectActiveAgents(activeProject.prompt);
        setSuggestedAgents(agents);
        updateActiveProject({
            selectedAgents: Array.from(new Set([...activeProject.selectedAgents, ...agents]))
        });
    } catch (e: any) {
        setError(e.message || "Failed to detect agents.");
    } finally {
        setIsDetecting(false);
    }
  }, [activeProject]);

  const handleCreateProject = (name: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      prompt: '',
      selectedAgents: [],
      uploadedFiles: [],
      generationMode: 'Balanced',
      isRedactionEnabled: false,
      output: null,
      chatHistory: [],
      alphaEarthLocation: null,
    };
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const handleSaveProject = useCallback((): boolean => {
    try {
      localStorage.setItem('ai-engineering-projects', JSON.stringify(projects));
      if (activeProjectId) {
        localStorage.setItem('ai-engineering-active-project-id', activeProjectId);
      } else {
        localStorage.removeItem('ai-engineering-active-project-id');
      }
      return true;
    } catch (e) {
      console.error("Failed to manually save projects to localStorage", e);
      setError("Failed to save project. Check browser permissions for localStorage.");
      return false;
    }
  }, [projects, activeProjectId]);

  const handleAgentToggle = useCallback((agentName: string) => {
    if (!activeProject) return;
    const newSet = new Set(activeProject.selectedAgents);
    if (newSet.has(agentName)) {
      newSet.delete(agentName);
    } else {
      newSet.add(agentName);
    }
    updateActiveProject({ selectedAgents: Array.from(newSet) });
  }, [activeProject]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !activeProject) return;
    const filePromises = Array.from(files).map(file => 
      new Promise<UploadedFile>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = (event.target?.result as string).split(',')[1];
          if (base64String) resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', data: base64String });
          else reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      })
    );
    try {
      const results = await Promise.all(filePromises);
      const existingFileNames = new Set(activeProject.uploadedFiles.map(f => f.name));
      const uniqueNewFiles = results.filter(f => !existingFileNames.has(f.name));
      updateActiveProject({ uploadedFiles: [...activeProject.uploadedFiles, ...uniqueNewFiles] });
    } catch(e) {
      console.error("Error reading files:", e);
      setError("There was an error uploading one or more files.");
    }
  }, [activeProject]);

  const handleRemoveFile = useCallback((fileName: string) => {
    if (!activeProject) return;
    updateActiveProject({ uploadedFiles: activeProject.uploadedFiles.filter(f => f.name !== fileName) });
  }, [activeProject]);

  const handleSetAlphaEarthLocation = useCallback((location: GeoLocation | null) => {
    if (!activeProject) return;
    updateActiveProject({ alphaEarthLocation: location });
  }, [activeProject]);
  
  const handleGenerate = useCallback(async () => {
    if (!activeProject || !activeProject.prompt.trim() || activeProject.selectedAgents.length === 0) {
      setError("Please enter a prompt and select at least one agent.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    updateActiveProject({ output: null });
    try {
      const result = await generateEngineeringOutput(
        activeProject.prompt, 
        activeProject.selectedAgents, 
        activeProject.generationMode, 
        activeProject.uploadedFiles, 
        activeProject.isRedactionEnabled,
        activeProject.alphaEarthLocation ?? null
      );
      updateActiveProject({ output: result });
    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject]);
  
  const handleChatSend = useCallback(async (input: string) => {
    if (!activeProject || !input.trim()) return;
    
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input };
    const updatedHistory = [...activeProject.chatHistory, userMessage];
    updateActiveProject({ chatHistory: updatedHistory });
    setIsChatLoading(true);
    setError(null); // Clear previous errors

    try {
        const responseText = await generateChatResponse(updatedHistory);
        const sanitizedResponse = sanitizeModelResponse(responseText);
        const modelMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: sanitizedResponse };
        updateActiveProject({ chatHistory: [...updatedHistory, modelMessage] });
    } catch(e: any) {
        const errorMessage: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: e.message || "Sorry, an error occurred." };
        updateActiveProject({ chatHistory: [...updatedHistory, errorMessage] });
    } finally {
        setIsChatLoading(false);
    }
  }, [activeProject]);
  
  // Audio playback logic (play, pause, handlePlayPause) remains largely the same
  const play = useCallback((offset: number = 0) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioContext || !audioBuffer) return;

    if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        try { audioSourceRef.current.stop(); } catch(e) {/* ignore if already stopped */}
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
        setAudioState('idle');
        pausedAtTimeRef.current = 0;
        audioSourceRef.current = null;
    };
    source.start(0, offset);
    audioSourceRef.current = source;
    playbackStartTimeRef.current = audioContext.currentTime;
    setAudioState('playing');
  }, []);

  const pause = useCallback(() => {
      const audioContext = audioContextRef.current;
      const source = audioSourceRef.current;
      if (audioState !== 'playing' || !audioContext || !source) return;
      const elapsedSincePlay = audioContext.currentTime - playbackStartTimeRef.current;
      pausedAtTimeRef.current += elapsedSincePlay;
      source.onended = null;
      try { source.stop(); } catch(e) {/* ignore errors */}
      setAudioState('paused');
  }, [audioState]);

  const handlePlayPause = useCallback(async (text?: string) => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    if (audioContext.state === 'suspended') await audioContext.resume();

    switch (audioState) {
        case 'idle':
            if (!text) return;
            setAudioState('generating');
            try {
                const audioData = await generateSpeech(text);
                const decodedBytes = decode(audioData);
                const buffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1);
                audioBufferRef.current = buffer;
                pausedAtTimeRef.current = 0;
                play(0);
            } catch (e: any) {
                setError(e.message || "Failed to play audio.");
                setAudioState('idle');
            }
            break;
        case 'playing': pause(); break;
        case 'paused': play(pausedAtTimeRef.current); break;
        default: break;
    }
  }, [audioState, play, pause]);
  
  const isUIInteractable = !!activeProject && !isGenerating;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 flex flex-col gap-8">
        <ProjectManager
            projects={projects}
            activeProjectId={activeProjectId}
            onCreate={handleCreateProject}
            onSelect={setActiveProjectId}
            onDelete={handleDeleteProject}
            onSave={handleSaveProject}
        />
        <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3 flex flex-col gap-6">
                <PromptInput 
                    prompt={activeProject?.prompt ?? ''}
                    setPrompt={(p) => updateActiveProject({ prompt: p })}
                    onGenerate={handleGenerate} 
                    isGenerating={isGenerating}
                    uploadedFiles={activeProject?.uploadedFiles ?? []}
                    onFileUpload={handleFileUpload}
                    onRemoveFile={handleRemoveFile}
                    isRedactionEnabled={activeProject?.isRedactionEnabled ?? false}
                    onRedactionToggle={() => updateActiveProject({ isRedactionEnabled: !activeProject?.isRedactionEnabled })}
                    disabled={!activeProject}
                    onDetectAgents={handleDetectAgents}
                    isDetecting={isDetecting}
                />
                <AlphaEarthConnector
                  location={activeProject?.alphaEarthLocation ?? null}
                  onSetLocation={handleSetAlphaEarthLocation}
                  disabled={!activeProject}
                />
                <ModeSelector
                    currentMode={activeProject?.generationMode ?? 'Balanced'}
                    onModeChange={(m) => updateActiveProject({ generationMode: m })}
                    isDisabled={!isUIInteractable}
                />
                <AgentSelector
                    selectedAgents={new Set(activeProject?.selectedAgents ?? [])}
                    suggestedAgents={new Set(suggestedAgents)}
                    onAgentToggle={handleAgentToggle}
                    isDetecting={isDetecting}
                    disabled={!activeProject}
                />
            </div>
            <div className="lg:w-2/3 flex flex-col">
                <OutputDisplay 
                    output={activeProject?.output ?? null}
                    error={error} 
                    isGenerating={isGenerating}
                    onPlayPause={handlePlayPause}
                    audioState={audioState}
                />
            </div>
        </div>
      </main>
      <Chatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        messages={activeProject?.chatHistory ?? []}
        onSend={handleChatSend}
        isLoading={isChatLoading}
      />
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