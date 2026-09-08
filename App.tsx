
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentSelector from './components/AgentSelector';
import OutputDisplay from './components/OutputDisplay';
import { Project, EngineeringOutput, GenerationMode, ChatMessage, UploadedFile, GeoLocation, ProjectVersion } from './types';
import { detectActiveAgents, generateEngineeringOutput, generateSpeech, generateChatResponse } from './services/geminiService';
import * as projectsService from './services/projectsService';
import { getSession, onAuthStateChange, signOut } from './services/authService';
import ModeSelector from './components/ModeSelector';
import Chatbot from './components/Chatbot';
import { ChatIcon, FolderIcon, GearIcon, HistoryIcon, CloseIcon } from './components/Icons';
import { decode, decodeAudioData } from './utils/audioUtils';
import ProjectManager from './components/ProjectManager';
import AlphaEarthConnector from './components/AlphaEarthConnector';
import VersionControl from './components/VersionControl';
import AuthScreen from './components/AuthScreen';
import Spinner from './components/Spinner';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';
type SidebarTab = 'projects' | 'config' | 'history';

const sanitizeModelResponse = (text: string): string => {
  return text.replace(/(\*+)/g, '').trim();
};

const LAST_ACTIVE_PROJECT_KEY = 'ai-engineering-last-active-project-id';

const App: React.FC = () => {
  // `undefined` = auth state not checked yet, `null` = signed out.
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
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
  const promptSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  // --- Auth ---------------------------------------------------------------
  useEffect(() => {
    getSession().then(setSession);
    const unsubscribe = onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  // --- Load this user's projects from Supabase once signed in ------------
  useEffect(() => {
    if (!session) {
      setProjects([]);
      setActiveProjectId(null);
      return;
    }
    setIsLoadingProjects(true);
    projectsService.listProjects()
      .then((loaded) => {
        setProjects(loaded);
        const savedId = localStorage.getItem(LAST_ACTIVE_PROJECT_KEY);
        if (savedId && loaded.some(p => p.id === savedId)) {
          setActiveProjectId(savedId);
        } else if (loaded.length > 0) {
          setActiveProjectId(loaded[0].id);
        }
      })
      .catch((e: any) => setError(e.message || 'Failed to load your projects.'))
      .finally(() => setIsLoadingProjects(false));
  }, [session]);

  // Remember which project was open last — a UI convenience only, not a
  // data store (the projects themselves live in Supabase).
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(LAST_ACTIVE_PROJECT_KEY, activeProjectId);
    } else {
      localStorage.removeItem(LAST_ACTIVE_PROJECT_KEY);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
      if (audioSourceRef.current) audioSourceRef.current.stop();
      audioContextRef.current?.close();
    };
  }, []);

  // Applies a patch optimistically, then writes it through to Supabase.
  // `debounce: true` is used for the high-frequency prompt textarea so we
  // aren't writing to the database on every keystroke.
  const updateActiveProject = useCallback((patch: projectsService.ProjectPatch, opts?: { debounce?: boolean }) => {
    if (!activeProjectId) return;
    const id = activeProjectId;
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...patch } as Project : p)));

    const commit = () => {
      projectsService.updateProject(id, patch)
        .then((updatedAt) => {
          setProjects(prev => prev.map(p => (p.id === id ? { ...p, updatedAt } : p)));
        })
        .catch((e: any) => setError(e.message || 'Failed to save changes.'));
    };

    if (opts?.debounce) {
      if (promptSaveTimerRef.current) clearTimeout(promptSaveTimerRef.current);
      promptSaveTimerRef.current = setTimeout(commit, 800);
    } else {
      commit();
    }
  }, [activeProjectId]);

  const handleDetectAgents = useCallback(async () => {
    if (!activeProject || !activeProject.prompt.trim()) {
      setError('Please enter a prompt before detecting agents.');
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
      setError(e.message || 'Failed to detect agents.');
    } finally {
      setIsDetecting(false);
    }
  }, [activeProject, updateActiveProject]);

  const handleCreateProject = useCallback(async (name: string, description: string) => {
    try {
      const newProject = await projectsService.createProject(name, description);
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create project.');
    }
  }, []);

  const handleDeleteProject = useCallback(async (id: string) => {
    const previous = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
    try {
      await projectsService.deleteProject(id);
    } catch (e: any) {
      setProjects(previous);
      setError(e.message || 'Failed to delete project.');
    }
  }, [projects, activeProjectId]);

  const handleAgentToggle = useCallback((agentName: string) => {
    if (!activeProject) return;
    const newSet = new Set<string>(activeProject.selectedAgents);
    if (newSet.has(agentName)) newSet.delete(agentName);
    else newSet.add(agentName);
    updateActiveProject({ selectedAgents: Array.from(newSet) });
  }, [activeProject, updateActiveProject]);

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || !activeProject) return;
    const existingNames = new Set(activeProject.uploadedFiles.map(f => f.name));
    const toUpload = Array.from(files).filter(f => !existingNames.has(f.name));
    if (toUpload.length === 0) return;
    try {
      const uploaded: UploadedFile[] = await Promise.all(
        toUpload.map(f => projectsService.uploadProjectFile(activeProject.id, f))
      );
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, uploadedFiles: [...p.uploadedFiles, ...uploaded] } : p
      )));
    } catch (e: any) {
      setError(e.message || 'There was an error uploading one or more files.');
    }
  }, [activeProject]);

  const handleRemoveFile = useCallback(async (fileId: string) => {
    if (!activeProject) return;
    const file = activeProject.uploadedFiles.find(f => f.id === fileId);
    if (!file) return;
    setProjects(prev => prev.map(p => (
      p.id === activeProject.id ? { ...p, uploadedFiles: p.uploadedFiles.filter(f => f.id !== fileId) } : p
    )));
    try {
      await projectsService.removeProjectFile(file.id, file.storagePath);
    } catch (e: any) {
      setError(e.message || 'Failed to remove the file.');
    }
  }, [activeProject]);

  const handleSetAlphaEarthLocation = useCallback((location: GeoLocation | null) => {
    if (!activeProject) return;
    updateActiveProject({ alphaEarthLocation: location });
  }, [activeProject, updateActiveProject]);

  const handleSaveVersion = useCallback(async (name: string) => {
    if (!activeProject) return;
    try {
      const newVersion = await projectsService.saveVersion(
        activeProject.id,
        name || `Version ${activeProject.versions.length + 1}`,
        {
          prompt: activeProject.prompt,
          selectedAgents: activeProject.selectedAgents,
          generationMode: activeProject.generationMode,
          output: activeProject.output,
        }
      );
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, versions: [...p.versions, newVersion] } : p
      )));
    } catch (e: any) {
      setError(e.message || 'Failed to save version.');
    }
  }, [activeProject]);

  const handleRevertToVersion = useCallback((version: ProjectVersion) => {
    updateActiveProject({
      prompt: version.prompt,
      selectedAgents: version.selectedAgents,
      generationMode: version.generationMode,
      output: version.output,
    });
  }, [updateActiveProject]);

  const handleDeleteVersion = useCallback(async (versionId: string) => {
    if (!activeProject) return;
    const previousVersions = activeProject.versions;
    setProjects(prev => prev.map(p => (
      p.id === activeProject.id ? { ...p, versions: p.versions.filter(v => v.id !== versionId) } : p
    )));
    try {
      await projectsService.deleteVersion(versionId);
    } catch (e: any) {
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, versions: previousVersions } : p
      )));
      setError(e.message || 'Failed to delete version.');
    }
  }, [activeProject]);

  const handleGenerate = useCallback(async () => {
    if (!activeProject || !activeProject.prompt.trim() || activeProject.selectedAgents.length === 0) {
      setError('Please enter a request and select at least one agent.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result: EngineeringOutput = await generateEngineeringOutput(
        activeProject.prompt,
        activeProject.selectedAgents,
        activeProject.generationMode,
        activeProject.uploadedFiles,
        activeProject.isRedactionEnabled,
        activeProject.alphaEarthLocation ?? null
      );
      updateActiveProject({ output: result });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  }, [activeProject, updateActiveProject]);

  const handleChatSend = useCallback(async (input: string) => {
    if (!activeProject || !input.trim()) return;
    setIsChatLoading(true);
    setError(null);
    try {
      const userMessage: ChatMessage = await projectsService.addChatMessage(activeProject.id, 'user', input);
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, chatHistory: [...p.chatHistory, userMessage] } : p
      )));

      const historyForModel = [...activeProject.chatHistory, userMessage];
      const responseText = await generateChatResponse(historyForModel);
      const sanitizedResponse = sanitizeModelResponse(responseText);
      const modelMessage: ChatMessage = await projectsService.addChatMessage(activeProject.id, 'model', sanitizedResponse);
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, chatHistory: [...p.chatHistory, modelMessage] } : p
      )));
    } catch (e: any) {
      const fallback: ChatMessage = { id: crypto.randomUUID(), role: 'model', content: e.message || 'Sorry, an error occurred.' };
      setProjects(prev => prev.map(p => (
        p.id === activeProject.id ? { ...p, chatHistory: [...p.chatHistory, fallback] } : p
      )));
    } finally {
      setIsChatLoading(false);
    }
  }, [activeProject]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (e: any) {
      setError(e.message || 'Failed to sign out.');
    }
  }, []);

  // Audio playback (unchanged behavior — TTS still runs through the same
  // gemini-proxy Edge Function, only the transport changed).
  const play = useCallback((offset: number = 0) => {
    const audioContext = audioContextRef.current;
    const audioBuffer = audioBufferRef.current;
    if (!audioContext || !audioBuffer) return;

    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null;
      try { audioSourceRef.current.stop(); } catch (e) { /* already stopped */ }
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
    try { source.stop(); } catch (e) { /* ignore */ }
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
          setError(e.message || 'Failed to play audio.');
          setAudioState('idle');
        }
        break;
      case 'playing': pause(); break;
      case 'paused': play(pausedAtTimeRef.current); break;
      default: break;
    }
  }, [audioState, play, pause]);

  const isUIInteractable = !!activeProject && !isGenerating;

  if (session === undefined) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-eng-bg">
        <Spinner size="lg" />
      </div>
    );
  }

  if (session === null) {
    return <AuthScreen onSignedIn={() => { /* onAuthStateChange updates session automatically */ }} />;
  }

  return (
    <div className="h-screen bg-eng-bg text-eng-ink font-sans flex flex-col overflow-hidden">
      <Header userEmail={session.user.email ?? ''} onSignOut={handleSignOut} />

      <div className="flex flex-grow overflow-hidden relative">
        <aside className="w-16 bg-white border-r border-eng-border flex flex-col items-center py-4 z-50 relative">
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
              className="p-2 text-eng-muted hover:text-eng-accent transition-colors"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className={`transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </aside>

        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-eng-navy/10 backdrop-blur-[1px] z-30 lg:hidden"
              />

              <motion.aside
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: 'tween', duration: 0.2 }}
                className="absolute left-16 top-0 bottom-0 w-80 bg-white border-r border-eng-border shadow-lg z-40 overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-50">
                  <h2 className="text-sm font-semibold text-eng-navy flex items-center gap-2">
                    {activeTab === 'projects' && <FolderIcon className="w-4 h-4" />}
                    {activeTab === 'config' && <GearIcon className="w-4 h-4" />}
                    {activeTab === 'history' && <HistoryIcon className="w-4 h-4" />}
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </h2>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 text-eng-muted hover:text-eng-navy transition-colors"
                  >
                    <CloseIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto custom-scrollbar p-4">
                  {isLoadingProjects ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-eng-muted">
                      <Spinner />
                      <p className="text-sm">Loading your projects…</p>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'projects' && (
                        <div className="h-full">
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
                        </div>
                      )}

                      {activeTab === 'config' && (
                        <div className="flex flex-col gap-6">
                          <ModeSelector
                            currentMode={activeProject?.generationMode ?? 'Balanced'}
                            onModeChange={(m: GenerationMode) => updateActiveProject({ generationMode: m })}
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
                        </div>
                      )}

                      {activeTab === 'history' && (
                        <div className="flex flex-col gap-6">
                          <VersionControl
                            versions={activeProject?.versions ?? []}
                            onSaveVersion={handleSaveVersion}
                            onRevertToVersion={handleRevertToVersion}
                            onDeleteVersion={handleDeleteVersion}
                            disabled={!activeProject}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main className="flex-grow overflow-y-auto custom-scrollbar p-6 flex flex-col items-center">
          <div className="max-w-5xl w-full flex flex-col gap-6">
            <PromptInput
              prompt={activeProject?.prompt ?? ''}
              setPrompt={(p) => updateActiveProject({ prompt: p }, { debounce: true })}
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

            <OutputDisplay
              output={activeProject?.output ?? null}
              error={error}
              isGenerating={isGenerating}
              onPlayPause={handlePlayPause}
              audioState={audioState}
            />
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

      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 bg-eng-navy hover:bg-eng-navy-soft text-white rounded-full p-4 shadow-lg transition-colors z-40"
        aria-label="Open assistant"
      >
        <ChatIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

const SidebarTabButton: React.FC<{
  id: SidebarTab;
  active: boolean;
  onClick: () => void;
  icon: React.FC<{ className?: string }>;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center py-4 transition-colors duration-150 ${
      active
        ? 'sidebar-tab-active'
        : 'text-eng-muted border-r-2 border-transparent hover:text-eng-navy hover:bg-slate-50'
    }`}
    title={label}
  >
    <Icon className="w-5 h-5 mb-1" />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
