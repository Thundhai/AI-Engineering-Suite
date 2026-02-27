import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AGENTS } from '../constants';
import { Agent } from '../types';
import Spinner from './Spinner';
import { InfoIcon, CloseIcon, CheckIcon, PlusIcon } from './Icons';

interface AgentSelectorProps {
  selectedAgents: Set<string>;
  suggestedAgents: Set<string>;
  onAgentToggle: (agentName: string) => void;
  isDetecting: boolean;
  disabled: boolean;
}

const AgentCard: React.FC<{ 
  agent: Agent, 
  isSelected: boolean, 
  isSuggested: boolean, 
  onToggle: () => void, 
  onViewDetails: () => void,
  disabled: boolean 
}> = ({ agent, isSelected, isSuggested, onToggle, onViewDetails, disabled }) => {
  const IconComponent = agent.icon;

  return (
    <motion.div 
      whileHover={!disabled ? { scale: 1.02, borderColor: 'var(--color-eng-accent)' } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onViewDetails : undefined}
      className={`p-3 rounded border transition-all duration-200 h-full flex flex-col justify-between relative group text-left ${
        isSelected 
          ? 'bg-eng-accent/10 border-eng-accent shadow-lg shadow-eng-accent/5' 
          : isSuggested && !disabled
            ? 'bg-slate-800/50 border-dashed border-eng-accent/50 hover:bg-slate-800'
            : 'bg-slate-800/30 border-eng-border hover:bg-slate-800'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
            <div className={`p-1.5 rounded ${isSelected ? 'bg-eng-accent/20' : 'bg-slate-900/50'}`}>
              <IconComponent className={`w-5 h-5 ${isSelected ? 'text-eng-accent' : 'text-slate-400'}`} />
            </div>
            <div 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!disabled) onToggle(); 
              }}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${
                isSelected 
                  ? 'bg-eng-accent border-eng-accent text-eng-bg' 
                  : 'border-slate-600 hover:border-eng-accent bg-slate-900/50'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && <CheckIcon className="w-3 h-3" />}
            </div>
        </div>
        <h4 className="font-bold text-[11px] text-white uppercase tracking-wider">{agent.name.replace(' Agent', '')}</h4>
        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 font-sans">{agent.description}</p>
      </div>
      <div className={`mt-3 text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full self-start ${isSelected ? 'bg-eng-accent text-eng-bg' : 'bg-slate-700 text-slate-400'}`}>
        {agent.category}
      </div>
    </motion.div>
  );
};

const AgentSelector: React.FC<AgentSelectorProps> = ({ selectedAgents, suggestedAgents, onAgentToggle, isDetecting, disabled }) => {
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);

  const isViewingAgentSelected = viewingAgent ? selectedAgents.has(viewingAgent.name) : false;

  const handleModalToggle = () => {
    if (viewingAgent && !disabled) {
        onAgentToggle(viewingAgent.name);
    }
  };

  return (
    <>
        <div className={`eng-panel flex-grow transition-opacity ${disabled ? 'opacity-50' : 'opacity-100'}`}>
            <div className="eng-header">
                <h2 className="text-sm font-bold text-eng-accent uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-eng-accent rounded-full"></span>
                  02. Specialized Agents
                </h2>
                {isDetecting && !disabled && <Spinner size="sm" />}
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {AGENTS.map(agent => (
                  <AgentCard 
                      key={agent.name}
                      agent={agent}
                      isSelected={selectedAgents.has(agent.name)}
                      isSuggested={suggestedAgents.has(agent.name)}
                      onToggle={() => onAgentToggle(agent.name)}
                      onViewDetails={() => setViewingAgent(agent)}
                      disabled={disabled}
                  />
                  ))}
              </div>
            </div>
        </div>

        <AnimatePresence>
          {viewingAgent && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setViewingAgent(null)}
                    className="absolute inset-0 bg-eng-bg/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-eng-surface border border-eng-border rounded shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col relative z-10" 
                    onClick={e => e.stopPropagation()}
                  >
                      <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-800/50">
                          <div className="flex items-center gap-3">
                              <div className="bg-eng-accent/10 p-2 rounded border border-eng-accent/20">
                                {React.createElement(viewingAgent.icon, { className: "w-5 h-5 text-eng-accent" })}
                              </div>
                              <h3 className="text-sm font-bold text-white uppercase tracking-widest">{viewingAgent.name}</h3>
                          </div>
                          <button onClick={() => setViewingAgent(null)} className="text-slate-500 hover:text-white transition">
                              <CloseIcon className="w-5 h-5" />
                          </button>
                      </div>
                      <div className="p-6 overflow-y-auto space-y-6 text-slate-300 custom-scrollbar">
                          <div>
                              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] block mb-2">Agent Profile</span>
                              <p className="text-sm leading-relaxed">{viewingAgent.description}</p>
                          </div>
                          
                          {viewingAgent.details && (
                              <>
                                  <div>
                                      <span className="text-[10px] font-mono text-eng-accent uppercase tracking-[0.2em] block mb-3">Operational Use Cases</span>
                                      <ul className="space-y-2">
                                          {viewingAgent.details.useCases.map((useCase, idx) => (
                                              <li key={idx} className="text-xs flex items-start gap-2">
                                                <span className="w-1 h-1 bg-eng-accent rounded-full mt-1.5 shrink-0"></span>
                                                {useCase}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                                  <div>
                                      <span className="text-[10px] font-mono text-eng-warning uppercase tracking-[0.2em] block mb-3">Known Constraints</span>
                                      <ul className="space-y-2">
                                          {viewingAgent.details.limitations.map((limit, idx) => (
                                              <li key={idx} className="text-xs flex items-start gap-2 text-slate-400">
                                                <span className="w-1 h-1 bg-eng-warning rounded-full mt-1.5 shrink-0"></span>
                                                {limit}
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              </>
                          )}
                           
                          <div className="pt-2">
                               <span className="inline-block bg-slate-700 text-slate-300 text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full">{viewingAgent.category}</span>
                          </div>
                      </div>
                      <div className="p-4 bg-slate-800/50 border-t border-eng-border flex justify-between gap-3">
                          <motion.button 
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={handleModalToggle}
                              disabled={disabled}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition font-bold text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isViewingAgentSelected 
                                  ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800' 
                                  : 'bg-eng-accent hover:bg-cyan-300 text-eng-bg'
                              }`}
                          >
                              {isViewingAgentSelected ? (
                                  <>
                                      <CloseIcon className="w-4 h-4" />
                                      Deactivate Agent
                                  </>
                              ) : (
                                  <>
                                      <PlusIcon className="w-4 h-4" />
                                      Activate Agent
                                  </>
                              )}
                          </motion.button>
                          <button onClick={() => setViewingAgent(null)} className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition font-bold text-[11px] uppercase tracking-widest">
                              Dismiss
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
        </AnimatePresence>
    </>
  );
};

export default AgentSelector;