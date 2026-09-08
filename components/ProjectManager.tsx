import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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
    <div className={`eng-panel flex flex-col h-full transition-opacity ${disabled ? 'opacity-60' : 'opacity-100'}`}>
      <div className="eng-header">
        <h2 className="text-sm font-semibold text-eng-navy">Projects</h2>
      </div>

      <div className="p-4 flex flex-col h-full space-y-4">
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={disabled}
          className="w-full eng-button eng-button-primary justify-center text-sm"
        >
          <PlusIcon className="w-4 h-4" />
          New project
        </button>

        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-eng-border rounded-md">
              <FolderIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-eng-muted">No projects yet</p>
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center justify-between p-2 rounded-md border transition-colors duration-150 ${
                  activeProjectId === project.id
                    ? 'bg-eng-accent-soft border-eng-accent text-eng-navy'
                    : 'bg-white border-eng-border hover:bg-slate-50 text-eng-ink'
                }`}
              >
                <button
                  onClick={() => onSelect(project.id)}
                  className="flex-grow flex items-center gap-3 text-left focus:outline-none"
                  disabled={disabled}
                >
                  <FolderIcon className={`w-4 h-4 ${activeProjectId === project.id ? 'text-eng-accent' : 'text-eng-muted'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[140px]">{project.name}</span>
                    <span className="text-xs text-eng-muted">{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setViewingProject(project); }}
                    className="p-1.5 text-eng-muted hover:text-eng-accent transition-colors"
                    disabled={disabled}
                    title="View details"
                  >
                    <EyeIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(project.id); }}
                    className="p-1.5 text-eng-muted hover:text-eng-danger transition-colors"
                    disabled={disabled}
                    title="Delete project"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {activeProject && (
          <div className="pt-4 border-t border-eng-border">
            <button
              onClick={() => setShowVersionControl(!showVersionControl)}
              className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors duration-150 ${
                showVersionControl ? 'bg-eng-navy text-white border-eng-navy' : 'bg-white border-eng-border text-eng-ink hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Version history</span>
              </div>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${showVersionControl ? 'bg-white/20' : 'bg-slate-100'}`}>
                {activeProject.versions?.length || 0}
              </span>
            </button>

            <AnimatePresence>
              {showVersionControl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
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
      {showCreateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-eng-navy/30 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="bg-white border border-eng-border rounded-lg shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
            <div className="eng-header">
              <h3 className="text-sm font-semibold text-eng-navy">New project</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-eng-muted hover:text-eng-navy transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="eng-label">Project name</label>
                <input
                  autoFocus
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter a project name..."
                  className="w-full eng-input text-sm"
                  required
                />
              </div>
              <div>
                <label className="eng-label">Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Briefly describe the objective..."
                  className="w-full eng-input text-sm h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="flex-1 eng-button eng-button-primary justify-center text-sm"
                >
                  Create project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 eng-button eng-button-secondary justify-center text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-eng-navy/30 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="bg-white border border-eng-border rounded-lg p-6 max-w-sm w-full relative z-10 shadow-2xl">
            <h3 className="text-sm font-semibold text-eng-navy mb-2">Delete this project?</h3>
            <p className="text-sm text-eng-muted mb-6">
              <span className="text-eng-ink font-medium">"{projects.find(p => p.id === showDeleteConfirm)?.name}"</span> and
              all of its reports, files, and history will be permanently deleted. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  onDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 bg-eng-danger-soft hover:bg-red-100 text-eng-danger border border-eng-danger/20 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 eng-button-secondary eng-button justify-center text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {viewingProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            onClick={() => setViewingProject(null)}
            className="absolute inset-0 bg-eng-navy/30 backdrop-blur-sm"
          />
          <div
            className="bg-white border border-eng-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-50">
              <h3 className="text-sm font-semibold text-eng-navy">{viewingProject.name}</h3>
              <button onClick={() => setViewingProject(null)} className="text-eng-muted hover:text-eng-navy transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-eng-ink custom-scrollbar">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 p-3 rounded-md border border-eng-border">
                  <span className="block text-xs text-eng-muted mb-1">Created</span>
                  <span className="text-eng-ink">{new Date(viewingProject.createdAt).toLocaleString()}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-eng-border">
                  <span className="block text-xs text-eng-muted mb-1">Report depth</span>
                  <span className="text-eng-ink">{viewingProject.generationMode}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-eng-muted block mb-2">Description</span>
                <div className="bg-slate-50 p-4 rounded-md border border-eng-border text-sm leading-relaxed">
                  {viewingProject.description || <span className="text-slate-400 italic">No description provided.</span>}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-eng-muted block mb-2">Engineering request</span>
                <div className="bg-slate-50 p-4 rounded-md border border-eng-border text-sm whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                  {viewingProject.prompt || <span className="text-slate-400 italic">No prompt provided.</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs font-medium text-eng-accent block mb-2">Active agents ({viewingProject.selectedAgents.length})</span>
                  <div className="bg-slate-50 p-3 rounded-md border border-eng-border h-40 overflow-y-auto custom-scrollbar">
                    {viewingProject.selectedAgents.length > 0 ? (
                      <ul className="space-y-1.5">
                        {viewingProject.selectedAgents.map(agent => (
                          <li key={agent} className="text-sm flex items-center gap-2 text-eng-ink">
                            <span className="w-1 h-1 bg-eng-accent rounded-full"></span>
                            {agent}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-slate-400 text-sm italic">No agents selected.</p>}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-eng-accent block mb-2">Attached files ({viewingProject.uploadedFiles.length})</span>
                  <div className="bg-slate-50 p-3 rounded-md border border-eng-border h-40 overflow-y-auto custom-scrollbar">
                    {viewingProject.uploadedFiles.length > 0 ? (
                      <ul className="space-y-1.5">
                        {viewingProject.uploadedFiles.map(file => (
                          <li key={file.id} className="text-sm flex items-center gap-2 text-eng-ink truncate" title={file.name}>
                            <span className="w-1 h-1 bg-eng-accent rounded-full"></span>
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-slate-400 text-sm italic">No files uploaded.</p>}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-eng-border flex justify-end">
              <button onClick={() => setViewingProject(null)} className="px-6 py-2 eng-button-secondary eng-button text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
