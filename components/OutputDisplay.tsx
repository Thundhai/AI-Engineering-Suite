
import React, { useState } from 'react';
import { EngineeringOutput } from '../types';
import { CopyIcon, CheckIcon, ErrorIcon, SpeakerIcon, PauseIcon, PlayIcon, DocsIcon, ChevronDownIcon, PrinterIcon } from './Icons';
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
    if (value === null || value === undefined) return <span className="text-slate-400 italic">N/A</span>;
    if (typeof value === 'boolean') {
        return value ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-eng-success-soft text-eng-success border border-eng-success/20">Yes</span>
        ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-eng-danger-soft text-eng-danger border border-eng-danger/20">No</span>
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
        <div className="overflow-x-auto rounded-md border border-eng-border">
            <table className="min-w-full divide-y divide-eng-border">
                <thead className="bg-slate-50">
                    <tr>
                        {allKeys.map(key => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-medium text-eng-muted">
                                {key.replace(/_/g, ' ')}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-eng-border">
                    {data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            {allKeys.map(key => (
                                <td key={key} className="px-4 py-2 text-sm text-eng-ink">
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
    if (data === null || data === undefined) return <span className="text-slate-400 italic">N/A</span>;
    if (typeof data !== 'object') return renderValue(data);

    if (Array.isArray(data)) {
        if (data.length === 0) return <span className="text-slate-400 italic">None</span>;

        if (data.every(i => typeof i === 'string' || typeof i === 'number' || typeof i === 'boolean')) {
             return (
                <ul className="space-y-1.5 ml-1">
                    {data.map((item, idx) => (
                      <li key={idx} className="text-sm text-eng-ink flex items-start gap-2">
                        <span className="w-1 h-1 bg-eng-accent rounded-full mt-2 shrink-0"></span>
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
                    <div key={idx} className="bg-slate-50 p-3 rounded-md border border-eng-border">
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
                    <span className="text-xs font-medium text-eng-accent block mb-1.5 border-b border-eng-border pb-1">
                        {key.replace(/_/g, ' ')}
                    </span>
                    <div className="text-sm text-eng-ink">
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
        <section className={`mb-6 eng-panel ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left focus:outline-none border-b border-eng-border"
            >
                <div>
                    <h3 className="text-sm font-semibold text-eng-navy flex items-center gap-3">
                        <span className={`w-1 h-4 bg-eng-accent rounded-full transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-40'}`}></span>
                        {title}
                    </h3>
                    {subtitle && <p className="text-xs text-eng-muted ml-4 mt-1">{subtitle}</p>}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-eng-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="p-6">
                    {children}
                </div>
            )}
        </section>
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
        <div className="eng-panel flex flex-col items-center justify-center h-full min-h-[500px]">
          <Spinner size="lg" />
          <p className="mt-6 text-sm font-medium text-eng-navy">Generating your report…</p>
          <p className="text-xs text-eng-muted mt-2">This can take up to a minute for complex requests.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="eng-panel flex flex-col items-center justify-center h-full p-8 min-h-[500px] border-eng-danger/30">
          <ErrorIcon className="w-10 h-10 text-eng-danger mb-4" />
          <h3 className="text-sm font-semibold text-eng-navy">Something went wrong</h3>
          <div className="mt-4 max-w-md w-full bg-eng-danger-soft border border-eng-danger/20 p-4 rounded-md text-sm text-eng-danger leading-relaxed">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 eng-button eng-button-secondary text-sm"
          >
            Reload
          </button>
        </div>
      );
    }

    if (!output) {
      return (
        <div className="eng-panel flex flex-col items-center justify-center h-full min-h-[500px]">
            <DocsIcon className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-sm font-semibold text-eng-navy">No report yet</h3>
            <p className="mt-1 text-sm text-eng-muted">Describe your request above and generate a report.</p>
        </div>
      );
    }

  return (
    <div className="eng-panel flex flex-col flex-grow min-h-[600px] h-full">
        <div className="eng-header sticky top-0 z-10 print:hidden">
            <div className="flex items-center gap-3">
                <DocsIcon className="w-4 h-4 text-eng-accent" />
                <h2 className="text-sm font-semibold text-eng-navy">Report</h2>
            </div>
            <div className="flex items-center gap-2">
                 <div className="bg-slate-100 rounded-md p-1 flex mr-2">
                    <button
                        onClick={() => setViewMode('report')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'report' ? 'bg-white text-eng-navy shadow-sm' : 'text-eng-muted hover:text-eng-ink'}`}
                    >
                        Report
                    </button>
                    <button
                        onClick={() => setViewMode('raw')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${viewMode === 'raw' ? 'bg-white text-eng-navy shadow-sm' : 'text-eng-muted hover:text-eng-ink'}`}
                    >
                        Raw JSON
                    </button>
                 </div>

                <div className="flex items-center gap-1 border-l border-eng-border pl-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 text-eng-muted hover:text-eng-navy transition-colors"
                    title="Print report"
                  >
                    <PrinterIcon className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onPlayPause(output.final_recommendation)}
                    disabled={audioState === 'generating' || !output.final_recommendation}
                    className="p-2 text-eng-accent hover:text-eng-navy transition-colors disabled:opacity-30"
                    title="Read summary aloud"
                  >
                    {renderPlayPauseIcon()}
                  </button>

                  <button
                    onClick={handleCopy}
                    className="p-2 text-eng-muted hover:text-eng-navy transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckIcon className="w-4 h-4 text-eng-success" /> : <CopyIcon className="w-4 h-4" />}
                  </button>
                </div>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-white custom-scrollbar">
            {viewMode === 'raw' ? (
                 <pre className="p-6 text-xs text-eng-ink font-mono whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(output, null, 2)}
                 </pre>
            ) : (
                <div id="engineering-report" className="p-8 max-w-5xl mx-auto space-y-8 print:bg-white print:text-black">

                    <div className="border-b border-eng-border pb-6 mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl font-semibold text-eng-navy tracking-tight">Technical Analysis Report</h1>
                            <p className="text-eng-muted text-sm mt-1">Generated by AI Engineering Suite</p>
                        </div>
                        <div className="text-right">
                             <span className="text-eng-muted text-xs">{new Date().toLocaleDateString()}</span>
                             {output.active_agents && (
                                <div className="mt-3 flex flex-wrap justify-end gap-1">
                                    {output.active_agents.slice(0, 4).map(agent => (
                                        <span key={agent} className="px-2 py-0.5 bg-slate-100 text-eng-muted text-xs rounded">
                                            {agent.replace(' Agent', '')}
                                        </span>
                                    ))}
                                    {output.active_agents.length > 4 && <span className="text-eng-muted text-xs self-center ml-1">+{output.active_agents.length - 4}</span>}
                                </div>
                             )}
                        </div>
                    </div>

                    <ReportSection title="Executive Summary" subtitle="Strategic overview and core recommendations">
                        <div className="bg-slate-50 p-6 rounded-md border-l-2 border-eng-accent text-eng-ink leading-relaxed whitespace-pre-wrap text-sm">
                            {output.final_recommendation}
                        </div>
                    </ReportSection>

                    {output.alphaearth_visualizations && output.alphaearth_visualizations.length > 0 && (
                        <ReportSection title="Geospatial Analysis" subtitle="Site and terrain visualization">
                             <AlphaEarthVisualizer visualizations={output.alphaearth_visualizations} />
                        </ReportSection>
                    )}

                    {output.engineering_output && Object.keys(output.engineering_output).length > 0 && (
                        <ReportSection title="Technical Specifications" subtitle="Calculations, analysis, and design parameters">
                            {renderData(output.engineering_output)}
                        </ReportSection>
                    )}

                    {output.bom && Object.keys(output.bom).length > 0 && (
                        <ReportSection title="Bill of Materials" subtitle="Quantities and logistics data">
                            {renderData(output.bom)}
                        </ReportSection>
                    )}

                     {((output.method_statement && Object.keys(output.method_statement).length > 0) || (output.risk_assessment && Object.keys(output.risk_assessment).length > 0)) && (
                        <ReportSection title="Execution Plan" subtitle="Method of work and safety framework">
                             <div className="space-y-8">
                                {output.method_statement && (
                                     <div>
                                        <h4 className="text-xs font-medium text-eng-muted mb-4 border-b border-eng-border pb-2">Method statement</h4>
                                        {renderData(output.method_statement)}
                                    </div>
                                )}
                                {output.risk_assessment && (
                                     <div>
                                        <h4 className="text-xs font-medium text-eng-danger mb-4 border-b border-eng-danger/20 pb-2">Risk assessment</h4>
                                        {renderData(output.risk_assessment)}
                                    </div>
                                )}
                             </div>
                        </ReportSection>
                    )}

                     {((output.compliance && Object.keys(output.compliance).length > 0) || (output.qa_qc && Object.keys(output.qa_qc).length > 0) || (output.hse && Object.keys(output.hse).length > 0)) && (
                        <ReportSection title="Compliance & Quality" subtitle="Standards, QA/QC, and HSE requirements">
                            <div className="space-y-8">
                                {output.compliance && (
                                    <div>
                                        <h4 className="text-xs font-medium text-eng-accent mb-4 border-b border-eng-border pb-2">Standards & codes</h4>
                                        {renderData(output.compliance)}
                                    </div>
                                )}
                                {output.qa_qc && (
                                    <div>
                                        <h4 className="text-xs font-medium text-eng-accent mb-4 border-b border-eng-border pb-2">Quality assurance</h4>
                                        {renderData(output.qa_qc)}
                                    </div>
                                )}
                                {output.hse && (
                                    <div>
                                        <h4 className="text-xs font-medium text-eng-accent mb-4 border-b border-eng-border pb-2">Health, safety & environment</h4>
                                        {renderData(output.hse)}
                                    </div>
                                )}
                            </div>
                        </ReportSection>
                    )}

                     {output.inputs_confirmed && Object.keys(output.inputs_confirmed).length > 0 && (
                        <ReportSection title="Basis of Design" subtitle="Confirmed inputs and assumptions" defaultOpen={false}>
                            {renderData(output.inputs_confirmed)}
                        </ReportSection>
                    )}

                    {(output.design_files || output.cad_scripts) && (
                         <ReportSection title="Generated Files" subtitle="Design files and CAD scripts" defaultOpen={false}>
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {output.design_files && Object.keys(output.design_files).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-medium text-eng-muted mb-3">Design files</h4>
                                        {renderData(output.design_files)}
                                    </div>
                                )}
                                {output.cad_scripts && Object.keys(output.cad_scripts).length > 0 && (
                                    <div>
                                        <h4 className="text-xs font-medium text-eng-muted mb-3">CAD scripts</h4>
                                        {renderData(output.cad_scripts)}
                                    </div>
                                )}
                             </div>
                         </ReportSection>
                    )}

                     <div className="text-center pt-10 border-t border-eng-border text-eng-muted text-xs mt-12">
                        <p>Generated by AI Engineering Suite. Review by a licensed engineer before use in design, construction, or safety decisions.</p>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default OutputDisplay;
