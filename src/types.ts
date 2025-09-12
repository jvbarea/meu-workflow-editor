// Define a estrutura para um campo, que pode ter alternativas
export interface ProcessField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  // NOVO: Array para guardar campos que podem substituir este (lógica OU)
  alternatives?: ProcessField[];
  source?: {
    nodeId: string;
    fieldId: string;
  };
}

// A estrutura do nó agora é mais simples
export interface ProcessNodeData {
  label: string;
  inputs: ProcessField[];
  outputs: ProcessField[];
}

