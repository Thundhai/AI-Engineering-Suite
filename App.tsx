
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentSelector from './components/AgentSelector';
import OutputDisplay from './components/OutputDisplay';
import { Project, EngineeringOutput, GenerationMode, ChatMessage, UploadedFile, GeoLocation, ProjectVersion } from './types';
import { detectActiveAgents, generateEngineeringOutput, generateSpeech, generateChatResponse } from './services/geminiService';
import ModeSelector from './components/ModeSelector';
import Chatbot from './components/Chatbot';
import { ChatIcon, FolderIcon, GearIcon, HistoryIcon, MapPinIcon, LayersIcon, CloseIcon } from './components/Icons';
import { decode, decodeAudioData } from './utils/audioUtils';
import ProjectManager from './components/ProjectManager';
import AlphaEarthConnector from './components/AlphaEarthConnector';
import VersionControl from './components/VersionControl';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';
type SidebarTab = 'projects' | 'config' | 'history';

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
  const [activeTab, setActiveTab] = useState<SidebarTab>('projects');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        const parsed = JSON.parse(savedProjects);
        const migrated = parsed.map((p: any) => ({
          ...p,
          description: p.description || '',
          versions: p.versions || []
        }));
        setProjects(migrated);
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
        const agents: string[] = await detectActiveAgents(activeProject.prompt);
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

  const handleCreateProject = (name: string, description: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
      prompt: '',
      selectedAgents: [],
      uploadedFiles: [],
      generationMode: 'Balanced',
      isRedactionEnabled: false,
      output: null,
      chatHistory: [],
      alphaEarthLocation: null,
      versions: [],
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
    const newSet = new Set<string>(activeProject.selectedAgents);
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
        reader.onload = (event: ProgressEvent<FileReader>) => {
          const target = event.target;
          const result = target?.result;
          if (typeof result === 'string') {
              const base64String = result.split(',')[1];
              if (base64String) resolve({ name: file.name, mimeType: file.type || 'application/octet-stream', data: base64String });
              else reject(new Error(`Failed to read file: ${file.name}`));
          } else {
             reject(new Error(`Failed to read file: ${file.name}`));
          }
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

  const handleSaveVersion = useCallback((name: string) => {
    if (!activeProject) return;
    const newVersion: ProjectVersion = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name: name || `Version ${activeProject.versions.length + 1}`,
      prompt: activeProject.prompt,
      selectedAgents: [...activeProject.selectedAgents],
      generationMode: activeProject.generationMode,
      output: activeProject.output ? JSON.parse(JSON.stringify(activeProject.output)) : null,
    };
    updateActiveProject({ versions: [...activeProject.versions, newVersion] });
  }, [activeProject]);

  const handleRevertToVersion = useCallback((version: ProjectVersion) => {
    if (!activeProject) return;
    updateActiveProject({
      prompt: version.prompt,
      selectedAgents: version.selectedAgents,
      generationMode: version.generationMode,
      output: version.output ? JSON.parse(JSON.stringify(version.output)) : null,
    });
  }, [activeProject]);

  const handleDeleteVersion = useCallback((versionId: string) => {
    if (!activeProject) return;
    updateActiveProject({
      versions: activeProject.versions.filter(v => v.id !== versionId)
    });
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
    <div className="h-screen bg-eng-bg text-slate-200 font-sans flex flex-col eng-grid-bg overflow-hidden">
      <Header />
      
      <div className="flex flex-grow overflow-hidden relative">
        {/* Sidebar Icons (Always visible) */}
        <aside className="w-16 bg-eng-surface border-r border-eng-border flex flex-col items-center py-4 z-50 relative">
          <SidebarTabButton 
            id="projects" 
            active={activeTab === 'projects' && isSidebarOpen} 
            onClick={() => { 
              if (activeTab === 'projects' && isSidebarOpen) setIsSidebarOpen(false);
              else { setActiveTab('projects'); setIsSidebarOpen(true); }
            }} 
            icon={FolderIcon} 
            label="Projects" 
          />
          <SidebarTabButton 
            id="config" 
            active={activeTab === 'config' && isSidebarOpen} 
            onClick={() => { 
              if (activeTab === 'config' && isSidebarOpen) setIsSidebarOpen(false);
              else { setActiveTab('config'); setIsSidebarOpen(true); }
            }} 
            icon={GearIcon} 
            label="Config" 
          />
          <SidebarTabButton 
            id="history" 
            active={activeTab === 'history' && isSidebarOpen} 
            onClick={() => { 
              if (activeTab === 'history' && isSidebarOpen) setIsSidebarOpen(false);
              else { setActiveTab('history'); setIsSidebarOpen(true); }
            }} 
            icon={HistoryIcon} 
            label="History" 
          />
          
          <div className="mt-auto pt-4 border-t border-eng-border w-full flex justify-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:text-eng-accent transition-colors"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              <div className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </aside>

        {/* Sidebar Panel (Overlay Drawer) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Scrim/Overlay to prevent interaction with main content when sidebar is open on small screens or for focus */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-eng-bg/40 backdrop-blur-[2px] z-30 lg:hidden"
              />
              
              <motion.aside
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute left-16 top-0 bottom-0 w-80 bg-eng-surface/95 backdrop-blur-md border-r border-eng-border shadow-2xl z-40 overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-800/50">
                  <h2 className="text-xs font-bold text-eng-accent uppercase tracking-widest flex items-center gap-2">
                    {activeTab === 'projects' && <FolderIcon className="w-4 h-4" />}
                    {activeTab === 'config' && <GearIcon className="w-4 h-4" />}
                    {activeTab === 'history' && <HistoryIcon className="w-4 h-4" />}
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h2>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-slate-500 hover:text-white transition-colors"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                  {activeTab === 'projects' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="h-full"
                    >
                      <ProjectManager
                        projects={projects}
                        activeProjectId={activeProjectId}
                        onCreate={handleCreateProject}
                        onSelect={(id) => { setActiveProjectId(id); setIsSidebarOpen(false); }}
                        onDelete={handleDeleteProject}
                        onSaveVersion={handleSaveVersion}
                        onRevertToVersion={handleRevertToVersion}
                        onDeleteVersion={handleDeleteVersion}
                        disabled={isGenerating}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'config' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-6"
                    >
                      <ModeSelector
                        currentMode={activeProject?.generationMode ?? 'Balanced'}
                        onModeChange={(m) => updateActiveProject({ generationMode: m })}
                        isDisabled={!isUIInteractable}
                      />

                      <AlphaEarthConnector
                        location={activeProject?.alphaEarthLocation ?? null}
                        onSetLocation={handleSetAlphaEarthLocation}
                        disabled={!activeProject}
                      />

                      <AgentSelector
                        selectedAgents={new Set(activeProject?.selectedAgents ?? [])}
                        suggestedAgents={new Set(suggestedAgents)}
                        onAgentToggle={handleAgentToggle}
                        isDetecting={isDetecting}
                        disabled={!activeProject}
                      />
                    </motion.div>
                  )}

                  {activeTab === 'history' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-6"
                    >
                      <VersionControl
                        versions={activeProject?.versions ?? []}
                        onSaveVersion={handleSaveVersion}
                        onRevertToVersion={handleRevertToVersion}
                        onDeleteVersion={handleDeleteVersion}
                        disabled={!activeProject}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto custom-scrollbar p-6 flex flex-col items-center">
          <div className="max-w-5xl w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-grow"
            >
              <OutputDisplay 
                output={activeProject?.output ?? null}
                error={error} 
                isGenerating={isGenerating}
                onPlayPause={handlePlayPause}
                audioState={audioState}
              />
            </motion.div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <Chatbot 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)}
            messages={activeProject?.chatHistory ?? []}
            onSend={handleChatSend}
            isLoading={isChatLoading}
          />
        )}
      </AnimatePresence>
      
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-eng-accent text-eng-bg rounded-full p-4 shadow-lg shadow-eng-accent/20 z-40"
        aria-label="Open Chatbot"
      >
        <ChatIcon className="w-8 h-8" />
      </motion.button>
    </div>
  );
};

const SidebarTabButton: React.FC<{ 
  id: SidebarTab; 
  active: boolean; 
  onClick: () => void; 
  icon: React.FC<{className?: string}>;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center py-4 transition-all duration-300 ${
      active 
        ? 'sidebar-tab-active' 
        : 'text-slate-500 border-r-2 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
    }`}
    title={label}
  >
    <Icon className="w-5 h-5 mb-1" />
    <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
