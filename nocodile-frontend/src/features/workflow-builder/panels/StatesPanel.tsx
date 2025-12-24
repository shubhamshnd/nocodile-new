import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Divider,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ArrowForward,
  FiberManualRecord,
} from '@mui/icons-material';

export interface WorkflowState {
  id: string;
  name: string;
  key: string;
  isInitial: boolean;
  isFinal: boolean;
  config?: {
    ui?: {
      color?: string;
    };
    permissions?: {
      allowEdit?: boolean;
    };
  };
}

export interface WorkflowTransition {
  id: string;
  fromStateId: string;
  toStateId: string;
  label: string;
  config?: {
    requiresComment?: boolean;
    variant?: 'primary' | 'success' | 'warning' | 'error';
  };
}

interface StatesPanelProps {
  workflowId: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  onStatesChange: (states: WorkflowState[]) => void;
  onTransitionsChange: (transitions: WorkflowTransition[]) => void;
}

const STATE_COLORS = [
  { value: '#2196F3', label: 'Blue' },
  { value: '#4CAF50', label: 'Green' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#F44336', label: 'Red' },
  { value: '#9C27B0', label: 'Purple' },
  { value: '#00BCD4', label: 'Cyan' },
  { value: '#FFEB3B', label: 'Yellow' },
  { value: '#607D8B', label: 'Gray' },
];

export function StatesPanel({
  states,
  transitions,
  onStatesChange,
  onTransitionsChange,
}: StatesPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<WorkflowState | null>(null);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);

  // State form data
  const [stateName, setStateName] = useState('');
  const [stateKey, setStateKey] = useState('');
  const [stateColor, setStateColor] = useState('#2196F3');
  const [isInitial, setIsInitial] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [allowEdit, setAllowEdit] = useState(true);

  // Transition form data
  const [fromStateId, setFromStateId] = useState('');
  const [toStateId, setToStateId] = useState('');
  const [transitionLabel, setTransitionLabel] = useState('');
  const [transitionVariant, setTransitionVariant] = useState<'primary' | 'success' | 'warning' | 'error'>('primary');
  const [requiresComment, setRequiresComment] = useState(false);

  const openStateDialog = (state?: WorkflowState) => {
    if (state) {
      setEditingState(state);
      setStateName(state.name);
      setStateKey(state.key);
      setStateColor(state.config?.ui?.color || '#2196F3');
      setIsInitial(state.isInitial);
      setIsFinal(state.isFinal);
      setAllowEdit(state.config?.permissions?.allowEdit !== false);
    } else {
      setEditingState(null);
      setStateName('');
      setStateKey('');
      setStateColor('#2196F3');
      setIsInitial(states.length === 0); // First state is initial by default
      setIsFinal(false);
      setAllowEdit(true);
    }
    setStateDialogOpen(true);
  };

  const closeStateDialog = () => {
    setStateDialogOpen(false);
    setEditingState(null);
  };

  const handleSaveState = () => {
    if (!stateName.trim() || !stateKey.trim()) return;

    const newState: WorkflowState = {
      id: editingState?.id || `state_${Date.now()}`,
      name: stateName.trim(),
      key: stateKey.trim().toUpperCase(),
      isInitial,
      isFinal,
      config: {
        ui: { color: stateColor },
        permissions: { allowEdit },
      },
    };

    if (editingState) {
      // Update existing state
      onStatesChange(states.map((s) => (s.id === editingState.id ? newState : s)));
    } else {
      // Add new state
      onStatesChange([...states, newState]);
    }

    closeStateDialog();
  };

  const handleDeleteState = (stateId: string) => {
    onStatesChange(states.filter((s) => s.id !== stateId));
    // Also remove transitions that reference this state
    onTransitionsChange(
      transitions.filter((t) => t.fromStateId !== stateId && t.toStateId !== stateId)
    );
  };

  const openTransitionDialog = (transition?: WorkflowTransition) => {
    if (transition) {
      setEditingTransition(transition);
      setFromStateId(transition.fromStateId);
      setToStateId(transition.toStateId);
      setTransitionLabel(transition.label);
      setTransitionVariant(transition.config?.variant || 'primary');
      setRequiresComment(transition.config?.requiresComment || false);
    } else {
      setEditingTransition(null);
      setFromStateId('');
      setToStateId('');
      setTransitionLabel('');
      setTransitionVariant('primary');
      setRequiresComment(false);
    }
    setTransitionDialogOpen(true);
  };

  const closeTransitionDialog = () => {
    setTransitionDialogOpen(false);
    setEditingTransition(null);
  };

  const handleSaveTransition = () => {
    if (!fromStateId || !toStateId || !transitionLabel.trim()) return;

    const newTransition: WorkflowTransition = {
      id: editingTransition?.id || `transition_${Date.now()}`,
      fromStateId,
      toStateId,
      label: transitionLabel.trim(),
      config: {
        variant: transitionVariant,
        requiresComment,
      },
    };

    if (editingTransition) {
      // Update existing transition
      onTransitionsChange(
        transitions.map((t) => (t.id === editingTransition.id ? newTransition : t))
      );
    } else {
      // Add new transition
      onTransitionsChange([...transitions, newTransition]);
    }

    closeTransitionDialog();
  };

  const handleDeleteTransition = (transitionId: string) => {
    onTransitionsChange(transitions.filter((t) => t.id !== transitionId));
  };

  const getStateName = (stateId: string) => {
    return states.find((s) => s.id === stateId)?.name || 'Unknown';
  };

  const getVariantColor = (variant?: string) => {
    switch (variant) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#F44336';
      case 'warning':
        return '#FF9800';
      default:
        return '#2196F3';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 42 }}>
          <Tab label="States" sx={{ fontSize: '0.75rem', minHeight: 42, py: 1 }} />
          <Tab label="Transitions" sx={{ fontSize: '0.75rem', minHeight: 42, py: 1 }} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {activeTab === 0 && (
          <Box>
            {/* States Tab */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Workflow States ({states.length})
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Add fontSize="small" />}
                onClick={() => openStateDialog()}
                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
              >
                Add State
              </Button>
            </Box>

            {states.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#999', mb: 1 }}>
                  No states configured
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                  Start by adding your first state (e.g., "Draft", "Submitted", "Approved")
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {states.map((state) => (
                  <Paper
                    key={state.id}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&:hover': { bgcolor: '#fafafa' },
                    }}
                  >
                    <FiberManualRecord
                      sx={{ color: state.config?.ui?.color || '#2196F3', fontSize: '1rem' }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {state.name}
                        </Typography>
                        {state.isInitial && (
                          <Chip label="Initial" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                        {state.isFinal && (
                          <Chip label="Final" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
                        Key: {state.key}
                        {state.config?.permissions?.allowEdit === false && ' • Read-only'}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => openStateDialog(state)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteState(state.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Transitions Tab */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                State Transitions ({transitions.length})
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<Add fontSize="small" />}
                onClick={() => openTransitionDialog()}
                disabled={states.length < 2}
                sx={{ fontSize: '0.7rem', textTransform: 'none' }}
              >
                Add Transition
              </Button>
            </Box>

            {states.length < 2 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                  Add at least 2 states before creating transitions
                </Typography>
              </Paper>
            ) : transitions.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#999', mb: 1 }}>
                  No transitions configured
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
                  Transitions define how documents move between states
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {transitions.map((transition) => (
                  <Paper
                    key={transition.id}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      '&:hover': { bgcolor: '#fafafa' },
                    }}
                  >
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={getStateName(transition.fromStateId)}
                        size="small"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                      <ArrowForward sx={{ fontSize: '1rem', color: '#999' }} />
                      <Chip
                        label={getStateName(transition.toStateId)}
                        size="small"
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                      <Chip
                        label={transition.label}
                        size="small"
                        sx={{
                          fontSize: '0.7rem',
                          bgcolor: getVariantColor(transition.config?.variant),
                          color: '#fff',
                        }}
                      />
                      {transition.config?.requiresComment && (
                        <Typography sx={{ fontSize: '0.65rem', color: '#999' }}>
                          (requires comment)
                        </Typography>
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => openTransitionDialog(transition)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTransition(transition.id)}
                      color="error"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* State Dialog */}
      <Dialog open={stateDialogOpen} onClose={closeStateDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {editingState ? 'Edit State' : 'Add State'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="State Name"
              value={stateName}
              onChange={(e) => {
                setStateName(e.target.value);
                // Auto-generate key from name if creating new
                if (!editingState) {
                  setStateKey(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                }
              }}
              placeholder="e.g., Draft, Submitted, Approved"
              InputProps={{ sx: { fontSize: '0.8rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            />

            <TextField
              fullWidth
              size="small"
              label="State Key"
              value={stateKey}
              onChange={(e) => setStateKey(e.target.value.toUpperCase())}
              placeholder="e.g., DRAFT, SUBMITTED, APPROVED"
              disabled={!!editingState}
              helperText={editingState ? 'Key cannot be changed after creation' : 'Used in code and cannot be changed later'}
              InputProps={{ sx: { fontSize: '0.8rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
              FormHelperTextProps={{ sx: { fontSize: '0.7rem' } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8rem' }}>Color</InputLabel>
              <Select
                value={stateColor}
                onChange={(e) => setStateColor(e.target.value)}
                label="Color"
                sx={{ fontSize: '0.8rem' }}
              >
                {STATE_COLORS.map((color) => (
                  <MenuItem key={color.value} value={color.value} sx={{ fontSize: '0.8rem' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiberManualRecord sx={{ color: color.value, fontSize: '1rem' }} />
                      {color.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isInitial}
                  onChange={(e) => setIsInitial(e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: '0.75rem' }}>Initial State</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={isFinal}
                  onChange={(e) => setIsFinal(e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: '0.75rem' }}>Final State</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={allowEdit}
                  onChange={(e) => setAllowEdit(e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: '0.75rem' }}>Allow Editing</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStateDialog} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveState}
            variant="contained"
            disabled={!stateName.trim() || !stateKey.trim()}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            {editingState ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onClose={closeTransitionDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', fontWeight: 600 }}>
          {editingTransition ? 'Edit Transition' : 'Add Transition'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8rem' }}>From State</InputLabel>
              <Select
                value={fromStateId}
                onChange={(e) => setFromStateId(e.target.value)}
                label="From State"
                sx={{ fontSize: '0.8rem' }}
              >
                {states.map((state) => (
                  <MenuItem key={state.id} value={state.id} sx={{ fontSize: '0.8rem' }}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8rem' }}>To State</InputLabel>
              <Select
                value={toStateId}
                onChange={(e) => setToStateId(e.target.value)}
                label="To State"
                sx={{ fontSize: '0.8rem' }}
              >
                {states
                  .filter((s) => s.id !== fromStateId)
                  .map((state) => (
                    <MenuItem key={state.id} value={state.id} sx={{ fontSize: '0.8rem' }}>
                      {state.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Button Label"
              value={transitionLabel}
              onChange={(e) => setTransitionLabel(e.target.value)}
              placeholder="e.g., Submit, Approve, Reject"
              InputProps={{ sx: { fontSize: '0.8rem' } }}
              InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            />

            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8rem' }}>Button Color</InputLabel>
              <Select
                value={transitionVariant}
                onChange={(e) => setTransitionVariant(e.target.value as any)}
                label="Button Color"
                sx={{ fontSize: '0.8rem' }}
              >
                <MenuItem value="primary" sx={{ fontSize: '0.8rem' }}>Blue (Primary)</MenuItem>
                <MenuItem value="success" sx={{ fontSize: '0.8rem' }}>Green (Success)</MenuItem>
                <MenuItem value="warning" sx={{ fontSize: '0.8rem' }}>Orange (Warning)</MenuItem>
                <MenuItem value="error" sx={{ fontSize: '0.8rem' }}>Red (Error)</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={requiresComment}
                  onChange={(e) => setRequiresComment(e.target.checked)}
                />
              }
              label={<Typography sx={{ fontSize: '0.75rem' }}>Requires Comment</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTransitionDialog} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTransition}
            variant="contained"
            disabled={!fromStateId || !toStateId || !transitionLabel.trim()}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            {editingTransition ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
