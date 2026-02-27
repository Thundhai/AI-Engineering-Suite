import { Agent } from './types';
import { 
    CivilIcon, StructuralIcon, MechanicalIcon, ElectricalIcon, SurveyorIcon, 
    ArchitectIcon, MEPIcon, PlanningIcon, QAQCIcon, HSEIcon, DocsIcon, CADIcon 
} from './components/Icons';

export const AGENTS: Agent[] = [
    { 
        name: 'Civil Engineering Agent', 
        description: 'Roads, earthworks, foundations, drainage, hydrology, concrete design.', 
        category: 'Engineering', 
        icon: CivilIcon,
        details: {
            useCases: ['Road & Pavement Design', 'Stormwater & Drainage Systems', 'Earthworks & Grading', 'Foundation Design (Geotechnical)'],
            limitations: ['Requires accurate survey data', 'Does not perform architectural design', 'Cannot assess environmental impact without data']
        }
    },
    { 
        name: 'Structural Engineering Agent', 
        description: 'RC/steel/timber design, frames, load combinations, reinforcement schedules.', 
        category: 'Engineering', 
        icon: StructuralIcon,
        details: {
            useCases: ['Steel & Concrete Frame Analysis', 'Load Bearing Wall Design', 'Reinforcement Scheduling', 'Wind & Seismic Loading'],
            limitations: ['Dependent on Architectural layout', 'Does not design MEP systems', 'Requires soil bearing capacity inputs']
        }
    },
    { 
        name: 'Mechanical Engineering Agent', 
        description: 'Pumps, HVAC, ducts, vessels, piping, pressure drops, fire pumps, tank design.', 
        category: 'Engineering', 
        icon: MechanicalIcon,
        details: {
            useCases: ['HVAC System Sizing', 'Piping & Pumping Systems', 'Pressure Vessel Design', 'Fire Suppression Systems'],
            limitations: ['Needs Electrical inputs for power', 'Spatial constraints defined by Architect', 'Not for Structural supports']
        }
    },
    { 
        name: 'Electrical Engineering Agent', 
        description: 'Load schedules, cable sizing, SLDs, voltage drop, earthing, lighting design.', 
        category: 'Engineering', 
        icon: ElectricalIcon,
        details: {
            useCases: ['Power Distribution (SLD)', 'Lighting Layout & Calculations', 'Cable Sizing & Voltage Drop', 'Earthing & Lightning Protection'],
            limitations: ['Requires Mechanical load list', 'Does not design building fabric', 'Dependent on utility provider specs']
        }
    },
    { 
        name: 'Surveyor Agent', 
        description: 'Topography, boundary surveys, GIS data, site measurements, control points.', 
        category: 'Data', 
        icon: SurveyorIcon,
        details: {
            useCases: ['Topographic Mapping', 'Boundary Demarcation', 'Cut & Fill Volume Calculation', 'GIS Data Analysis'],
            limitations: ['Cannot design infrastructure', 'Limited by satellite data resolution (if no field data)', 'Weather dependent (real-world)']
        }
    },
    { 
        name: 'Architect Agent', 
        description: 'Building design, master planning, facades, space planning, materials, and compliance.', 
        category: 'Design', 
        icon: ArchitectIcon,
        details: {
            useCases: ['Conceptual Building Design', 'Floor Plan Layouts', 'Facade & Material Selection', 'Building Code Compliance (Spatial)'],
            limitations: ['Does not perform structural calculations', 'Not for detailed MEP routing', 'Cost estimation requires Planning Agent']
        }
    },
    { 
        name: 'MEP Agent', 
        description: 'Service coordination, conflict detection, shaft/riser planning, routing optimization.', 
        category: 'Engineering', 
        icon: MEPIcon,
        details: {
            useCases: ['Clash Detection', 'Service Route Coordination', 'Riser & Shaft Planning', 'Combined Services Drawings'],
            limitations: ['Requires individual M&E designs', 'Does not calculate system capacities', 'Dependent on structural constraints']
        }
    },
    { 
        name: 'Project Planning Agent', 
        description: 'WBS, Gantt text, manpower scheduling, procurement planning, cost phasing.', 
        category: 'Management', 
        icon: PlanningIcon,
        details: {
            useCases: ['Work Breakdown Structure (WBS)', 'Construction Schedule (Gantt)', 'Resource & Manpower Loading', 'Procurement Strategy'],
            limitations: ['Estimates are theoretical', 'Requires accurate BOQ for costing', 'Does not account for unforeseeable delays']
        }
    },
    { 
        name: 'QA/QC Agent', 
        description: 'ITPs, NCRs, inspection checklists, materials verification, ISO 9001 docs.', 
        category: 'Compliance', 
        icon: QAQCIcon,
        details: {
            useCases: ['Inspection & Test Plans (ITP)', 'Non-Conformance Reports (NCR)', 'Material Approval Forms', 'Quality Checklists'],
            limitations: ['Cannot physically inspect site', 'Relies on reported data', 'Administrative only']
        }
    },
    { 
        name: 'HSE Agent', 
        description: 'Risk assessments, JHA/JSA, method statements, ISO 45001 compliance.', 
        category: 'Compliance', 
        icon: HSEIcon,
        details: {
            useCases: ['Risk Assessments (RAMS)', 'Job Hazard Analysis (JHA)', 'Safety Management Plans', 'Incident Reporting Templates'],
            limitations: ['Cannot enforce site safety', 'General guidelines only', 'Requires site-specific hazards']
        }
    },
    { 
        name: 'Document Automation Agent', 
        description: 'Generates reports, memos, variations, RFIs, and submission templates.', 
        category: 'System', 
        icon: DocsIcon,
        details: {
            useCases: ['RFI Generation', 'Technical Memo Writing', 'Meeting Minutes', 'Transmittal Documents'],
            limitations: ['Content quality depends on technical inputs', 'Does not perform engineering checks', 'Formatting only']
        }
    },
    { 
        name: 'CAD Generation Agent', 
        description: 'Produces CAD-ready JSON for drawings, geometry, and annotations.', 
        category: 'Design', 
        icon: CADIcon,
        details: {
            useCases: ['2D Geometry Scripting', 'Drawing Annotation Generation', 'Layer Management Setup', 'Export to Open Formats'],
            limitations: ['Not a full CAD software replacement', 'Requires post-processing', 'Limited to supported primitives']
        }
    },
];

export const AGENT_NAMES = AGENTS.map(agent => agent.name);
