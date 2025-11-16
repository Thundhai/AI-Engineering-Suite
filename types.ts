
export interface Agent {
  name: string;
  description: string;
  category: string;
}

export type GenerationMode = 'Fast' | 'Balanced' | 'Complex';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface EngineeringOutput {
  status: 'success' | 'need_more_info' | 'error';
  active_agents: string[];
  inputs_confirmed: Record<string, any>;
  engineering_output: Record<string, any>;
  design_files: Record<string, any>;
  cad_scripts: {
    "freecad_macro.py"?: string;
    "dxf_script.txt"?: string;
    "ifc_structure.json"?: Record<string, any>;
  };
  bom: Record<string, any>;
  compliance: Record<string, any>;
  qa_qc: Record<string, any>;
  hse: Record<string, any>;
  method_statement: Record<string, any>;
  risk_assessment: Record<string, any>;
  final_recommendation: string;
}