import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ProcessNodeData } from '.././types';

const FieldItem = ({ name, type }: { name: string, type: 'input' | 'output' }) => (
  <div className={`field-item ${type}`}>
    <span className={`dot ${type}-dot`} />
    {name}
  </div>
);

const ProcessNode = ({ data }: NodeProps<ProcessNodeData>) => {
  const nodeClassName = `process-node status-${data.status || 'default'}`;

  return (
    <div className={nodeClassName}>
      <Handle type="target" position={Position.Left} />

      <div className="label">{data.label}</div>
      
      <div className="node-body">
        {(data.inputs?.length > 0 || data.outputs?.length > 0) && <hr />}
        
        <div className="field-list">
          {data.inputs?.map(field => <FieldItem key={field.id} name={field.name} type="input" />)}
        </div>
        
        <div className="field-list">
          {data.outputs?.map(field => <FieldItem key={field.id} name={field.name} type="output" />)}
        </div>
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default memo(ProcessNode);
