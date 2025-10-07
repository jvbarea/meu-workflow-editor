import React, { useState, useEffect, useMemo } from "react";
import { Edge, Node } from "reactflow";
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  SelectChangeEvent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { ProcessField } from ".././types";

const operators = {
  string: [
    { value: "===", label: "é igual a" },
    { value: "!==", label: "é diferente de" },
  ],
  number: [
    { value: "===", label: "==" },
    { value: "!==", label: "!=" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
    { value: ">=", label: ">=" },
    { value: "<=", label: "<=" },
  ],
  boolean: [{ value: "===", label: "é" }],
  date: [],
};

interface EdgeSidebarProps {
  selectedEdge: Edge;
  sourceNode: Node;
  onUpdateEdge: (edgeId: string, newLabel: string) => void;
  onClose: () => void;
}

export const EdgeSidebar = ({
  selectedEdge,
  sourceNode,
  onUpdateEdge,
  onClose,
}: EdgeSidebarProps) => {
  const [selectedField, setSelectedField] = useState<ProcessField | null>(null);
  const [selectedOperator, setSelectedOperator] = useState("");
  const [value, setValue] = useState<any>("");

  const availableFields = useMemo(
    () => sourceNode.data.outputs || [],
    [sourceNode]
  );

  useEffect(() => {
    const currentLabel = selectedEdge.label as string;
    if (currentLabel) {
      const match = currentLabel.match(
        /ctx\['(.*?)'\]\s*(===|==|!==|!=|>|<|>=|<=)\s*(.*)/
      );
      if (match) {
        const [, fieldName, operator, valueStr] = match;
        const field = availableFields.find(
          (f: ProcessField) => f.name === fieldName
        );
        if (field) {
          setSelectedField(field);
          setSelectedOperator(operator);
          if (field.type === "boolean") {
            setValue(valueStr === "true");
          } else if (field.type === "number") {
            setValue(Number(valueStr));
          } else {
            setValue(valueStr.replace(/['"]/g, ""));
          }
        }
      }
    }
  }, [selectedEdge, availableFields]);

  const handleFieldChange = (event: SelectChangeEvent<string>) => {
    const fieldName = event.target.value;
    const field =
      availableFields.find((f: ProcessField) => f.name === fieldName) || null;
    setSelectedField(field);
    setSelectedOperator("");
    setValue("");
  };

  const handleSave = () => {
    if (!selectedField || !selectedOperator) {
      onUpdateEdge(selectedEdge.id, "");
      onClose();
      return;
    }

    let formattedValue;
    if (selectedField.type === "string") {
      formattedValue = `'${value}'`;
    } else {
      formattedValue = value;
    }

    const finalCondition = `ctx['${selectedField.name}'] ${selectedOperator} ${formattedValue}`;
    onUpdateEdge(selectedEdge.id, finalCondition);
    onClose();
  };

  const handleClear = () => {
    setSelectedField(null);
    setSelectedOperator("");
    setValue("");
  };

  return (
    <Drawer open={true} anchor="right" variant="persistent">
      <Box
        sx={{
          width: 380,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #ddd",
          }}
        >
          <Typography variant="h6">Configurar Condição</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
          <Typography gutterBottom>
            Origem: <Chip label={sourceNode.data.label} />
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Construtor de Condição
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Campo</InputLabel>
            <Select
              value={selectedField?.name || ""}
              label="Campo"
              onChange={handleFieldChange}
            >
              {availableFields.map((field: ProcessField) => (
                <MenuItem key={field.id} value={field.name}>
                  {field.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedField && (
            <FormControl fullWidth margin="normal" disabled={!selectedField}>
              <InputLabel>Operador</InputLabel>
              <Select
                value={selectedOperator}
                label="Operador"
                onChange={(e) => setSelectedOperator(e.target.value)}
              >
                {(operators[selectedField.type] || []).map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedField && selectedOperator && (
            <>
              {selectedField.type === "boolean" && (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Valor</InputLabel>
                  <Select
                    value={value}
                    label="Valor"
                    onChange={(e) => setValue(e.target.value)}
                  >
                    <MenuItem value={"true"}>Verdadeiro</MenuItem>
                    <MenuItem value={"false"}>Falso</MenuItem>
                  </Select>
                </FormControl>
              )}
              {selectedField.type === "string" && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Valor"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
              {selectedField.type === "number" && (
                <TextField
                  fullWidth
                  margin="normal"
                  label="Valor"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              )}
            </>
          )}
        </Box>

        <Box
          sx={{ p: 2, borderTop: "1px solid #ddd", display: "flex", gap: 1 }}
        >
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={handleClear}
          >
            Limpar
          </Button>
          <Button fullWidth variant="contained" onClick={handleSave}>
            Salvar Condição
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};
