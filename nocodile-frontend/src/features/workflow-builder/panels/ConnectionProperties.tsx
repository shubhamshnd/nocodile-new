import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Alert,
} from '@mui/material';
import type { ActionConfig } from '../types';

interface ConnectionPropertiesProps {
  connection: {
    id: string;
    sourceNodeId: string;
    targetNodeId: string;
    actionConfig?: ActionConfig;
  };
  sourceNodeType: string;
  targetNodeType: string;
  onUpdate: (actionConfig: ActionConfig) => void;
}

export function ConnectionProperties({
  connection,
  sourceNodeType,
  targetNodeType,
  onUpdate,
}: ConnectionPropertiesProps) {
  const actionConfig = connection.actionConfig || {
    label: 'Approve',
    buttonColor: 'success',
    requiresComment: false,
    order: 1,
  };

  const isApprovalToState = sourceNodeType === 'approval' && targetNodeType === 'state';

  if (!isApprovalToState) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
          Connection properties are only available for Approval → State connections.
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
          This connection flows from {sourceNodeType} to {targetNodeType}.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="info" sx={{ fontSize: '0.65rem', py: 0.5 }}>
        This connection creates an approval button. Configure how it appears to approvers.
      </Alert>

      {/* Button Label */}
      <TextField
        fullWidth
        size="small"
        label="Button Label"
        value={actionConfig.label}
        onChange={(e) => onUpdate({ ...actionConfig, label: e.target.value })}
        helperText="Text displayed on the approval button"
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        FormHelperTextProps={{ sx: { fontSize: '0.65rem' } }}
      />

      {/* Button Color */}
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Button Color</InputLabel>
        <Select
          value={actionConfig.buttonColor}
          onChange={(e) => onUpdate({ ...actionConfig, buttonColor: e.target.value as ActionConfig['buttonColor'] })}
          label="Button Color"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="success" sx={{ fontSize: '0.75rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: '50%' }} />
              Green (Success)
            </Box>
          </MenuItem>
          <MenuItem value="error" sx={{ fontSize: '0.75rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#f44336', borderRadius: '50%' }} />
              Red (Error/Reject)
            </Box>
          </MenuItem>
          <MenuItem value="warning" sx={{ fontSize: '0.75rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: '50%' }} />
              Orange (Warning)
            </Box>
          </MenuItem>
          <MenuItem value="primary" sx={{ fontSize: '0.75rem' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: '#2196f3', borderRadius: '50%' }} />
              Blue (Primary)
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Requires Comment */}
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={actionConfig.requiresComment}
            onChange={(e) => onUpdate({ ...actionConfig, requiresComment: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Require Comment</Typography>}
      />

      {/* Display Order */}
      <TextField
        fullWidth
        size="small"
        type="number"
        label="Display Order"
        value={actionConfig.order || 1}
        onChange={(e) => onUpdate({ ...actionConfig, order: parseInt(e.target.value) || 1 })}
        helperText="Order in which buttons appear (1, 2, 3...)"
        InputProps={{ sx: { fontSize: '0.75rem' }, inputProps: { min: 1 } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        FormHelperTextProps={{ sx: { fontSize: '0.65rem' } }}
      />

      <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
        <Typography sx={{ fontSize: '0.65rem', color: '#666', mb: 0.5, fontWeight: 600 }}>
          Preview:
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
          When an approver views this document, they will see a{' '}
          <strong style={{ color: actionConfig.buttonColor === 'success' ? '#4caf50' : actionConfig.buttonColor === 'error' ? '#f44336' : actionConfig.buttonColor === 'warning' ? '#ff9800' : '#2196f3' }}>
            "{actionConfig.label}"
          </strong>{' '}
          button{actionConfig.requiresComment ? ' (requires comment)' : ''}.
        </Typography>
      </Box>
    </Box>
  );
}

export default ConnectionProperties;
