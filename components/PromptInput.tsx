

import React, { useRef } from 'react';
import { motion } from 'motion/react';
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
  onRemoveFile: (fileName: string) => void;
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
    <div className={`eng-panel transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
      <div className="eng-header">
        <h2 className="text-sm font-bold text-eng-accent uppercase tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-eng-accent rounded-full"></span>
          01. Engineering Request
        </h2>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDetectAgents}
          disabled={isDetectionDisabled || !prompt.trim()}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono py-1 px-3 rounded text-[10px] uppercase tracking-wider transition-colors"
        >
          {isDetecting ? (
            <>
              <Spinner size="sm" />
              Analyzing...
            </>
          ) : (
            <>
              <WandIcon className="w-3 h-3" />
              Detect Agents
            </>
          )}
        </motion.button>
      </div>
      
      <div className="p-4 space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your engineering project or request in detail..."
            className="w-full h-40 bg-slate-900/50 border border-eng-border rounded p-3 text-slate-200 focus:ring-1 focus:ring-eng-accent focus:outline-none transition-all resize-none font-sans text-sm leading-relaxed"
            disabled={isDisabled}
          />
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-600">
            {prompt.length} chars
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-eng-border/50">
              <div className="flex items-center gap-3">
                  <ShieldIcon className={`w-5 h-5 transition-colors ${isRedactionEnabled ? 'text-eng-success' : 'text-slate-600'}`} />
                  <div>
                      <h3 className="font-bold text-white text-[11px] uppercase tracking-wider">Secure Redaction</h3>
                      <p className="text-[10px] text-slate-500">Auto-strip sensitive data</p>
                  </div>
              </div>
              <button
                  role="switch"
                  aria-checked={isRedactionEnabled}
                  onClick={onRedactionToggle}
                  disabled={isDisabled}
                  className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-300 focus:outline-none disabled:opacity-50`}
              >
                  <span className={`${isRedactionEnabled ? 'bg-eng-success' : 'bg-slate-700'} absolute h-full w-full rounded-full`} />
                  <span className={`${isRedactionEnabled ? 'translate-x-5' : 'translate-x-1'} inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-300`} />
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
          <motion.button
            whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
            onClick={handleUploadClick}
            disabled={isDisabled}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-eng-border hover:border-eng-accent disabled:opacity-50 disabled:cursor-not-allowed text-slate-400 font-mono py-2 px-4 rounded text-[11px] uppercase tracking-widest transition-all"
          >
            <UploadIcon className="w-4 h-4" />
            Attach Technical Docs
          </motion.button>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-1">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">Attached Assets ({uploadedFiles.length})</h3>
              <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                {uploadedFiles.map(file => (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={file.name} 
                      className="flex items-center justify-between bg-slate-900/70 p-2 rounded border border-eng-border/30 text-[11px] font-mono"
                    >
                        <span className="text-slate-300 truncate pr-2" title={file.name}>{file.name}</span>
                        <button onClick={() => onRemoveFile(file.name)} disabled={isDisabled} className="text-slate-500 hover:text-red-400 transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </motion.div>
                ))}
              </div>
          </div>
        )}

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onGenerate}
          disabled={isDisabled || !prompt.trim()}
          className="w-full flex items-center justify-center gap-3 bg-eng-accent hover:bg-cyan-300 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-eng-bg font-bold py-3 px-4 rounded shadow-lg shadow-eng-accent/10 transition-all uppercase tracking-widest text-xs"
        >
          {isGenerating ? (
            <>
              <Spinner />
              Processing Request...
            </>
          ) : (
            <>
              <GenerateIcon className="w-5 h-5" />
              Initialize Engineering Core
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default PromptInput;
