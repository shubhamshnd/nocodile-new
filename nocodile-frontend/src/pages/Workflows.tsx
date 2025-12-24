import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Switch,
  FormControlLabel,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Edit, Delete, ArrowForward, Circle } from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { workflows, workflowStates, workflowTransitions, documentTypes } from '../services/api';
import type { Workflow, WorkflowState, WorkflowTransition, DocumentType, TransitionButton } from '../types';

interface SortableStateProps {
  state: WorkflowState;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableState({ state, onEdit, onDelete }: SortableStateProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: state.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
    >
      <Circle
        {...attributes}
        {...listeners}
        sx={{
          color: state.config?.ui?.color || '#1976d2',
          fontSize: 16,
          cursor: 'grab',
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{state.name}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
            Key: {state.key}
          </Typography>
          {state.isInitial && <Chip label="Initial" size="small" color="success" sx={{ fontSize: '0.6rem', height: 18 }} />}
          {state.isFinal && <Chip label="Final" size="small" color="error" sx={{ fontSize: '0.6rem', height: 18 }} />}
        </Box>
      </Box>
      <IconButton size="small" onClick={onEdit}>
        <Edit fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onDelete} color="error">
        <Delete fontSize="small" />
      </IconButton>
    </Paper>
  );
}

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1', '#c2185b', '#455a64'];

export default function Workflows() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Workflow[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({ documentTypeId: '', name: '', isDefault: false });

  // Builder state
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  // State dialog
  const [stateDialogOpen, setStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<WorkflowState | null>(null);
  const [stateFormData, setStateFormData] = useState({
    name: '',
    key: '',
    isInitial: false,
    isFinal: false,
    config: { ui: { color: '#1976d2' }, permissions: { allowEdit: true } },
  });

  // Transition dialog
  const [transitionDialogOpen, setTransitionDialogOpen] = useState(false);
  const [editingTransition, setEditingTransition] = useState<WorkflowTransition | null>(null);
  const [transitionFormData, setTransitionFormData] = useState({
    fromStateId: '',
    toStateId: '',
    buttons: [] as TransitionButton[],
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wfList, dtsList] = await Promise.all([
        workflows.list(undefined, true),
        documentTypes.list(),
      ]);
      setItems(wfList);
      setDocTypes(dtsList);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: Workflow) => {
    if (item) {
      setEditing(item);
      setFormData({ documentTypeId: item.documentTypeId, name: item.name, isDefault: item.isDefault });
    } else {
      setEditing(null);
      setFormData({ documentTypeId: docTypes[0]?.id || '', name: '', isDefault: false });
    }
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await workflows.update(editing.id, formData);
      } else {
        await workflows.create(formData);
      }
      handleClose();
      loadData();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await workflows.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const openBuilder = async (wf: Workflow) => {
    const fullWf = await workflows.get(wf.id);
    setSelectedWorkflow(fullWf);
    setStates(fullWf.states || []);
    setTransitions(fullWf.transitions || []);
    setBuilderOpen(true);
  };

  const closeBuilder = () => {
    setBuilderOpen(false);
    setSelectedWorkflow(null);
    setStates([]);
    setTransitions([]);
    loadData();
  };

  // State handlers
  const openStateDialog = (state?: WorkflowState) => {
    if (state) {
      setEditingState(state);
      setStateFormData({
        name: state.name,
        key: state.key,
        isInitial: state.isInitial,
        isFinal: state.isFinal,
        config: { ui: { color: state.config?.ui?.color || '#1976d2' }, permissions: { allowEdit: state.config?.permissions?.allowEdit ?? true } },
      });
    } else {
      setEditingState(null);
      setStateFormData({
        name: '',
        key: '',
        isInitial: false,
        isFinal: false,
        config: { ui: { color: COLORS[states.length % COLORS.length] }, permissions: { allowEdit: true } },
      });
    }
    setStateDialogOpen(true);
  };

  const closeStateDialog = () => {
    setStateDialogOpen(false);
    setEditingState(null);
  };

  const saveState = async () => {
    try {
      if (editingState) {
        await workflowStates.update(editingState.id, stateFormData);
      } else {
        await workflowStates.create({ ...stateFormData, workflowId: selectedWorkflow!.id });
      }
      closeStateDialog();
      const fullWf = await workflows.get(selectedWorkflow!.id);
      setStates(fullWf.states || []);
    } catch (err) {
      console.error('Failed to save state:', err);
    }
  };

  const deleteState = async (id: string) => {
    if (!confirm('Delete this state?')) return;
    await workflowStates.delete(id);
    const fullWf = await workflows.get(selectedWorkflow!.id);
    setStates(fullWf.states || []);
    setTransitions(fullWf.transitions || []);
  };

  // Transition handlers
  const openTransitionDialog = (t?: WorkflowTransition) => {
    if (t) {
      setEditingTransition(t);
      setTransitionFormData({
        fromStateId: t.fromStateId,
        toStateId: t.toStateId,
        buttons: t.buttons || [],
      });
    } else {
      setEditingTransition(null);
      setTransitionFormData({
        fromStateId: states[0]?.id || '',
        toStateId: states[1]?.id || states[0]?.id || '',
        buttons: [{ key: 'proceed', label: 'Proceed', variant: 'primary', requiresComment: false, onClick: { action: 'transition', toState: '' } }],
      });
    }
    setTransitionDialogOpen(true);
  };

  const closeTransitionDialog = () => {
    setTransitionDialogOpen(false);
    setEditingTransition(null);
  };

  const saveTransition = async () => {
    try {
      const data = {
        ...transitionFormData,
        workflowId: selectedWorkflow!.id,
      };
      if (editingTransition) {
        await workflowTransitions.update(editingTransition.id, data);
      } else {
        await workflowTransitions.create(data);
      }
      closeTransitionDialog();
      const fullWf = await workflows.get(selectedWorkflow!.id);
      setTransitions(fullWf.transitions || []);
    } catch (err) {
      console.error('Failed to save transition:', err);
    }
  };

  const deleteTransition = async (id: string) => {
    if (!confirm('Delete this transition?')) return;
    await workflowTransitions.delete(id);
    const fullWf = await workflows.get(selectedWorkflow!.id);
    setTransitions(fullWf.transitions || []);
  };

  const getStateName = (id: string) => states.find((s) => s.id === id)?.name || '-';
  const getDocTypeName = (id: string) => docTypes.find((d) => d.id === id)?.name || '-';

  const handleDragEnd = (_event: DragEndEvent) => {
    // Just reorder visually, no persistence needed for state order
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
          Workflows
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={() => handleOpen()}
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          disabled={docTypes.length === 0}
        >
          Add Workflow
        </Button>
      </Box>

      {docTypes.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Create a Document Type first.
          </Typography>
        </Card>
      )}

      {docTypes.length > 0 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Document Type</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>States</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Default</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, fontSize: '0.75rem', color: 'text.secondary' }}>
                      No workflows yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{item.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip label={getDocTypeName(item.documentTypeId)} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {item.states?.length || 0} states
                      </TableCell>
                      <TableCell>
                        {item.isDefault && <Chip label="Default" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => navigate(`/workflows/${item.id}/builder`)}
                          sx={{ fontSize: '0.7rem', textTransform: 'none', mr: 1 }}
                        >
                          Visual Builder
                        </Button>
                        <Button
                          size="small"
                          onClick={() => openBuilder(item)}
                          sx={{ fontSize: '0.7rem', textTransform: 'none', mr: 1 }}
                        >
                          States
                        </Button>
                        <IconButton size="small" onClick={() => handleOpen(item)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Workflow Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editing ? 'Edit Workflow' : 'New Workflow'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Document Type</InputLabel>
            <Select
              value={formData.documentTypeId}
              onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
              label="Document Type"
              sx={{ fontSize: '0.8rem' }}
              disabled={!!editing}
            >
              {docTypes.map((dt) => (
                <MenuItem key={dt.id} value={dt.id} sx={{ fontSize: '0.8rem' }}>
                  {dt.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size="small"
            label="Workflow Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                size="small"
              />
            }
            label={<Typography sx={{ fontSize: '0.8rem' }}>Default Workflow</Typography>}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Workflow Builder Dialog */}
      <Dialog open={builderOpen} onClose={closeBuilder} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          Workflow Builder: {selectedWorkflow?.name}
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="States" sx={{ fontSize: '0.75rem', textTransform: 'none' }} />
            <Tab label="Transitions" sx={{ fontSize: '0.75rem', textTransform: 'none' }} />
          </Tabs>

          {tabIndex === 0 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Workflow States</Typography>
                <Button
                  size="small"
                  startIcon={<Add fontSize="small" />}
                  onClick={() => openStateDialog()}
                  sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                >
                  Add State
                </Button>
              </Box>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={states.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {states.length === 0 ? (
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 4 }}>
                      No states yet. Add states to define your workflow.
                    </Typography>
                  ) : (
                    states.map((state) => (
                      <SortableState
                        key={state.id}
                        state={state}
                        onEdit={() => openStateDialog(state)}
                        onDelete={() => deleteState(state.id)}
                      />
                    ))
                  )}
                </SortableContext>
              </DndContext>
            </Box>
          )}

          {tabIndex === 1 && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Transitions</Typography>
                <Button
                  size="small"
                  startIcon={<Add fontSize="small" />}
                  onClick={() => openTransitionDialog()}
                  sx={{ fontSize: '0.7rem', textTransform: 'none' }}
                  disabled={states.length < 2}
                >
                  Add Transition
                </Button>
              </Box>
              {transitions.length === 0 ? (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  {states.length < 2 ? 'Add at least 2 states first.' : 'No transitions yet.'}
                </Typography>
              ) : (
                transitions.map((t) => (
                  <Paper key={t.id} sx={{ p: 1.5, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={getStateName(t.fromStateId)} size="small" sx={{ fontSize: '0.7rem' }} />
                    <ArrowForward fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Chip label={getStateName(t.toStateId)} size="small" sx={{ fontSize: '0.7rem' }} />
                    <Box sx={{ flex: 1, display: 'flex', gap: 0.5, ml: 2 }}>
                      {t.buttons?.map((btn) => (
                        <Chip
                          key={btn.key}
                          label={btn.label}
                          size="small"
                          color={btn.variant === 'success' ? 'success' : btn.variant === 'error' ? 'error' : 'primary'}
                          sx={{ fontSize: '0.65rem' }}
                        />
                      ))}
                    </Box>
                    <IconButton size="small" onClick={() => openTransitionDialog(t)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => deleteTransition(t.id)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeBuilder} variant="contained" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* State Dialog */}
      <Dialog open={stateDialogOpen} onClose={closeStateDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editingState ? 'Edit State' : 'Add State'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="State Name"
            value={stateFormData.name}
            onChange={(e) => setStateFormData({ ...stateFormData, name: e.target.value })}
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Key"
            value={stateFormData.key}
            onChange={(e) => setStateFormData({ ...stateFormData, key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
            margin="dense"
            disabled={!!editingState}
            helperText="Unique identifier (e.g., PENDING, APPROVED)"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            FormHelperTextProps={{ sx: { fontSize: '0.7rem' } }}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small" margin="dense">
              <InputLabel sx={{ fontSize: '0.8rem' }}>Color</InputLabel>
              <Select
                value={stateFormData.config?.ui?.color || '#1976d2'}
                onChange={(e) =>
                  setStateFormData({
                    ...stateFormData,
                    config: { ...stateFormData.config, ui: { ...stateFormData.config?.ui, color: e.target.value } },
                  })
                }
                label="Color"
                sx={{ fontSize: '0.8rem' }}
              >
                {COLORS.map((c) => (
                  <MenuItem key={c} value={c}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: c }} />
                      {c}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={stateFormData.isInitial}
                  onChange={(e) => setStateFormData({ ...stateFormData, isInitial: e.target.checked })}
                  size="small"
                />
              }
              label={<Typography sx={{ fontSize: '0.8rem' }}>Initial State</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={stateFormData.isFinal}
                  onChange={(e) => setStateFormData({ ...stateFormData, isFinal: e.target.checked })}
                  size="small"
                />
              }
              label={<Typography sx={{ fontSize: '0.8rem' }}>Final State</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeStateDialog} size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={saveState} variant="contained" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editingState ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transition Dialog */}
      <Dialog open={transitionDialogOpen} onClose={closeTransitionDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editingTransition ? 'Edit Transition' : 'Add Transition'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>From State</InputLabel>
            <Select
              value={transitionFormData.fromStateId}
              onChange={(e) => setTransitionFormData({ ...transitionFormData, fromStateId: e.target.value })}
              label="From State"
              sx={{ fontSize: '0.8rem' }}
            >
              {states.map((s) => (
                <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.8rem' }}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>To State</InputLabel>
            <Select
              value={transitionFormData.toStateId}
              onChange={(e) => setTransitionFormData({ ...transitionFormData, toStateId: e.target.value })}
              label="To State"
              sx={{ fontSize: '0.8rem' }}
            >
              {states.map((s) => (
                <MenuItem key={s.id} value={s.id} sx={{ fontSize: '0.8rem' }}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider sx={{ my: 2 }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Transition Button</Typography>
          <TextField
            fullWidth
            size="small"
            label="Button Label"
            value={transitionFormData.buttons[0]?.label || ''}
            onChange={(e) =>
              setTransitionFormData({
                ...transitionFormData,
                buttons: [{ ...transitionFormData.buttons[0], label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, '_') }],
              })
            }
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Button Style</InputLabel>
            <Select
              value={transitionFormData.buttons[0]?.variant || 'primary'}
              onChange={(e) =>
                setTransitionFormData({
                  ...transitionFormData,
                  buttons: [{ ...transitionFormData.buttons[0], variant: e.target.value as TransitionButton['variant'] }],
                })
              }
              label="Button Style"
              sx={{ fontSize: '0.8rem' }}
            >
              <MenuItem value="primary" sx={{ fontSize: '0.8rem' }}>Primary</MenuItem>
              <MenuItem value="success" sx={{ fontSize: '0.8rem' }}>Success</MenuItem>
              <MenuItem value="warning" sx={{ fontSize: '0.8rem' }}>Warning</MenuItem>
              <MenuItem value="error" sx={{ fontSize: '0.8rem' }}>Error</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeTransitionDialog} size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={saveTransition} variant="contained" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editingTransition ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
