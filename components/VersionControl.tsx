import React, { useState } from 'react';
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
        <button
          onClick={() => setIsSaving(true)}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 eng-button-secondary eng-button text-sm"
        >
          <SaveIcon className="w-4 h-4" />
          Save current state as a version
        </button>
      ) : (
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            placeholder="Version name (e.g. Rev A)..."
            className="flex-grow eng-input text-sm"
            autoFocus
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !newVersionName.trim()}
            className="eng-button eng-button-primary text-sm px-3"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="eng-button eng-button-secondary text-sm px-3"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {versions.length === 0 ? (
          <p className="text-center py-6 text-sm text-eng-muted border border-dashed border-eng-border rounded-md">
            No saved versions yet
          </p>
        ) : (
          [...versions].reverse().map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between p-2 bg-white border border-eng-border rounded-md group hover:border-eng-accent transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-eng-ink">{version.name}</span>
                <span className="text-xs text-eng-muted">{new Date(version.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRevertToVersion(version)}
                  className="p-1.5 text-eng-accent hover:text-eng-navy transition-colors"
                  disabled={disabled}
                  title="Revert to this version"
                >
                  <RevertIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteVersion(version.id)}
                  className="p-1.5 text-eng-muted hover:text-eng-danger transition-colors"
                  disabled={disabled}
                  title="Delete version"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionControl;
