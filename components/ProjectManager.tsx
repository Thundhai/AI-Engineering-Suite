

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectVersion } from '../types';
import { PlusIcon, TrashIcon, FolderIcon, HistoryIcon, CloseIcon, EyeIcon } from './Icons';
import VersionControl from './VersionControl';

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  onCreate: (name: string, description: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveVersion: (name: string) => void;
  onRevertToVersion: (version: ProjectVersion) => void;
  onDeleteVersion: (versionId: string) => void;
  disabled: boolean;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  projects, 
  activeProjectId, 
  onCreate, 
  onSelect, 
  onDelete,
  onSaveVersion,
  onRevertToVersion,
  onDeleteVersion,
  disabled 
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showVersionControl, setShowVersionControl] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreate(newProjectName.trim(), newProjectDescription.trim());
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateModal(false);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <div className={`eng-panel flex flex-col h-full transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'}`}>
      <div className="eng-header">
        <h2 className="text-sm font-bold text-eng-accent uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-eng-accent rounded-full"></span>
          Project Navigator
        </h2>
      </div>

      <div className="p-4 flex flex-col h-full space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreateModal(true)}
          disabled={disabled}
          className="w-full bg-eng-accent hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-500 text-eng-bg py-2 rounded transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-eng-accent/10"
        >
          <PlusIcon className="w-4 h-4" />
          Initialize New Project
        </motion.button>

        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-eng-border/30 rounded">
              <FolderIcon className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">No Active Projects</p>
            </div>
          ) : (
            projects.map((project) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={project.id}
                className={`group flex items-center justify-between p-2 rounded border transition-all duration-200 ${
                  activeProjectId === project.id 
                    ? 'bg-eng-accent/10 border-eng-accent text-white' 
                    : 'bg-slate-800/30 border-eng-border/50 hover:bg-slate-800/50 text-slate-400'
                }`}
              >
                <button
                  onClick={() => onSelect(project.id)}
                  className="flex-grow flex items-center gap-3 text-left focus:outline-none"
                  disabled={disabled}
                >
                  <FolderIcon className={`w-4 h-4 ${activeProjectId === project.id ? 'text-eng-accent' : 'text-slate-600'}`} />
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold uppercase tracking-wider truncate max-w-[140px]">{project.name}</span>
                    <span className="text-[9px] font-mono opacity-50">{new Date(project.updatedAt || project.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewingProject(project); }}
                    className="p-1.5 text-slate-500 hover:text-eng-accent transition-colors"
                    disabled={disabled}
                    title="View Details"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(project.id); }}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    disabled={disabled}
                    title="Delete Project"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {activeProject && (
          <div className="pt-4 border-t border-eng-border">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowVersionControl(!showVersionControl)}
              className={`w-full flex items-center justify-between p-3 rounded border transition-all duration-300 ${
                showVersionControl ? 'bg-eng-accent text-eng-bg border-eng-accent' : 'bg-slate-800/50 border-eng-border text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Version History</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${showVersionControl ? 'bg-eng-bg/20' : 'bg-slate-700'}`}>
                {activeProject.versions?.length || 0}
              </span>
            </motion.button>
            
            <AnimatePresence>
              {showVersionControl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4">
                    <VersionControl
                      versions={activeProject.versions || []}
                      onSaveVersion={onSaveVersion}
                      onRevertToVersion={onRevertToVersion}
                      onDeleteVersion={onDeleteVersion}
                      disabled={disabled}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-eng-bg/80 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-eng-surface border border-eng-border rounded shadow-2xl w-full max-w-md relative z-10 overflow-hidden"
            >
              <div className="eng-header">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Initialize New Project</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-500 hover:text-white transition">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                  <label className="eng-label">Project Name</label>
                  <input
                    autoFocus
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full eng-input text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="eng-label">Project Description</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Briefly describe the engineering objective..."
                    className="w-full eng-input text-xs font-sans h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="flex-1 eng-button eng-button-primary justify-center text-[10px] uppercase tracking-widest"
                  >
                    Create Project
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 eng-button eng-button-secondary justify-center text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-eng-bg/80 backdrop-blur-sm"
              onClick={() => setShowDeleteConfirm(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-eng-surface border border-red-900/50 rounded p-6 max-w-sm w-full relative z-10 shadow-2xl"
            >
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Confirm Deletion</h3>
              <p className="text-xs text-slate-400 mb-6 font-sans">
                Are you sure you want to delete <span className="text-white font-bold">"{projects.find(p => p.id === showDeleteConfirm)?.name}"</span>? 
                This action is irreversible and will purge all associated data.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onDelete(showDeleteConfirm);
                    setShowDeleteConfirm(null);
                  }}
                  className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Confirm Purge
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                >
                  Abort
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Details Modal */}
      <AnimatePresence>
        {viewingProject && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setViewingProject(null)}
                  className="absolute inset-0 bg-eng-bg/80 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="bg-eng-surface border border-eng-border rounded shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative z-10" 
                  onClick={e => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-800/50">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{viewingProject.name}</h3>
                        <button onClick={() => setViewingProject(null)} className="text-slate-500 hover:text-white transition">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto space-y-6 text-slate-300 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4 text-[10px] font-mono uppercase tracking-widest">
                            <div className="bg-slate-900/50 p-3 rounded border border-eng-border/30">
                                <span className="block text-slate-500 mb-1">Created</span>
                                <span className="text-white">{new Date(viewingProject.createdAt).toLocaleString()}</span>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded border border-eng-border/30">
                                <span className="block text-slate-500 mb-1">Mode</span>
                                <span className="text-white">{viewingProject.generationMode}</span>
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Project Description</span>
                            <div className="bg-slate-900/50 p-4 rounded border border-eng-border/30 text-xs font-sans leading-relaxed">
                                {viewingProject.description || <span className="text-slate-600 italic">No description provided.</span>}
                            </div>
                        </div>

                        <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Engineering Request</span>
                            <div className="bg-slate-900/50 p-4 rounded border border-eng-border/30 text-xs whitespace-pre-wrap max-h-40 overflow-y-auto font-sans leading-relaxed">
                                {viewingProject.prompt || <span className="text-slate-600 italic">No prompt provided.</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <span className="text-[10px] font-mono text-eng-accent uppercase tracking-widest block mb-2">Active Agents ({viewingProject.selectedAgents.length})</span>
                                <div className="bg-slate-900/50 p-3 rounded border border-eng-border/30 h-40 overflow-y-auto custom-scrollbar">
                                    {viewingProject.selectedAgents.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {viewingProject.selectedAgents.map(agent => (
                                                <li key={agent} className="text-[11px] flex items-center gap-2 text-slate-300">
                                                    <span className="w-1 h-1 bg-eng-accent rounded-full"></span>
                                                    {agent}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-slate-600 text-[11px] italic">No agents selected.</p>}
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] font-mono text-eng-accent uppercase tracking-widest block mb-2">Uploaded Assets ({viewingProject.uploadedFiles.length})</span>
                                <div className="bg-slate-900/50 p-3 rounded border border-eng-border/30 h-40 overflow-y-auto custom-scrollbar">
                                    {viewingProject.uploadedFiles.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {viewingProject.uploadedFiles.map(file => (
                                                <li key={file.name} className="text-[11px] flex items-center gap-2 text-slate-300 truncate" title={file.name}>
                                                    <span className="w-1 h-1 bg-eng-accent rounded-full"></span>
                                                    {file.name}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : <p className="text-slate-600 text-[11px] italic">No files uploaded.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 border-t border-eng-border flex justify-end">
                        <button onClick={() => setViewingProject(null)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition font-bold text-[11px] uppercase tracking-widest">
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectManager;
