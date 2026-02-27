import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectVersion } from '../types';
import { SaveIcon, RevertIcon, TrashIcon } from './Icons';

interface VersionControlProps {
  versions: ProjectVersion[];
  onSaveVersion: (name: string) => void;
  onRevertToVersion: (version: ProjectVersion) => void;
  onDeleteVersion: (versionId: string) => void;
  disabled: boolean;
}

const VersionControl: React.FC<VersionControlProps> = ({ 
  versions, 
  onSaveVersion, 
  onRevertToVersion, 
  onDeleteVersion,
  disabled 
}) => {
  const [newVersionName, setNewVersionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (newVersionName.trim()) {
      onSaveVersion(newVersionName.trim());
      setNewVersionName('');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isSaving ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsSaving(true)}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-eng-accent border border-eng-accent/30 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all"
        >
          <SaveIcon className="w-4 h-4" />
          Snapshot Current State
        </motion.button>
      ) : (
        <motion.form 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSave} 
          className="flex gap-2"
        >
          <input
            type="text"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Version Label (e.g. Rev A)..."
            className="flex-grow bg-slate-900 border border-eng-accent/50 rounded px-3 py-2 text-[10px] text-white focus:outline-none font-mono"
            autoFocus
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !newVersionName.trim()}
            className="bg-eng-accent text-eng-bg px-3 rounded text-[10px] font-bold uppercase tracking-widest"
          >
            Commit
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="bg-slate-700 text-white px-3 rounded text-[10px] font-bold uppercase tracking-widest"
          >
            Cancel
          </button>
        </motion.form>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {versions.length === 0 ? (
          <p className="text-center py-6 text-[10px] font-mono text-slate-600 uppercase tracking-widest border border-dashed border-eng-border/30 rounded">
            No Snapshots Found
          </p>
        ) : (
          [...versions].reverse().map((version) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={version.id}
              className="flex items-center justify-between p-2 bg-slate-900/50 border border-eng-border/30 rounded group hover:border-eng-accent/50 transition-all"
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">{version.name}</span>
                <span className="text-[9px] font-mono text-slate-500">{new Date(version.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRevertToVersion(version)}
                  className="p-1.5 text-eng-accent hover:text-cyan-300 transition-colors"
                  disabled={disabled}
                  title="Revert to this version"
                >
                  <RevertIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteVersion(version.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                  disabled={disabled}
                  title="Delete version"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionControl;
