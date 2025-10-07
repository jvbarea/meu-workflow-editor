import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { ProcessNodeData, ProcessField } from '.././types';
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

  useEffect(() => {
    setNodeData(selectedNode.data);
  }, [selectedNode]);

  const handleFieldChange = (listType: 'inputs' | 'outputs', index: number, fieldName: string, value: any) => {
    setNodeData(currentData => {
      const newList = [...currentData[listType]];
      newList[index] = { ...newList[index], [fieldName]: value };
      return { ...currentData, [listType]: newList };
    });
  };

  const addField = (listType: 'inputs' | 'outputs') => {
    const newField: ProcessField = {
      id: crypto.randomUUID(),
      name: 'Novo Campo',
      type: 'string',
      required: listType === 'outputs',
    };
    setNodeData(currentData => ({
      ...currentData,
      [listType]: [...currentData[listType], newField],
    }));
  };
  
  const removeField = (listType: 'inputs' | 'outputs', index: number) => {
    setNodeData(currentData => ({
      ...currentData,
      [listType]: currentData[listType].filter((_, i) => i !== index),
    }));
  };

  const addInheritedField = (field: HeritableField | null) => {
    if (!field) return;
    const newField: ProcessField = {
      id: crypto.randomUUID(),
      name: field.fieldName,
      type: field.fieldType,
      required: false,
      source: { nodeId: field.nodeId, fieldId: field.fieldId }
    };
    setNodeData(currentData => ({ ...currentData, inputs: [...currentData.inputs, newField] }));
  };

  const handleSave = () => {
    onUpdateNode(selectedNode.id, nodeData);
    onClose();
  };
  
  const renderFieldConfig = (field: ProcessField, listType: 'inputs' | 'outputs', index: number) => (
    <Box key={field.id} sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1, mb: 1, bgcolor: '#fff' }}>
      <TextField
        size="small"
        fullWidth
        label="Nome do Campo"
        name="name"
        value={field.name}
        onChange={(e) => handleFieldChange(listType, index, 'name', e.target.value)}
        sx={{ mb: 1 }}
      />
      <FormControl size="small" fullWidth sx={{ mb: 1 }}>
        <InputLabel>Tipo</InputLabel>
        <Select
          label="Tipo"
          name="type"
          value={field.type}
          onChange={(e) => handleFieldChange(listType, index, 'type', e.target.value)}
        >
          <MenuItem value="string">Texto</MenuItem>
          <MenuItem value="number">Número</MenuItem>
          <MenuItem value="boolean">Sim/Não</MenuItem>
          <MenuItem value="date">Data</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              name="required"
              checked={field.required}
              onChange={(e) => handleFieldChange(listType, index, 'required', e.target.checked)}
            />
          }
          label="Obrigatório"
        />
        <Tooltip title="Remover Campo">
          <IconButton size="small" color="error" onClick={() => removeField(listType, index)}>
            <RemoveCircleOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>
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
          <TextField
            fullWidth
            label="Nome da Etapa"
            value={nodeData.label}
            onChange={(e) => setNodeData({ ...nodeData, label: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" gutterBottom>Campos de Entrada</Typography>
          <Autocomplete
            options={heritableFields}
            groupBy={(option) => option.nodeLabel}
            getOptionLabel={(option) => option.fieldName}
            onChange={(_, value) => addInheritedField(value)}
            renderInput={(params) => <TextField {...params} label="Herdar campo de etapa anterior..." />}
            sx={{ mb: 1 }}
            disabled={heritableFields.length === 0}
          />
          <Button fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => addField('inputs')} sx={{ mb: 2 }}>
            Adicionar Entrada Manual
          </Button>
          {nodeData.inputs.map((field, index) => renderFieldConfig(field, 'inputs', index))}
          
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>Campos de Saída</Typography>
          {nodeData.outputs.map((field, index) => renderFieldConfig(field, 'outputs', index))}
          <Button fullWidth startIcon={<AddCircleOutlineIcon />} onClick={() => addField('outputs')} sx={{ mt: 1 }}>
            Adicionar Saída
          </Button>
        </Box>

        <Box sx={{ p: 2, borderTop: '1px solid #ddd', flexShrink: 0 }}>
          <Button fullWidth variant="contained" onClick={handleSave}>Salvar Alterações</Button>
        </Box>
      </Box>
    </Drawer>
  );
};