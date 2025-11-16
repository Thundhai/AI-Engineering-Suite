
import React from 'react';
import { AGENTS } from '../constants';
import { Agent } from '../types';
import Spinner from './Spinner';

interface AgentSelectorProps {
  selectedAgents: Set<string>;
  suggestedAgents: Set<string>;
  onAgentToggle: (agentName: string) => void;
  isDetecting: boolean;
}

const AgentCard: React.FC<{ agent: Agent, isSelected: boolean, isSuggested: boolean, onToggle: () => void }> = ({ agent, isSelected, isSuggested, onToggle }) => {
  const baseClasses = "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 h-full flex flex-col justify-between";
  const selectedClasses = "bg-cyan-800/50 border-cyan-500 shadow-lg shadow-cyan-900/50";
  const suggestedClasses = "border-dashed border-cyan-400";
  const defaultClasses = "bg-gray-800/70 border-gray-700 hover:border-cyan-600 hover:bg-gray-700/50";

  let finalClasses = `${baseClasses} `;
  if (isSelected) {
    finalClasses += selectedClasses;
  } else if (isSuggested) {
    finalClasses += `${suggestedClasses} ${defaultClasses}`;
  }
  else {
    finalClasses += defaultClasses;
  }

  return (
    <div className={finalClasses} onClick={onToggle}>
      <div>
        <h4 className="font-bold text-sm text-white">{agent.name.replace(' Agent', '')}</h4>
        <p className="text-xs text-gray-400 mt-1">{agent.description}</p>
      </div>
      <div className={`mt-2 text-xs font-semibold px-2 py-0.5 rounded-full self-start ${isSelected ? 'bg-cyan-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
        {agent.category}
      </div>
    </div>
  );
};

const AgentSelector: React.FC<AgentSelectorProps> = ({ selectedAgents, suggestedAgents, onAgentToggle, isDetecting }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 flex-grow">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold text-cyan-400">2. Select Agents</h2>
        {isDetecting && <Spinner />}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {AGENTS.map(agent => (
          <AgentCard 
            key={agent.name}
            agent={agent}
            isSelected={selectedAgents.has(agent.name)}
            isSuggested={suggestedAgents.has(agent.name)}
            onToggle={() => onAgentToggle(agent.name)}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentSelector;
