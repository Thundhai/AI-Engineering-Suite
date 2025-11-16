
import React, { useRef } from 'react';
import { GenerateIcon, UploadIcon, TrashIcon, ShieldIcon } from './Icons';
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
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onGenerate, isGenerating, uploadedFiles, onFileUpload, onRemoveFile, isRedactionEnabled, onRedactionToggle, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isDisabled = isGenerating || disabled;

  return (
    <div className={`bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
      <h2 className="text-lg font-semibold mb-3 text-cyan-400">1. Engineering Request</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Select or create a project to begin..."
        className="w-full h-40 bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-200 resize-none"
        disabled={isDisabled}
      />
      <div className="mt-4">
        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md mb-3">
            <div className="flex items-center gap-3">
                <ShieldIcon className={`w-6 h-6 transition-colors ${isRedactionEnabled ? 'text-green-400' : 'text-gray-500'}`} />
                <div>
                    <h3 className="font-semibold text-white text-sm">Enable Secure Redaction</h3>
                    <p className="text-xs text-gray-400">AI will ignore sensitive data in documents.</p>
                </div>
            </div>
            <button
                role="switch"
                aria-checked={isRedactionEnabled}
                onClick={onRedactionToggle}
                disabled={isDisabled}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50`}
            >
                <span className={`${isRedactionEnabled ? 'bg-green-500' : 'bg-gray-600'} absolute h-full w-full rounded-full`} />
                <span className={`${isRedactionEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300`} />
            </button>
        </div>

        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => onFileUpload(e.target.files)}
          disabled={isDisabled}
          aria-label="Upload files"
          accept="*/*"
        />
        <button
          onClick={handleUploadClick}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 font-bold py-2 px-4 rounded-md transition duration-300"
        >
          <UploadIcon className="w-5 h-5" />
          Upload Documents / Data (Any Type)
        </button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400">Attached Files:</h3>
            {uploadedFiles.map(file => (
                <div key={file.name} className="flex items-center justify-between bg-gray-900/70 p-2 rounded-md text-sm">
                    <span className="text-gray-200 truncate pr-2" title={file.name}>{file.name}</span>
                    <button onClick={() => onRemoveFile(file.name)} disabled={isDisabled} aria-label={`Remove ${file.name}`}>
                        <TrashIcon className="w-4 h-4 text-red-400 hover:text-red-300" />
                    </button>
                </div>
            ))}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={isDisabled || !prompt.trim()}
        className="mt-4 w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-300"
      >
        {isGenerating ? (
          <>
            <Spinner />
            Generating...
          </>
        ) : (
          <>
            <GenerateIcon className="w-5 h-5" />
            Generate Engineering Report
          </>
        )}
      </button>
    </div>
  );
};

export default PromptInput;
