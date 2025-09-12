import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { ProcessNodeData, ProcessField } from './types';
import {
  Drawer, Box, Typography, TextField, Button, IconButton, Select, MenuItem,
  FormControl, InputLabel, FormControlLabel, Checkbox, Divider, Autocomplete, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

export interface HeritableField {
  fieldId: string;
  fieldName: string;
  fieldType: ProcessField['type'];
  nodeId: string;
  nodeLabel: string;
}

interface ConfigSidebarProps {
  selectedNode: Node<ProcessNodeData>;
  heritableFields: HeritableField[];
  onUpdateNode: (nodeId: string, newData: ProcessNodeData) => void;
  onClose: () => void;
}

export const ConfigSidebar = ({ selectedNode, heritableFields, onUpdateNode, onClose }: ConfigSidebarProps) => {
  const [nodeData, setNodeData] = useState<ProcessNodeData>(selectedNode.data);

  useEffect(() => { setNodeData(selectedNode.data); }, [selectedNode]);

  const updateField = (path: (string | number)[], name: string, value: any) => {
    setNodeData(currentData => {
      const newData = structuredClone(currentData);
      let fieldToUpdate: any = newData;
      // Navega pelo "caminho" até encontrar o objeto do campo
      for (const segment of path) {
        fieldToUpdate = fieldToUpdate[segment];
      }
      fieldToUpdate[name] = value;
      return newData;
    });
  };
  
  const addField = (listType: 'inputs' | 'outputs', path: (string | number)[] = []) => {
    const newField: ProcessField = { id: crypto.randomUUID(), name: 'Novo Campo', type: 'string', required: listType === 'outputs' };
    const newData = structuredClone(nodeData);
    if (listType === 'inputs' && path.length > 0) {
      let parentField = newData.inputs[path[1] as number];
      if (!parentField.alternatives) parentField.alternatives = [];
      parentField.alternatives.push(newField);
    } else {
      newData[listType].push(newField);
    }
    setNodeData(newData);
  };
  
  const removeField = (path: (string | number)[]) => {
    const newData = structuredClone(nodeData);
    const parentPath = path.slice(0, -1);
    const lastSegment = path[path.length - 1];

    let parentObject: any = newData;
    for(const segment of parentPath) {
        parentObject = parentObject[segment];
    }
    
    if (Array.isArray(parentObject)) {
        parentObject.splice(lastSegment as number, 1);
    }
    setNodeData(newData);
  };

  const addInheritedField = (field: HeritableField | null) => {
    if (!field) return;
    const newField: ProcessField = {
      id: crypto.randomUUID(), name: field.fieldName, type: field.fieldType, required: false,
      source: { nodeId: field.nodeId, fieldId: field.fieldId }
    };
    setNodeData({ ...nodeData, inputs: [...nodeData.inputs, newField] });
  };
  
  const toggleAlternatives = (path: (string | number)[]) => {
      const newData = structuredClone(nodeData);
      const field = newData.inputs[path[1] as number];
      if(field.alternatives) delete field.alternatives;
      else field.alternatives = [];
      setNodeData(newData);
  }

  const handleSave = () => { onUpdateNode(selectedNode.id, nodeData); onClose(); };
  
  // A função de renderização agora passa o caminho completo para as funções de manipulação
  const renderFieldConfig = (field: ProcessField, path: (string | number)[]) => (
    <Box key={field.id} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1, mb: 1, bgcolor: path.includes('alternatives') ? '#fafafa' : '#fff' }}>
        <TextField size="small" fullWidth label="Nome do Campo" name="name" value={field.name} onChange={(e) => updateField(path, e.target.name, e.target.value)} sx={{mb: 1}}/>
        <FormControl size="small" fullWidth sx={{mb: 1}}>
            <InputLabel>Tipo</InputLabel>
            <Select label="Tipo" name="type" value={field.type} onChange={(e) => updateField(path, e.target.name, e.target.value)}>
                <MenuItem value="string">Texto</MenuItem><MenuItem value="number">Número</MenuItem><MenuItem value="boolean">Sim/Não</MenuItem><MenuItem value="date">Data</MenuItem>
            </Select>
        </FormControl>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <FormControlLabel control={<Checkbox size="small" name="required" checked={field.required} onChange={(e) => updateField(path, e.target.name, e.target.checked)}/>} label="Obrigatório"/>
             {path[0] === 'inputs' && !path.includes('alternatives') && <FormControlLabel control={<Checkbox size="small" checked={!!field.alternatives} onChange={() => toggleAlternatives(path)}/>} label="OU"/>}
            <Tooltip title="Remover Campo">
              <IconButton size="small" color="error" onClick={() => removeField(path)}><RemoveCircleOutlineIcon /></IconButton>
            </Tooltip>
        </Box>
        {field.alternatives && (
            <Box sx={{ mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                <Typography variant="caption" display="block" color="text.secondary">Campos Alternativos (OU)</Typography>
                {field.alternatives.map((altField, altIndex) => renderFieldConfig(altField, [...path, 'alternatives', altIndex]))}
                <Button size="small" startIcon={<AddCircleOutlineIcon />} onClick={() => addField('inputs', path)}>Add Alternativa</Button>
            </Box>
        )}
    </Box>
  );

  return (
    <Drawer open={true} anchor="right" variant="persistent">
      <Box sx={{ width: 380, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', flexShrink: 0 }}>
          <Typography variant="h6">Configurar Etapa</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          <TextField fullWidth label="Nome da Etapa" value={nodeData.label} onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })} sx={{mb: 2}}/>
          <Divider sx={{mb: 2}}/>

          <Typography variant="subtitle1" gutterBottom>Campos de Entrada</Typography>
          <Autocomplete
            options={heritableFields}
            groupBy={(option) => option.nodeLabel}
            getOptionLabel={(option) => option.fieldName}
            onChange={(_, value) => addInheritedField(value)}
            renderInput={(params) => <TextField {...params} label="Herdar campo de etapa anterior..." />}
            sx={{mb: 1}}
            disabled={heritableFields.length === 0}
          />
          <Button fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => addField('inputs')} sx={{mb: 2}}>
            Adicionar Entrada Manual
          </Button>

          {nodeData.inputs.map((field, index) => renderFieldConfig(field, ['inputs', index]))}
          
          <Divider sx={{my: 2}}/>
          <Typography variant="subtitle1" gutterBottom>Campos de Saída</Typography>
          {nodeData.outputs.map((field, index) => renderFieldConfig(field, ['outputs', index]))}
          <Button fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => addField('outputs')} sx={{mt: 1}}>Add Saída</Button>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid #ddd', flexShrink: 0 }}>
          <Button fullWidth variant="contained" onClick={handleSave}>Salvar Alterações</Button>
        </Box>
      </Box>
    </Drawer>
  );
};

