import { Agent } from './types';

export const AGENTS: Agent[] = [
    { name: 'Civil Engineering Agent', description: 'Roads, earthworks, foundations, drainage, hydrology, concrete design.', category: 'Engineering' },
    { name: 'Structural Engineering Agent', description: 'RC/steel/timber design, frames, load combinations, reinforcement schedules.', category: 'Engineering' },
    { name: 'Mechanical Engineering Agent', description: 'Pumps, HVAC, ducts, vessels, piping, pressure drops, fire pumps, tank design.', category: 'Engineering' },
    { name: 'Electrical Engineering Agent', description: 'Load schedules, cable sizing, SLDs, voltage drop, earthing, lighting design.', category: 'Engineering' },
    { name: 'Architectural / Interior Agent', description: 'Space planning, materials, lighting, layouts, interior fit-out, ergonomics.', category: 'Design' },
    { name: 'MEP Agent', description: 'Service coordination, conflict detection, shaft/riser planning, routing optimization.', category: 'Engineering' },
    { name: 'Project Planning Agent', description: 'WBS, Gantt text, manpower scheduling, procurement planning, cost phasing.', category: 'Management' },
    { name: 'QA/QC Agent', description: 'ITPs, NCRs, inspection checklists, materials verification, ISO 9001 docs.', category: 'Compliance' },
    { name: 'HSE Agent', description: 'Risk assessments, JHA/JSA, method statements, ISO 45001 compliance.', category: 'Compliance' },
    { name: 'Document Automation Agent', description: 'Generates reports, memos, variations, RFIs, and submission templates.', category: 'System' },
    { name: 'CAD Generation Agent', description: 'Produces CAD-ready JSON for drawings, geometry, and annotations.', category: 'Design' },
];

export const AGENT_NAMES = AGENTS.map(agent => agent.name);