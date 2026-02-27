import React from 'react';

export interface Agent {
  name: string;
  description: string;
  category: string;
  icon: React.FC<{ className?: string }>;
  details?: {
    useCases: string[];
    limitations: string[];
  };
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
}

export type GenerationMode = 'Fast' | 'Balanced' | 'Complex';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export interface VisualizationDataPoint {
  x: number; // 0-100
  y: number; // 0-100
  value: number; // 0-1 intensity
  label?: string;
}

export interface ContourLine {
  path: string; // SVG path 'd' attribute
  value: number;
  color: string;
}

export interface Visualization {
  type: 'heatmap' | 'contour';
  title: string;
  description: string;
  data_points?: VisualizationDataPoint[];
  contours?: ContourLine[];
  x_label?: string;
  y_label?: string;
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
  alphaearth_visualizations?: Visualization[];
  final_recommendation: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface ProjectVersion {
  id: string;
  timestamp: string;
  name: string;
  prompt: string;
  selectedAgents: string[];
  generationMode: GenerationMode;
  output: EngineeringOutput | null;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  prompt: string;
  selectedAgents: string[];
  uploadedFiles: UploadedFile[];
  generationMode: GenerationMode;
  isRedactionEnabled: boolean;
  output: EngineeringOutput | null;
  chatHistory: ChatMessage[];
  alphaEarthLocation?: GeoLocation | null;
  versions: ProjectVersion[];
}
