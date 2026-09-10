
import React, { useRef } from 'react';
import { GenerateIcon, UploadIcon, TrashIcon, ShieldIcon, WandIcon } from './Icons';
import Spinner from './Spinner';
import { UploadedFile } from '../types';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  uploadedFiles: UploadedFile[];
  onFileUpload: (files: FileList | null) => void;
  onRemoveFile: (fileId: string) => void;
  isRedactionEnabled: boolean;
  onRedactionToggle: () => void;
  disabled: boolean;
  onDetectAgents: () => void;
  isDetecting: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isGenerating, uploadedFiles, onFileUpload, onRemoveFile, isRedactionEnabled, onRedactionToggle, disabled, onDetectAgents, isDetecting }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isDisabled = isGenerating || disabled;
  const isDetectionDisabled = isDisabled || isDetecting;

  return (
    <div className={`eng-panel transition-opacity ${disabled ? 'opacity-60' : 'opacity-100'}`}>
      <div className="eng-header">
        <h2 className="text-sm font-semibold text-eng-navy">Engineering request</h2>
        <button
          onClick={onDetectAgents}
          disabled={isDetectionDisabled || !prompt.trim()}
          className="flex items-center gap-2 eng-button-secondary eng-button py-1.5 text-xs"
        >
          {isDetecting ? (
            <>
              <Spinner size="sm" />
              Analyzing…
            </>
          ) : (
            <>
              <WandIcon className="w-3.5 h-3.5" />
              Suggest agents
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your engineering project or request in detail..."
            className="w-full h-40 eng-input resize-none text-sm leading-relaxed"
            disabled={isDisabled}
          />
          <div className="absolute bottom-2 right-3 text-xs text-slate-400">
            {prompt.length} chars
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md border border-eng-border">
            <div className="flex items-center gap-3">
              <ShieldIcon className={`w-5 h-5 transition-colors ${isRedactionEnabled ? 'text-eng-success' : 'text-slate-400'}`} />
              <div>
                <h3 className="font-medium text-eng-ink text-sm">Redact sensitive details</h3>
                <p className="text-xs text-eng-muted">Ask the AI to leave names, companies, and IDs out of its response</p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={isRedactionEnabled}
              onClick={onRedactionToggle}
              disabled={isDisabled}
              className="relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-200 focus:outline-none disabled:opacity-50"
            >
              <span className={`${isRedactionEnabled ? 'bg-eng-success' : 'bg-slate-300'} absolute h-full w-full rounded-full transition-colors`} />
              <span className={`${isRedactionEnabled ? 'translate-x-5' : 'translate-x-1'} inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-200`} />
            </button>
          </div>

          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => onFileUpload(e.target.files)}
            disabled={isDisabled}
            accept="*/*"
          />
          <button
            onClick={handleUploadClick}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-eng-border hover:border-eng-accent disabled:opacity-50 disabled:cursor-not-allowed text-eng-muted font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            <UploadIcon className="w-4 h-4" />
            Attach technical documents
          </button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-eng-muted mb-2">Attached ({uploadedFiles.length})</h3>
            <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-eng-border text-sm"
                >
                  <span className="text-eng-ink truncate pr-2" title={file.name}>{file.name}</span>
                  <button onClick={() => onRemoveFile(file.id)} disabled={isDisabled} className="text-slate-400 hover:text-eng-danger transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={isDisabled || !prompt.trim()}
          className="w-full eng-button eng-button-primary justify-center py-3 text-sm"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" />
              Generating…
            </>
          ) : (
            <>
              <GenerateIcon className="w-5 h-5" />
              Generate report
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PromptInput;
