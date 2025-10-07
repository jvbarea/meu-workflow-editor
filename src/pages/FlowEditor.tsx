import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Edge,
  Node,
  OnConnect,
  NodeMouseHandler,
  EdgeMouseHandler,
} from 'reactflow';
import { ProcessNodeData } from '../types';
import { ConfigSidebar, HeritableField } from '../components/ConfigSidebar';
import { EdgeSidebar } from '../components/EdgeSidebar';
import ProcessNode from '../components/ProcessNode';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FileOpenIcon from '@mui/icons-material/FileOpen';

import 'reactflow/dist/style.css';
import '../styles.css';

const nodeTypes = { processNode: ProcessNode };

const initialNodes: Node<ProcessNodeData>[] = [
  {
    id: '1',
    type: 'processNode',
    position: { x: 50, y: 150 },
    data: {
      label: 'Tarefa Inicial',
      inputs: [],
      outputs: [
        { id: 'out1', name: 'status', type: 'string', required: true },
        { id: 'out2', name: 'total', type: 'number', required: true },
      ],
    },
  },
];
const initialEdges: Edge[] = [];
let nodeIdCounter = 2;

const FlowEditorContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // --- Callbacks do React Flow ---
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);


  const onAddNode = useCallback(() => {
    const newNodeId = `node_${nodeIdCounter++}`;
    const newNode: Node<ProcessNodeData> = {
      id: newNodeId,
      type: 'processNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: `Nova Tarefa`, inputs: [], outputs: [] },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: ProcessNodeData) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === nodeId ? { ...node, data: newData } : node))
    );
  }, [setNodes]);

  const updateEdgeLabel = useCallback((edgeId: string, newLabel: string) => {
    setEdges((eds) =>
      eds.map((edge) => (edge.id === edgeId ? { ...edge, label: newLabel } : edge))
    );
  }, [setEdges]);



  const saveWorkflow = useCallback(() => {
    const workflowData = {
      nodes: nodes.map(({ id, position, data, type }) => ({ id, position, data, type })),
      edges: edges.map(({ id, source, target, label }) => ({ id, source, target, label: label || null })),
    };
    const jsonString = JSON.stringify(workflowData, null, 2);
    localStorage.setItem('workflow', jsonString);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Workflow salvo no localStorage!');
  }, [nodes, edges]);

  const loadWorkflow = useCallback(() => {
    const savedWorkflow = localStorage.getItem('workflow');
    if (!savedWorkflow) {
      alert("Nenhum workflow salvo foi encontrado.");
      return;
    }
    try {
      const processFlow = JSON.parse(savedWorkflow);
      if (processFlow.nodes && processFlow.edges) {
        setNodes(processFlow.nodes);
        setEdges(processFlow.edges);
        nodeIdCounter = processFlow.nodes.length + 2;
        alert('Workflow carregado!');
      } else {
        alert("O workflow salvo possui um formato inválido.");
      }
    } catch (e) {
      console.error("Erro ao carregar o workflow:", e);
      alert("Ocorreu um erro ao carregar o workflow.");
    }
  }, [setNodes, setEdges]);



  const heritableFields = useMemo((): HeritableField[] => {
    if (!selectedNode) return [];
    const ancestors = new Set<string>();
    const toVisit = [selectedNode.id];
    while (toVisit.length > 0) {
      const currentId = toVisit.pop()!;
      const parentEdges = edges.filter((edge) => edge.target === currentId);
      for (const edge of parentEdges) {
        if (!ancestors.has(edge.source)) {
          ancestors.add(edge.source);
          toVisit.push(edge.source);
        }
      }
    }
    const fields: HeritableField[] = [];
    ancestors.forEach((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        (node.data.outputs || []).forEach((f) =>
          fields.push({
            fieldId: f.id,
            fieldName: f.name,
            fieldType: f.type,
            nodeId: node.id,
            nodeLabel: node.data.label,
          })
        );
      }
    });
    return fields;
  }, [selectedNode, nodes, edges]);

  const sourceNodeForSelectedEdge = useMemo(() => {
    if (!selectedEdge) return null;
    return nodes.find(n => n.id === selectedEdge.source);
  }, [selectedEdge, nodes]);



  return (
    <Box className="workflow-editor-container">
      <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderBottom: '1px solid #ddd', display: 'flex', gap: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddNode}>
          Adicionar Etapa
        </Button>
        <Button variant="outlined" color="primary" startIcon={<SaveIcon />} onClick={saveWorkflow}>
          Salvar
        </Button>
        <Button variant="outlined" color="secondary" startIcon={<FileOpenIcon />} onClick={loadWorkflow}>
          Carregar
        </Button>
      </Box>

      <Box className="editor-main-area">
        <Box className="react-flow-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </Box>

        {selectedNode && (
          <ConfigSidebar
            key={selectedNode.id}
            selectedNode={selectedNode}
            heritableFields={heritableFields}
            onUpdateNode={updateNodeData}
            onClose={() => setSelectedNode(null)}
          />
        )}

        {selectedEdge && sourceNodeForSelectedEdge && (
          <EdgeSidebar
            key={selectedEdge.id}
            selectedEdge={selectedEdge}
            sourceNode={sourceNodeForSelectedEdge}
            onUpdateEdge={updateEdgeLabel}
            onClose={() => setSelectedEdge(null)}
          />
        )}
      </Box>
    </Box>
  );
};

const FlowEditor = () => (
  <ReactFlowProvider>
    <FlowEditorContent />
  </ReactFlowProvider>
);

export default FlowEditor;