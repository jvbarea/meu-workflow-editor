import React, { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Controls,
  Background,
  Connection,
  Edge,
  Node,
} from "reactflow";
import { ProcessNodeData } from "./types";
import { ConfigSidebar, HeritableField } from "./ConfigSidebar";
import ProcessNode from "./ProcessNode";
import { Box, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SchemaIcon from "@mui/icons-material/Schema";
import "./styles.css";
import "reactflow/dist/style.css";
import { Autocomplete, TextField as MuiTextField } from "@mui/material";

const nodeTypes = { processNode: ProcessNode };

const initialNodes: Node<ProcessNodeData>[] = [
  {
    id: "1",
    type: "processNode",
    position: { x: 50, y: 150 },
    data: {
      label: "Tarefa 1",
      inputs: [],
      outputs: [
        { id: "out1", name: "id", type: "string", required: true },
        { id: "out2", name: "Nome da Tarefa", type: "string", required: true },
      ],
    },
  },
];
const initialEdges: Edge[] = [];
let nodeIdCounter = 2;

const FlowEditorContent = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>("1"); // Começa com o nó inicial

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNodeId(node.id),
    []
  );

  const onAddNode = useCallback(() => {
    const newNodeId = `node_${nodeIdCounter++}`;
    const newNode: Node<ProcessNodeData> = {
      id: newNodeId,
      type: "processNode",
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: `Nova Tarefa`, inputs: [], outputs: [] },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const updateNodeData = useCallback(
    (nodeId: string, newData: ProcessNodeData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId ? { ...node, data: newData } : node
        )
      );
    },
    [setNodes]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const heritableFields = useMemo((): HeritableField[] => {
    if (!selectedNodeId) return [];
    const ancestors = new Set<string>();
    const toVisit = [selectedNodeId];
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
        node.data.inputs.forEach((f) =>
          fields.push({
            fieldId: f.id,
            fieldName: f.name,
            fieldType: f.type,
            nodeId: node.id,
            nodeLabel: node.data.label,
          })
        );
        node.data.outputs.forEach((f) =>
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
  }, [selectedNodeId, nodes, edges]);

  const generateSemanticJson = useCallback(() => {
    const processFlow = {
      stages: nodes.map((node) => ({
        id: node.id,
        label: node.data.label,
        inputs: node.data.inputs,
        outputs: node.data.outputs,
      })),
      connections: edges.map((edge) => ({
        from: edge.source,
        to: edge.target,
        // A condição agora é explicitamente parte do modelo de dados
        condition: edge.label || null,
      })),
    };
    const jsonString = JSON.stringify(processFlow, null, 2);
    console.log("--- JSON Semântico para o Backend ---", jsonString);
    alert("A estrutura JSON semântica do fluxo foi gerada no console!");
  }, [nodes, edges]);

  const onEdgeDoubleClick = useCallback(
    (_: any, edge: Edge) => {
      const newLabel = prompt(
        "Defina a condição para este caminho (ex: status == 'aprovado')",
        (edge.label as string) || ""
      );
      if (newLabel !== null) {
        setEdges((eds) =>
          eds.map((e) => (e.id === edge.id ? { ...e, label: newLabel } : e))
        );
      }
    },
    [setEdges]
  );

  const nodeStatus = useMemo(() => {
    const status: { [key: string]: "completed" | "current" | "locked" } = {};
    const ancestors = new Set<string>();
    const toVisit = [currentNodeId];

    // Encontra todos os nós anteriores (ancestrais) ao nó atual
    if (currentNodeId) {
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
    }

    nodes.forEach((node) => {
      if (node.id === currentNodeId) {
        status[node.id] = "current";
      } else if (ancestors.has(node.id)) {
        status[node.id] = "completed";
      } else {
        status[node.id] = "locked";
      }
    });

    return status;
  }, [currentNodeId, nodes, edges]);

  // Função para avançar no fluxo
  const completeCurrentTask = () => {
    if (!currentNodeId) return;

    const outgoingEdges = edges.filter((edge) => edge.source === currentNodeId);
    // Simplesmente avança para o primeiro próximo nó encontrado
    if (outgoingEdges.length > 0) {
      // Aqui você implementaria a lógica de decisão com base nas condições dos edges
      setCurrentNodeId(outgoingEdges[0].target);
    } else {
      alert("Fim do fluxo!");
      setCurrentNodeId(null);
    }
  };

  // Mapeia os nós para adicionar o status aos dados
  const nodesWithStatus = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: nodeStatus[node.id],
        },
      })),
    [nodes, nodeStatus]
  );

  return (
    <Box className="workflow-editor-container">
      <Box
        sx={{
          p: 1.5,
          bgcolor: "background.paper",
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: 2,
        }}
      >
        <Button variant="contained" startIcon={<AddIcon />} onClick={onAddNode}>
          Adicionar Etapa
        </Button>
        <Button
          variant="outlined"
          startIcon={<SchemaIcon />}
          onClick={generateSemanticJson}
        >
          Gerar "Código" Semântico
        </Button>
        <Autocomplete
          options={nodes.map((n) => ({ id: n.id, label: n.data.label }))}
          getOptionLabel={(option) => option.label}
          value={
            nodes.find((n) => n.id === currentNodeId)
              ? {
                  id: currentNodeId,
                  label: nodes.find((n) => n.id === currentNodeId)!.data.label,
                }
              : null
          }
          onChange={(_, newValue) =>
            setCurrentNodeId(newValue ? newValue.id : null)
          }
          renderInput={(params) => (
            <MuiTextField
              {...params}
              label="Tarefa Atual"
              size="small"
              sx={{ width: 250 }}
            />
          )}
        />
        <Button onClick={completeCurrentTask} disabled={!currentNodeId}>
          Concluir Tarefa Atual
        </Button>
      </Box>
      <Box className="editor-main-area">
        <Box className="react-flow-wrapper">
          <ReactFlow
            nodes={nodesWithStatus}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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
            onClose={() => setSelectedNodeId(null)}
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
