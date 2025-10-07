import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  Background,
  Controls,
} from 'reactflow';
import { ProcessNodeData, ProcessField } from '.././types';
import ProcessNode from '../components/ProcessNode';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Tooltip,
  IconButton,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';

import 'reactflow/dist/style.css';
import '../styles.css';

const nodeTypes = { processNode: ProcessNode };

const loadWorkflowFromStorage = (
  setNodes: (nodes: Node<ProcessNodeData>[]) => void,
  setEdges: (edges: Edge[]) => void,
  setCurrentNodeId: (id: string | null) => void
) => {
  const savedWorkflow = localStorage.getItem('workflow');
  if (savedWorkflow) {
    try {
      const processFlow = JSON.parse(savedWorkflow);
      if (processFlow.nodes && processFlow.edges) {
        const loadedNodes = processFlow.nodes.map((node: any) => ({
          ...node,
          type: 'processNode',
        }));
        setNodes(loadedNodes);
        setEdges(processFlow.edges);
        if (loadedNodes.length > 0) {
          setCurrentNodeId(loadedNodes[0].id);
        }
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (e) {
      console.error('Erro ao carregar workflow:', e);
      setNodes([]);
      setEdges([]);
    }
  }
};

const ExecutionPageContent = () => {
  const [nodes, setNodes] = useNodesState<ProcessNodeData>([]);
  const [edges, setEdges] = useEdgesState([]);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<{ [key: string]: any }>({});
  const [workflowState, setWorkflowState] = useState<{ [nodeId: string]: any }>({});
  // NOVO ESTADO: Armazena os nomes dos campos que foram preenchidos automaticamente
  const [prepopulatedFields, setPrepopulatedFields] = useState<Set<string>>(new Set());


  const loadAndReset = useCallback(() => {
    loadWorkflowFromStorage(setNodes, setEdges, setCurrentNodeId);
    setFieldValues({});
    setWorkflowState({});
    setPrepopulatedFields(new Set());
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadAndReset();
  }, [loadAndReset]);

  const currentNode = useMemo(() => nodes.find((n) => n.id === currentNodeId), [
    nodes,
    currentNodeId,
  ]);
  
  useEffect(() => {
    if (!currentNode) {
      setFieldValues({});
      return;
    }

    const initialValues: { [key: string]: any } = {};
    const populated = new Set<string>();
    const allCurrentFields = [...(currentNode.data.inputs || []), ...(currentNode.data.outputs || [])];

    allCurrentFields.forEach(field => {
      initialValues[field.name] = field.type === 'boolean' ? false : '';
    });

    const parentEdges = edges.filter(edge => edge.target === currentNodeId);
    parentEdges.forEach(edge => {
      const parentNodeId = edge.source;
      const parentData = workflowState[parentNodeId];
      if (parentData) {
        (currentNode.data.inputs || []).forEach((inputField: ProcessField) => {
          if (parentData.hasOwnProperty(inputField.name)) {
            initialValues[inputField.name] = parentData[inputField.name];
            // Marca este campo como pré-populado
            populated.add(inputField.name);
          }
        });
      }
    });

    setFieldValues(initialValues);
    setPrepopulatedFields(populated);
  }, [currentNode, edges, workflowState]);


  const handleFieldValueChange = useCallback((fieldName: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
  }, []);

  const completeCurrentTask = useCallback(() => {
    if (!currentNodeId || !currentNode) return;
    const typedFieldValues: { [key: string]: any } = {};
    const allCurrentFields = [...(currentNode.data.inputs || []), ...(currentNode.data.outputs || [])];
    Object.keys(fieldValues).forEach(fieldName => {
        const fieldDef = allCurrentFields.find(f => f.name === fieldName);
        if (fieldDef) {
            const rawValue = fieldValues[fieldName];
            if(fieldDef.type === 'boolean') {
                typedFieldValues[fieldName] = rawValue;
            } else {
                const valueStr = String(rawValue);
                if (valueStr === '') {
                    typedFieldValues[fieldName] = undefined;
                } else if (fieldDef.type === 'number') {
                    const num = parseFloat(valueStr);
                    typedFieldValues[fieldName] = isNaN(num) ? undefined : num;
                } else {
                    typedFieldValues[fieldName] = valueStr;
                }
            }
        }
    });
    setWorkflowState(prev => ({ ...prev, [currentNodeId]: typedFieldValues }));
    const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    if (outgoingEdges.length === 0) {
      alert('Fim do fluxo!');
      setCurrentNodeId(null);
      return;
    }
    if (outgoingEdges.length === 1 && !outgoingEdges[0].label) {
      setCurrentNodeId(outgoingEdges[0].target);
      return;
    }
    const nextEdge = outgoingEdges.find((edge) => {
      if (!edge.label) return true; 
      try {
        const conditionFunction = new Function('ctx', `with(ctx) { return ${edge.label}; }`);
        return conditionFunction(typedFieldValues);
      } catch (e) {
        console.error(`Erro ao avaliar a condição "${edge.label}":`, e);
        return false;
      }
    });
    if (nextEdge) {
      setCurrentNodeId(nextEdge.target);
    } else {
      alert('Nenhuma condição corresponde aos valores preenchidos.');
    }
  }, [currentNodeId, currentNode, edges, fieldValues]);

  const nodeStatus = useMemo(() => {
    const status: { [key: string]: 'completed' | 'current' | 'locked' } = {};
    const ancestors = new Set<string>();
    const toVisit = [currentNodeId];
    if (currentNodeId) {
    while (toVisit.length > 0) {
        const currentId = toVisit.pop()!;
        const parentEdges = edges.filter(edge => edge.target === currentId);
        for (const edge of parentEdges) {
        if (!ancestors.has(edge.source)) {
            ancestors.add(edge.source);
            toVisit.push(edge.source);
        }
        }
    }
    }
    nodes.forEach(node => {
    if (node.id === currentNodeId) status[node.id] = 'current';
    else if (ancestors.has(node.id)) status[node.id] = 'completed';
    else status[node.id] = 'locked';
    });
    return status;
  }, [currentNodeId, nodes, edges]);

  const nodesWithStatus = useMemo(
      () =>
      nodes.map((node) => ({
          ...node,
          data: { ...node.data, status: nodeStatus[node.id] },
          draggable: false,
          selectable: false,
      })),
      [nodes, nodeStatus]
  );

  if (nodes.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Nenhum workflow encontrado.</Typography>
        <Typography>Vá para a página de Estruturação para criar e salvar um.</Typography>
      </Box>
    );
  }
  
  const allFields = [...(currentNode?.data.inputs || []), ...(currentNode?.data.outputs || [])];

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodesWithStatus}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </Box>
      <Paper sx={{ width: 350, p: 2, m: 2, border: '1px solid #ddd', overflowY: 'auto' }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" gutterBottom>Execução</Typography>
          <Tooltip title="Resetar Execução"><IconButton onClick={loadAndReset}><ReplayIcon /></IconButton></Tooltip>
        </Box>
        <Divider sx={{ my: 1 }} />
        {currentNode ? (
          <>
            <Typography variant="subtitle1" sx={{mb: 2}}>Tarefa Atual: <strong>{currentNode.data.label}</strong></Typography>
            
            <Typography variant="subtitle2" gutterBottom>Campos da Tarefa:</Typography>
            
            {allFields.map((field: ProcessField) => {
              const isInput = currentNode.data.inputs.some(f => f.id === field.id);
              const isDisabled = isInput && prepopulatedFields.has(field.name);

              return (
                <Box key={field.id} sx={{ my: 1.5 }}>
                  {field.type === 'boolean' ? (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!fieldValues[field.name]}
                          onChange={(e) => handleFieldValueChange(field.name, e.target.checked)}
                          disabled={isDisabled}
                        />
                      }
                      label={field.name}
                    />
                  ) : (
                    <TextField 
                        fullWidth 
                        label={`${field.name} (${field.type})`}
                        variant="outlined" 
                        size="small"
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={fieldValues[field.name] || ''}
                        onChange={(e) => handleFieldValueChange(field.name, e.target.value)}
                        disabled={isDisabled}
                        InputLabelProps={{ shrink: isDisabled ? true : undefined }}
                    />
                  )}
                </Box>
              )
            })}

            <Button
              fullWidth
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={completeCurrentTask}
              sx={{ mt: 2 }}
            >
              Concluir e Avançar
            </Button>
          </>
        ) : (
          <Typography>Workflow concluído!</Typography>
        )}
      </Paper>
    </Box>
  );
};

const ExecutionPage = () => (
  <ReactFlowProvider>
    <ExecutionPageContent />
  </ReactFlowProvider>
);

export default ExecutionPage;