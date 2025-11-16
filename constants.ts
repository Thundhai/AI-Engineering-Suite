import { Agent } from './types';
import { 
    CivilIcon, StructuralIcon, MechanicalIcon, ElectricalIcon, SurveyorIcon, 
    ArchitectIcon, MEPIcon, PlanningIcon, QAQCIcon, HSEIcon, DocsIcon, CADIcon 
} from './components/Icons';

export const AGENTS: Agent[] = [
    { name: 'Civil Engineering Agent', description: 'Roads, earthworks, foundations, drainage, hydrology, concrete design.', category: 'Engineering', icon: CivilIcon },
    { name: 'Structural Engineering Agent', description: 'RC/steel/timber design, frames, load combinations, reinforcement schedules.', category: 'Engineering', icon: StructuralIcon },
    { name: 'Mechanical Engineering Agent', description: 'Pumps, HVAC, ducts, vessels, piping, pressure drops, fire pumps, tank design.', category: 'Engineering', icon: MechanicalIcon },
    { name: 'Electrical Engineering Agent', description: 'Load schedules, cable sizing, SLDs, voltage drop, earthing, lighting design.', category: 'Engineering', icon: ElectricalIcon },
    { name: 'Surveyor Agent', description: 'Topography, boundary surveys, GIS data, site measurements, control points.', category: 'Data', icon: SurveyorIcon },
    { name: 'Architect Agent', description: 'Building design, master planning, facades, space planning, materials, and compliance.', category: 'Design', icon: ArchitectIcon },
    { name: 'MEP Agent', description: 'Service coordination, conflict detection, shaft/riser planning, routing optimization.', category: 'Engineering', icon: MEPIcon },
    { name: 'Project Planning Agent', description: 'WBS, Gantt text, manpower scheduling, procurement planning, cost phasing.', category: 'Management', icon: PlanningIcon },
    { name: 'QA/QC Agent', description: 'ITPs, NCRs, inspection checklists, materials verification, ISO 9001 docs.', category: 'Compliance', icon: QAQCIcon },
    { name: 'HSE Agent', description: 'Risk assessments, JHA/JSA, method statements, ISO 45001 compliance.', category: 'Compliance', icon: HSEIcon },
    { name: 'Document Automation Agent', description: 'Generates reports, memos, variations, RFIs, and submission templates.', category: 'System', icon: DocsIcon },
    { name: 'CAD Generation Agent', description: 'Produces CAD-ready JSON for drawings, geometry, and annotations.', category: 'Design', icon: CADIcon },
];

export const AGENT_NAMES = AGENTS.map(agent => agent.name);