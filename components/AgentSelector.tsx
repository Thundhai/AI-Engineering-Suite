import React, { useState } from 'react';
import { AGENTS } from '../constants';
import { Agent } from '../types';
import Spinner from './Spinner';
import { CloseIcon, CheckIcon, PlusIcon } from './Icons';

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
    <div
      onClick={!disabled ? onViewDetails : undefined}
      className={`p-3 rounded-md border transition-colors duration-150 h-full flex flex-col justify-between relative group text-left ${
        isSelected
          ? 'bg-eng-accent-soft border-eng-accent'
          : isSuggested && !disabled
            ? 'bg-white border-dashed border-eng-accent/60 hover:bg-slate-50'
            : 'bg-white border-eng-border hover:border-slate-300'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className={`p-1.5 rounded-md ${isSelected ? 'bg-eng-accent/15' : 'bg-slate-100'}`}>
            <IconComponent className={`w-5 h-5 ${isSelected ? 'text-eng-accent' : 'text-eng-muted'}`} />
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onToggle();
            }}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors duration-150 ${
              isSelected
                ? 'bg-eng-accent border-eng-accent text-white'
                : 'border-slate-300 hover:border-eng-accent bg-white'
            } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {isSelected && <CheckIcon className="w-3 h-3" />}
          </div>
        </div>
        <h4 className="font-medium text-sm text-eng-ink">{agent.name.replace(' Agent', '')}</h4>
        <p className="text-xs text-eng-muted mt-1 line-clamp-2">{agent.description}</p>
      </div>
      <div className={`mt-3 text-[11px] font-medium px-2 py-0.5 rounded-full self-start ${isSelected ? 'bg-eng-accent text-white' : 'bg-slate-100 text-eng-muted'}`}>
        {agent.category}
      </div>
    </div>
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
      <div className={`eng-panel flex-grow transition-opacity ${disabled ? 'opacity-60' : 'opacity-100'}`}>
        <div className="eng-header">
          <h2 className="text-sm font-semibold text-eng-navy">Specialized agents</h2>
          {isDetecting && !disabled && <Spinner size="sm" />}
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
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

      {viewingAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            onClick={() => setViewingAgent(null)}
            className="absolute inset-0 bg-eng-navy/30 backdrop-blur-sm"
          />
          <div className="bg-white border border-eng-border rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col relative z-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-eng-border bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-eng-accent-soft p-2 rounded-md border border-eng-accent/20">
                  {React.createElement(viewingAgent.icon, { className: "w-5 h-5 text-eng-accent" })}
                </div>
                <h3 className="text-sm font-semibold text-eng-navy">{viewingAgent.name}</h3>
              </div>
              <button onClick={() => setViewingAgent(null)} className="text-eng-muted hover:text-eng-navy transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-eng-ink custom-scrollbar">
              <div>
                <span className="text-xs font-medium text-eng-muted block mb-2">Overview</span>
                <p className="text-sm leading-relaxed">{viewingAgent.description}</p>
              </div>

              {viewingAgent.details && (
                <>
                  <div>
                    <span className="text-xs font-medium text-eng-accent block mb-3">What it's used for</span>
                    <ul className="space-y-2">
                      {viewingAgent.details.useCases.map((useCase, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="w-1 h-1 bg-eng-accent rounded-full mt-1.5 shrink-0"></span>
                          {useCase}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-eng-warning block mb-3">Known limitations</span>
                    <ul className="space-y-2">
                      {viewingAgent.details.limitations.map((limit, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2 text-eng-muted">
                          <span className="w-1 h-1 bg-eng-warning rounded-full mt-1.5 shrink-0"></span>
                          {limit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <div className="pt-2">
                <span className="inline-block bg-slate-100 text-eng-muted text-xs font-medium px-3 py-1 rounded-full">{viewingAgent.category}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-eng-border flex justify-between gap-3">
              <button
                onClick={handleModalToggle}
                disabled={disabled}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isViewingAgentSelected
                    ? 'bg-eng-danger-soft hover:bg-red-100 text-eng-danger border border-eng-danger/20'
                    : 'bg-eng-navy hover:bg-eng-navy-soft text-white'
                }`}
              >
                {isViewingAgentSelected ? (
                  <>
                    <CloseIcon className="w-4 h-4" />
                    Remove agent
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Add agent
                  </>
                )}
              </button>
              <button onClick={() => setViewingAgent(null)} className="px-6 py-2 eng-button-secondary eng-button text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AgentSelector;
