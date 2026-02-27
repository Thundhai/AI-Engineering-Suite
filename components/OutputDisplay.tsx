
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EngineeringOutput } from '../types';
import { CopyIcon, CheckIcon, ErrorIcon, SpeakerIcon, PauseIcon, PlayIcon, DocsIcon, FileCodeIcon, ChevronDownIcon, PrinterIcon } from './Icons';
import Spinner from './Spinner';
import AlphaEarthVisualizer from './AlphaEarthVisualizer';

type AudioState = 'idle' | 'generating' | 'playing' | 'paused';

interface OutputDisplayProps {
  output: EngineeringOutput | null;
  error: string | null;
  isGenerating: boolean;
  onPlayPause: (text: string) => void;
  audioState: AudioState;
}

const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-slate-600 italic">N/A</span>;
    if (typeof value === 'boolean') {
        return value ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-eng-success/10 text-eng-success border border-eng-success/20">True</span>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-red-900/10 text-red-400 border border-red-900/20">False</span>
        );
    }
    if (typeof value === 'object') return renderData(value);
    return <span>{String(value)}</span>;
}

const isTableData = (data: any[]): boolean => {
    if (data.length === 0) return false;
    if (typeof data[0] !== 'object' || data[0] === null) return false;
    const keys = Object.keys(data[0]);
    if (keys.length === 0 || keys.length > 6) return false;
    return data.every(item => typeof item === 'object' && item !== null);
};

const TableRenderer = ({ data }: { data: any[] }) => {
    const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
    
    return (
        <div className="overflow-x-auto rounded border border-eng-border bg-slate-900/30">
            <table className="min-w-full divide-y divide-eng-border">
                <thead className="bg-slate-800/50">
                    <tr>
                        {allKeys.map(key => (
                            <th key={key} className="px-4 py-2 text-left text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                {key.replace(/_/g, ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-eng-border">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-eng-accent/5 transition-colors">
                            {allKeys.map(key => (
                                <td key={key} className="px-4 py-2 text-[11px] text-slate-300 font-sans">
                                    {renderValue(row[key])}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const renderData = (data: any, level = 0): React.ReactNode => {
    if (data === null || data === undefined) return <span className="text-slate-600 italic">N/A</span>;
    if (typeof data !== 'object') return renderValue(data);

    if (Array.isArray(data)) {
        if (data.length === 0) return <span className="text-slate-600 italic">None</span>;
        
        if (data.every(i => typeof i === 'string' || typeof i === 'number' || typeof i === 'boolean')) {
             return (
                <ul className="space-y-1.5 ml-1">
                    {data.map((item, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="w-1 h-1 bg-eng-accent/50 rounded-full mt-1.5 shrink-0"></span>
                        {item}
                      </li>
                    ))}
                </ul>
            );
        }

        if (isTableData(data)) {
            return <TableRenderer data={data} />;
        }

        return (
             <div className="space-y-3">
                {data.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/20 p-3 rounded border border-eng-border/30">
                        {renderData(item, level + 1)}
                    </div>
                ))}
             </div>
        );
    }

    return (
        <div className={`grid grid-cols-1 ${level === 0 ? 'lg:grid-cols-2' : ''} gap-x-6 gap-y-4`}>
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="break-inside-avoid">
                    <span className="text-[9px] font-mono text-eng-accent/70 uppercase tracking-[0.2em] block mb-1.5 border-b border-eng-border/30 pb-1">
                        {key.replace(/_/g, ' ')}
                    </span>
                    <div className="text-[11px] text-slate-300">
                        {renderData(value, level + 1)}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ReportSection: React.FC<{ title: string, subtitle?: string, children: React.ReactNode, className?: string, defaultOpen?: boolean }> = ({ title, subtitle, children, className = "", defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 eng-panel ${className}`}
        >
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 transition-all text-left focus:outline-none border-b border-eng-border"
            >
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                        <span className={`w-1 h-4 bg-eng-accent rounded-full transition-all duration-300 ${isOpen ? 'scale-y-100' : 'scale-y-50 opacity-50'}`}></span>
                        {title}
                    </h3>
                    {subtitle && <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider ml-4 mt-1">{subtitle}</p>}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {isOpen && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-slate-900/20">
                        {children}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
        </motion.section>
    );
};

const OutputDisplay: React.FC<OutputDisplayProps> = ({ output, error, isGenerating, onPlayPause, audioState }) => {
  const [viewMode, setViewMode] = useState<'report' | 'raw'>('report');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!output) return;
    const textToCopy = viewMode === 'raw' 
        ? JSON.stringify(output, null, 2)
        : document.getElementById('engineering-report')?.innerText || "";
        
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
      window.print();
  };

  const renderPlayPauseIcon = () => {
    switch (audioState) {
      case 'generating': return <Spinner size="sm" />;
      case 'playing': return <PauseIcon className="w-4 h-4" />;
      case 'paused': return <PlayIcon className="w-4 h-4" />;
      case 'idle': default: return <SpeakerIcon className="w-4 h-4" />;
    }
  };
  
  if (isGenerating) {
      return (
        <div className="eng-panel flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-900/50">
          <div className="relative">
            <div className="absolute inset-0 bg-eng-accent/20 blur-2xl rounded-full animate-pulse"></div>
            <Spinner size="lg" />
          </div>
          <p className="mt-6 text-sm font-bold text-eng-accent uppercase tracking-[0.3em] animate-pulse">Compiling Engineering Intelligence</p>
          <p className="text-[10px] font-mono text-slate-500 mt-2 uppercase tracking-widest">Synchronizing agents // Processing neural output</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="eng-panel flex flex-col items-center justify-center h-full p-8 min-h-[500px] border-red-900/50">
          <ErrorIcon className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em]">Core Execution Failure</h3>
          <div className="mt-4 max-w-md w-full bg-red-900/10 border border-red-900/30 p-4 rounded text-xs text-red-400 font-mono leading-relaxed">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono uppercase tracking-widest transition-colors"
          >
            Reset System
          </button>
        </div>
      );
    }
    
    if (!output) {
      return (
        <div className="eng-panel flex flex-col items-center justify-center h-full min-h-[500px] bg-slate-900/20 group">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-eng-accent/5 blur-xl rounded-full group-hover:bg-eng-accent/10 transition-all duration-500"></div>
              <DocsIcon className="w-16 h-16 text-slate-800 group-hover:text-slate-700 transition-colors duration-500" />
            </div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Awaiting Initialization</h3>
            <p className="mt-2 text-[10px] font-mono text-slate-600 uppercase tracking-widest">Select a project to begin analysis</p>
        </div>
      );
    }

  return (
    <div className="eng-panel flex flex-col flex-grow min-h-[600px] h-full">
        {/* Toolbar */}
        <div className="eng-header sticky top-0 z-10 print:hidden">
            <div className="flex items-center gap-3">
                <DocsIcon className="w-4 h-4 text-eng-accent" />
                <h2 className="text-[11px] font-bold text-white uppercase tracking-[0.2em]">
                  Analysis Output // <span className="text-slate-500">Report_Gen_01</span>
                </h2>
            </div>
            <div className="flex items-center gap-2">
                 <div className="bg-slate-900 rounded p-1 flex mr-2 border border-eng-border">
                    <button
                        onClick={() => setViewMode('report')}
                        className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all ${viewMode === 'report' ? 'bg-eng-accent text-eng-bg font-bold' : 'text-slate-500 hover:text-white'}`}
                    >
                        Report
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${viewMode === 'raw' ? 'bg-eng-accent text-eng-bg font-bold' : 'text-slate-500 hover:text-white'}`}
                    >
                        Raw_JSON
                    </button>
                 </div>
                 
                <div className="flex items-center gap-1 border-l border-eng-border pl-2">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrint}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                    title="Print Report"
                  >
                    <PrinterIcon className="w-4 h-4" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onPlayPause(output.final_recommendation)} 
                    disabled={audioState === 'generating' || !output.final_recommendation}
                    className="p-2 text-eng-accent hover:text-cyan-300 transition-colors disabled:opacity-30"
                    title="Read Summary Aloud"
                  >
                    {renderPlayPauseIcon()}
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopy} 
                    className="p-2 text-slate-400 hover:text-white transition-colors" 
                    title="Copy to Clipboard"
                  >
                    {copied ? <CheckIcon className="w-4 h-4 text-eng-success" /> : <CopyIcon className="w-4 h-4" />}
                  </motion.button>
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto bg-slate-900/50 custom-scrollbar">
            {viewMode === 'raw' ? (
                 <pre className="p-6 text-[11px] text-eng-accent font-mono whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(output, null, 2)}
                 </pre>
            ) : (
                <div id="engineering-report" className="p-8 max-w-5xl mx-auto space-y-8 min-h-screen print:bg-white print:text-black">
                    
                    {/* Document Header */}
                    <div className="border-b border-eng-border pb-6 mb-8 flex justify-between items-end print:border-black">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight print:text-black uppercase">Technical Analysis Report</h1>
                            <p className="text-eng-accent font-mono text-[10px] mt-2 print:text-gray-600 uppercase tracking-[0.3em]">Autonomous Engineering Intelligence Output</p>
                        </div>
                        <div className="text-right font-mono">
                             <div className="flex flex-col gap-1">
                                <span className="text-slate-500 text-[10px] uppercase print:text-gray-600">Timestamp: {new Date().toLocaleDateString()}</span>
                                <span className="text-slate-600 text-[9px] uppercase print:text-gray-500">ID: {Math.random().toString(36).substring(2, 12).toUpperCase()}</span>
                             </div>
                             {output.active_agents && (
                                <div className="mt-3 flex flex-wrap justify-end gap-1">
                                    {output.active_agents.slice(0, 4).map(agent => (
                                        <span key={agent} className="px-2 py-0.5 bg-slate-800 border border-eng-border text-slate-400 text-[9px] font-mono uppercase rounded print:border-gray-300 print:bg-gray-100 print:text-gray-800">
                                            {agent.replace(' Agent', '')}
                                        </span>
                                    ))}
                                    {output.active_agents.length > 4 && <span className="text-slate-600 text-[9px] self-center ml-1">+{output.active_agents.length - 4}</span>}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* 1. Executive Summary */}
                    <ReportSection title="Executive Summary" subtitle="Strategic Overview & Core Recommendations">
                        <div className="bg-slate-800/30 p-6 rounded border-l-2 border-eng-accent text-slate-300 leading-relaxed whitespace-pre-wrap text-sm print:bg-gray-50 print:text-black print:border-black">
                            {output.final_recommendation}
                        </div>
                    </ReportSection>

                    {/* 2. Geospatial Analysis */}
                    {output.alphaearth_visualizations && output.alphaearth_visualizations.length > 0 && (
                        <ReportSection title="Geospatial Intelligence" subtitle="AlphaEarth™ Foundation Model Visualization">
                             <AlphaEarthVisualizer visualizations={output.alphaearth_visualizations} />
                        </ReportSection>
                    )}

                    {/* 3. Engineering Design Report */}
                    {output.engineering_output && Object.keys(output.engineering_output).length > 0 && (
                        <ReportSection title="Technical Specifications" subtitle="Calculations, Analysis & Design Parameters">
                            {renderData(output.engineering_output)}
                        </ReportSection>
                    )}

                    {/* 4. Bill of Materials (BOM) Report */}
                    {output.bom && Object.keys(output.bom).length > 0 && (
                        <ReportSection title="Material Inventory" subtitle="Quantity Take-offs & Logistics Data">
                            {renderData(output.bom)}
                        </ReportSection>
                    )}

                    {/* 5. Construction & Methodology */}
                     {((output.method_statement && Object.keys(output.method_statement).length > 0) || (output.risk_assessment && Object.keys(output.risk_assessment).length > 0)) && (
                        <ReportSection title="Operational Protocol" subtitle="Execution Strategy & Safety Framework">
                             <div className="space-y-8">
                                {output.method_statement && (
                                     <div>
                                        <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-4 border-b border-eng-border pb-2 print:text-black print:border-gray-300">Method Statement</h4>
                                        {renderData(output.method_statement)}
                                    </div>
                                )}
                                {output.risk_assessment && (
                                     <div>
                                        <h4 className="font-mono text-[10px] text-red-400 uppercase tracking-widest mb-4 border-b border-red-900/20 pb-2 print:text-red-700 print:border-red-200">Risk Mitigation Matrix</h4>
                                        {renderData(output.risk_assessment)}
                                    </div>
                                )}
                             </div>
                        </ReportSection>
                    )}

                    {/* 6. Compliance & QA/QC */}
                     {((output.compliance && Object.keys(output.compliance).length > 0) || (output.qa_qc && Object.keys(output.qa_qc).length > 0) || (output.hse && Object.keys(output.hse).length > 0)) && (
                        <ReportSection title="Regulatory & Quality" subtitle="Standards Adherence & Assurance Protocols">
                            <div className="space-y-8">
                                {output.compliance && (
                                    <div>
                                        <h4 className="font-mono text-[10px] text-eng-accent uppercase tracking-widest mb-4 border-b border-eng-border pb-2 print:text-black">Standards & Codes</h4>
                                        {renderData(output.compliance)}
                                    </div>
                                )}
                                {output.qa_qc && (
                                    <div>
                                        <h4 className="font-mono text-[10px] text-eng-accent uppercase tracking-widest mb-4 border-b border-eng-border pb-2 print:text-black">Quality Assurance (QA/QC)</h4>
                                        {renderData(output.qa_qc)}
                                    </div>
                                )}
                                {output.hse && (
                                    <div>
                                        <h4 className="font-mono text-[10px] text-eng-accent uppercase tracking-widest mb-4 border-b border-eng-border pb-2 print:text-black">HSE Requirements</h4>
                                        {renderData(output.hse)}
                                    </div>
                                )}
                            </div>
                        </ReportSection>
                    )}

                    {/* 7. Design Inputs */}
                     {output.inputs_confirmed && Object.keys(output.inputs_confirmed).length > 0 && (
                        <ReportSection title="Basis of Design" subtitle="Validated Parameters & Initial Assumptions" defaultOpen={false}>
                            {renderData(output.inputs_confirmed)}
                        </ReportSection>
                    )}

                    {/* 8. Automation Assets */}
                    {(output.design_files || output.cad_scripts) && (
                         <ReportSection title="Automation Assets" subtitle="Generated Scripts & Digital Twins" defaultOpen={false}>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {output.design_files && Object.keys(output.design_files).length > 0 && (
                                    <div>
                                        <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3 print:text-black">Design Files</h4>
                                        {renderData(output.design_files)}
                                    </div>
                                )}
                                {output.cad_scripts && Object.keys(output.cad_scripts).length > 0 && (
                                    <div>
                                        <h4 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest mb-3 print:text-black">CAD Scripts</h4>
                                        {renderData(output.cad_scripts)}
                                    </div>
                                )}
                             </div>
                         </ReportSection>
                    )}

                    {/* Footer */}
                     <div className="text-center pt-10 border-t border-eng-border text-slate-600 font-mono text-[9px] mt-12 print:border-gray-300 print:text-gray-400 uppercase tracking-[0.2em]">
                        <p>End of Transmission // AI Engineering Suite // Confidential Technical Data</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default OutputDisplay;
