import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { WorkflowNodeType } from '../types';

interface ForkJoinPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string }>;
  nodeType: WorkflowNodeType;
}

export function ForkJoinProperties({
  config,
  onUpdate,
  nodeType,
}: ForkJoinPropertiesProps) {
  if (nodeType === 'fork') {
    const branches = (config.branches as Array<{ id: string; name: string }>) || [
      { id: 'branch_1', name: 'Branch 1' },
      { id: 'branch_2', name: 'Branch 2' },
    ];

    const addBranch = () => {
      const newId = `branch_${Date.now()}`;
      onUpdate({
        branches: [...branches, { id: newId, name: `Branch ${branches.length + 1}` }],
      });
    };

    const updateBranch = (index: number, updates: { name?: string }) => {
      const newBranches = [...branches];
      newBranches[index] = { ...newBranches[index], ...updates };
      onUpdate({ branches: newBranches });
    };

    const removeBranch = (index: number) => {
      if (branches.length <= 2) return; // Minimum 2 branches
      onUpdate({ branches: branches.filter((_, i) => i !== index) });
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
          Split the workflow into multiple parallel branches. All branches will execute simultaneously.
        </Typography>

        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>Parallel Branches</Typography>

        {branches.map((branch, index) => (
          <Box key={branch.id} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label={`Branch ${index + 1}`}
              value={branch.name}
              onChange={(e) => updateBranch(index, { name: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: '0.75rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
            />
            <IconButton
              size="small"
              onClick={() => removeBranch(index)}
              disabled={branches.length <= 2}
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={addBranch}
          sx={{ fontSize: '0.65rem', textTransform: 'none', alignSelf: 'flex-start' }}
        >
          Add Branch
        </Button>
      </Box>
    );
  }

  // Join node
  const joinType = (config.joinType as string) || 'all';
  const timeout = (config.timeout as {
    enabled: boolean;
    days: number;
    action: string;
  }) || { enabled: false, days: 7, action: 'continue' };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        Merge parallel branches back into a single path.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Join Type</InputLabel>
        <Select
          value={joinType}
          onChange={(e) => onUpdate({ joinType: e.target.value })}
          label="Join Type"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>
            All (AND) - Wait for all branches
          </MenuItem>
          <MenuItem value="any" sx={{ fontSize: '0.75rem' }}>
            Any (OR) - Continue when any branch completes
          </MenuItem>
        </Select>
      </FormControl>

      <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
        {joinType === 'all'
          ? 'All parallel branches must complete before continuing.'
          : 'Workflow continues as soon as any branch completes.'}
      </Typography>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={timeout.enabled}
            onChange={(e) =>
              onUpdate({ timeout: { ...timeout, enabled: e.target.checked } })
            }
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Enable Timeout</Typography>}
      />

      {timeout.enabled && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            label="Days"
            type="number"
            value={timeout.days}
            onChange={(e) =>
              onUpdate({ timeout: { ...timeout, days: parseInt(e.target.value) || 7 } })
            }
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
            InputProps={{ sx: { fontSize: '0.75rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>On Timeout</InputLabel>
            <Select
              value={timeout.action}
              onChange={(e) =>
                onUpdate({ timeout: { ...timeout, action: e.target.value } })
              }
              label="On Timeout"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="continue" sx={{ fontSize: '0.75rem' }}>Continue</MenuItem>
              <MenuItem value="escalate" sx={{ fontSize: '0.75rem' }}>Escalate</MenuItem>
              <MenuItem value="cancel" sx={{ fontSize: '0.75rem' }}>Cancel</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}
    </Box>
  );
}

export default ForkJoinProperties;
