import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography } from '@mui/material';
import {
  PlayArrow,
  Stop,
  HowToVote,
  CallSplit,
  CallMerge,
  Notifications,
  Timer,
  Description,
  Visibility,
  Email,
  Webhook,
} from '@mui/icons-material';
import { NODE_TYPE_INFO } from '../types';
import type { WorkflowNodeType } from '../types';

// Icon map for node types
const ICON_MAP: Record<string, React.ComponentType<{ sx?: object }>> = {
  PlayArrow,
  Stop,
  HowToVote,
  CallSplit,
  CallMerge,
  Notifications,
  Timer,
  Description,
  Visibility,
  Email,
  Webhook,
};

export interface WorkflowNodeData {
  nodeType: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
  [key: string]: unknown;
}

interface WorkflowNodeProps {
  data: WorkflowNodeData;
  selected?: boolean;
}

function WorkflowNodeComponent({ data, selected }: WorkflowNodeProps) {
  const nodeInfo = NODE_TYPE_INFO[data.nodeType];
  const IconComponent = ICON_MAP[nodeInfo.icon] || PlayArrow;

  // Determine handles based on node type
  // State nodes always have both handles (for flexibility like "send back" connections)
  // Only explicit 'start' and 'end' node types restrict handles
  const showInput = data.nodeType !== 'start';
  const showOutput = data.nodeType !== 'end';

  // Get isFinal for display purposes
  const config = data.config as { isInitial?: boolean; isFinal?: boolean };

  // For the simplified workflow builder, all nodes use a single 'output' handle
  // Actions are defined by connections (edges), not by separate output handles
  // This makes it easier to configure workflows visually
  const outputs = showOutput ? [{ key: 'output', label: '' }] : [];

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 1,
        boxShadow: selected ? '0 0 0 2px #1976d2' : '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: 160,
        overflow: 'visible',
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Input Handle */}
      {showInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            width: 12,
            height: 12,
            background: '#2196f3',
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Header */}
      <Box
        sx={{
          bgcolor: nodeInfo.color,
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderRadius: '4px 4px 0 0',
        }}
      >
        <IconComponent sx={{ fontSize: 18, color: '#fff' }} />
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#fff',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </Typography>
      </Box>

      {/* Body with output handles */}
      <Box sx={{ py: 1, px: 1, minHeight: outputs.length > 1 ? outputs.length * 24 : 32 }}>
        {outputs.length > 1 ? (
          outputs.map((output) => (
            <Box
              key={output.key}
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                height: 24,
                position: 'relative',
              }}
            >
              <Typography sx={{ fontSize: '0.65rem', color: '#666', mr: 1 }}>
                {output.label}
              </Typography>
              <Handle
                type="source"
                position={Position.Right}
                id={output.key}
                style={{
                  width: 10,
                  height: 10,
                  background: '#4caf50',
                  border: '2px solid #fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  top: 'auto',
                  position: 'relative',
                  transform: 'none',
                  right: -4,
                }}
              />
            </Box>
          ))
        ) : showOutput ? (
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            style={{
              width: 12,
              height: 12,
              background: '#4caf50',
              border: '2px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        ) : null}

        {!showOutput && (
          <Typography sx={{ fontSize: '0.65rem', color: '#999', textAlign: 'center' }}>
            End of workflow
          </Typography>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 1, pb: 0.5, borderTop: '1px solid #eee' }}>
        <Typography sx={{ fontSize: '0.55rem', color: '#999', textTransform: 'capitalize' }}>
          {data.nodeType.replace(/_/g, ' ')}
        </Typography>
      </Box>
    </Box>
  );
}

export default memo(WorkflowNodeComponent);
