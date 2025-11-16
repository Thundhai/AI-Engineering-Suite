
import React, { useState } from 'react';
import { Project } from '../types';
import { ProjectIcon, PlusIcon, TrashIcon, SaveIcon, CheckIcon } from './Icons';

interface ProjectManagerProps {
  projects: Project[];
  activeProjectId: string | null;
  onCreate: (name: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ projects, activeProjectId, onCreate, onSelect, onDelete, onSave }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreate(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };
  
  const handleSaveClick = () => {
    onSave();
    setSaveStatus('saved');
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const activeProjectName = projects.find(p => p.id === activeProjectId)?.name || 'No Active Project';

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ProjectIcon className="w-7 h-7 text-cyan-400" />
          <div>
            <h2 className="text-lg font-semibold text-cyan-400">Projects</h2>
            <p className="text-sm text-gray-300">Current: <span className="font-bold">{activeProjectName}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={handleSaveClick}
                disabled={!activeProjectId || saveStatus === 'saved'}
                className={`flex items-center gap-2 text-white font-bold py-2 px-3 rounded-md transition duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    saveStatus === 'saved'
                    ? 'bg-green-600'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
            >
                {saveStatus === 'saved' ? (
                <>
                    <CheckIcon className="w-5 h-5" />
                    Saved!
                </>
                ) : (
                <>
                    <SaveIcon className="w-5 h-5" />
                    Save Project
                </>
                )}
            </button>
            {!isCreating && (
            <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-3 rounded-md transition duration-300 text-sm"
            >
                <PlusIcon className="w-5 h-5" />
                New Project
            </button>
            )}
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-4 p-3 bg-gray-900/50 rounded-md">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter new project name..."
            className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            autoFocus
          />
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition">
            Create
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition">
            Cancel
          </button>
        </form>
      )}

      {projects.length > 0 ? (
        <div className="space-y-2">
            {projects.map(project => (
                <div key={project.id} 
                    className={`flex items-center justify-between p-3 rounded-md transition duration-200 cursor-pointer ${
                        activeProjectId === project.id 
                        ? 'bg-cyan-800/60 border border-cyan-500'
                        : 'bg-gray-900/70 border border-transparent hover:border-gray-600'
                    }`}
                    onClick={() => onSelect(project.id)}
                >
                    <div>
                        <p className="font-semibold text-white">{project.name}</p>
                        <p className="text-xs text-gray-400">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(project.id); }}
                        className="p-1 rounded-full hover:bg-red-900/50 text-red-400 hover:text-red-300"
                        aria-label={`Delete project ${project.name}`}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            ))}
        </div>
      ) : (
        !isCreating && <p className="text-center text-gray-500 py-4">No projects yet. Click "New Project" to start.</p>
      )}
    </div>
  );
};

export default ProjectManager;
