import { Box, Typography, Paper, Tooltip, Divider } from '@mui/material';
import {
  PlayArrow,
  Stop,
  FiberManualRecord,
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
import type { WorkflowNodeType } from '../types';
import { NODE_TYPE_INFO } from '../types';

// Icon map for node types
const ICON_MAP: Record<string, React.ComponentType<{ sx?: object }>> = {
  PlayArrow,
  Stop,
  FiberManualRecord,
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

// Group node types by category
const NODE_CATEGORIES = [
  {
    name: 'States',
    types: ['state'] as WorkflowNodeType[],
  },
  {
    name: 'Flow Control',
    types: ['start', 'end', 'condition', 'fork', 'join'] as WorkflowNodeType[],
  },
  {
    name: 'Actions',
    types: ['approval', 'notification', 'email', 'webhook', 'timer'] as WorkflowNodeType[],
  },
  {
    name: 'Configuration',
    types: ['view_permission', 'child_form_entry'] as WorkflowNodeType[],
  },
];

interface NodePaletteProps {
  onDragStart: (nodeType: WorkflowNodeType) => void;
  onDragEnd: () => void;
}

export function NodePalette({ onDragStart, onDragEnd }: NodePaletteProps) {
  return (
    <Box sx={{ p: 1, height: '100%', overflow: 'auto' }}>
      <Typography
        sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          mb: 1,
          color: '#666',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        Workflow Nodes
      </Typography>

      {NODE_CATEGORIES.map((category, catIndex) => (
        <Box key={category.name} sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontSize: '0.6rem',
              fontWeight: 500,
              color: '#999',
              textTransform: 'uppercase',
              mb: 0.5,
            }}
          >
            {category.name}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {category.types.map((type) => {
              const info = NODE_TYPE_INFO[type];
              const IconComponent = ICON_MAP[info.icon] || PlayArrow;

              return (
                <Tooltip key={type} title={info.description} placement="right" arrow>
                  <Paper
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('nodeType', type);
                      onDragStart(type);
                    }}
                    onDragEnd={onDragEnd}
                    sx={{
                      p: 0.75,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      cursor: 'grab',
                      userSelect: 'none',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: '#e3f2fd',
                        borderColor: '#1976d2',
                        transform: 'translateX(2px)',
                      },
                      '&:active': {
                        cursor: 'grabbing',
                      },
                      border: '1px solid #e0e0e0',
                      borderLeft: `3px solid ${info.color}`,
                      bgcolor: '#fff',
                    }}
                  >
                    <IconComponent sx={{ fontSize: 16, color: info.color }} />
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      {info.label}
                    </Typography>
                  </Paper>
                </Tooltip>
              );
            })}
          </Box>

          {catIndex < NODE_CATEGORIES.length - 1 && (
            <Divider sx={{ mt: 1.5, mb: 0.5 }} />
          )}
        </Box>
      ))}

      <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#666' }}>
          Drag nodes onto the canvas to build your workflow. Connect nodes by dragging
          from output to input sockets.
        </Typography>
      </Box>
    </Box>
  );
}

export default NodePalette;

