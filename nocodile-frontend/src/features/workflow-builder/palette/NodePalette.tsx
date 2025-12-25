import { Box, Typography, Paper, Tooltip, Divider } from '@mui/material';
import {
  Edit,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Undo,
  Done,
  FiberManualRecord,
  HowToVote,
  CallSplit,
  CallMerge,
  Notifications,
  Timer,
  Description,
  Email,
  Webhook,
} from '@mui/icons-material';
import type { WorkflowNodeType } from '../types';
import { NODE_TYPE_INFO, STATE_PRESETS } from '../types';

// Icon map for node types and state presets
const ICON_MAP: Record<string, React.ComponentType<{ sx?: object }>> = {
  Edit,
  HourglassEmpty,
  CheckCircle,
  Cancel,
  Undo,
  Done,
  FiberManualRecord,
  HowToVote,
  CallSplit,
  CallMerge,
  Notifications,
  Timer,
  Description,
  Email,
  Webhook,
};

// Action node types (not states)
const ACTION_NODE_TYPES: WorkflowNodeType[] = ['approval', 'condition', 'notification', 'email', 'webhook', 'timer'];

// Advanced node types (less commonly used)
const ADVANCED_NODE_TYPES: WorkflowNodeType[] = ['fork', 'join'];

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
        Workflow Builder
      </Typography>

      {/* States Section */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 500,
            color: '#999',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          States
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {STATE_PRESETS.map((preset) => {
            const IconComponent = ICON_MAP[preset.icon] || FiberManualRecord;

            return (
              <Tooltip key={preset.key} title={preset.description} placement="right" arrow>
                <Paper
                  draggable
                  onDragStart={(e) => {
                    // Pass both the node type and the preset key
                    e.dataTransfer.setData('nodeType', 'state');
                    e.dataTransfer.setData('statePreset', preset.key);
                    onDragStart('state');
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
                    borderLeft: `3px solid ${preset.color}`,
                    bgcolor: preset.isInitial ? '#e8f5e9' : preset.isFinal ? '#ffebee' : '#fff',
                  }}
                >
                  <IconComponent sx={{ fontSize: 16, color: preset.color }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
                      {preset.name}
                    </Typography>
                    {(preset.isInitial || preset.isFinal) && (
                      <Typography sx={{ fontSize: '0.55rem', color: '#888' }}>
                        {preset.isInitial ? 'Initial' : 'Final'}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Actions Section */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 500,
            color: '#999',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          Actions
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {ACTION_NODE_TYPES.map((type) => {
            const info = NODE_TYPE_INFO[type];
            const IconComponent = ICON_MAP[info.icon] || FiberManualRecord;

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
      </Box>

      <Divider sx={{ mb: 1.5 }} />

      {/* Advanced Section (collapsible) */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: '0.6rem',
            fontWeight: 500,
            color: '#999',
            textTransform: 'uppercase',
            mb: 0.5,
          }}
        >
          Advanced
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {ADVANCED_NODE_TYPES.map((type) => {
            const info = NODE_TYPE_INFO[type];
            const IconComponent = ICON_MAP[info.icon] || FiberManualRecord;

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
      </Box>

      {/* Help text */}
      <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#666', mb: 0.5 }}>
          <strong>How to build:</strong>
        </Typography>
        <Typography sx={{ fontSize: '0.55rem', color: '#888' }}>
          1. Drag states onto the canvas<br />
          2. Add Approval nodes between states<br />
          3. Connect Approval → State to create action buttons<br />
          4. Click connections to configure button labels
        </Typography>
      </Box>
    </Box>
  );
}

export default NodePalette;
