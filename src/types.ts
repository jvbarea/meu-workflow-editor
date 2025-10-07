export interface ProcessField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  alternatives?: ProcessField[];
  source?: {
    nodeId: string;
    fieldId: string;
  };
}

export interface ProcessNodeData {
  label: string;
  inputs: ProcessField[];
  outputs: ProcessField[];
}

export interface ProcessNodeData {
  label: string;
  inputs: ProcessField[];
  outputs: ProcessField[];
  status?: 'completed' | 'current' | 'locked'; // Novo campo
}