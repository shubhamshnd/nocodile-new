import { useEffect, useState } from 'react';
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
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, ArrowForward } from '@mui/icons-material';
import { childForms, documentTypes, workflows } from '../services/api';
import type { ChildForm, DocumentType, Workflow, ChildFormVisibility } from '../types';

export default function ChildForms() {
  const [items, setItems] = useState<ChildForm[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildForm | null>(null);
  const [formData, setFormData] = useState({
    parentDocumentTypeId: '',
    childDocumentTypeId: '',
    relationType: 'one_to_many' as ChildForm['relationType'],
    visibility: { visibleInStates: [], conditions: [] } as ChildFormVisibility,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [cfList, dtsList, wfsList] = await Promise.all([
        childForms.list(),
        documentTypes.list(),
        workflows.list(undefined, true),
      ]);
      setItems(cfList);
      setDocTypes(dtsList);
      setAllWorkflows(wfsList);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: ChildForm) => {
    if (item) {
      setEditing(item);
      setFormData({
        parentDocumentTypeId: item.parentDocumentTypeId,
        childDocumentTypeId: item.childDocumentTypeId,
        relationType: item.relationType,
        visibility: item.visibility || { visibleInStates: [], conditions: [] },
      });
    } else {
      setEditing(null);
      setFormData({
        parentDocumentTypeId: docTypes[0]?.id || '',
        childDocumentTypeId: docTypes[0]?.id || '',
        relationType: 'one_to_many',
        visibility: { visibleInStates: [], conditions: [] },
      });
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
        await childForms.update(editing.id, {
          relationType: formData.relationType,
          visibility: formData.visibility,
        });
      } else {
        await childForms.create(formData);
      }
      handleClose();
      loadData();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this child form relation?')) return;
    try {
      await childForms.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getDocTypeName = (id: string) => docTypes.find((d) => d.id === id)?.name || '-';

  const getParentWorkflowStates = () => {
    const parentWfs = allWorkflows.filter((w) => w.documentTypeId === formData.parentDocumentTypeId);
    const states: { key: string; name: string }[] = [];
    parentWfs.forEach((wf) => {
      wf.states?.forEach((s) => {
        if (!states.find((st) => st.key === s.key)) {
          states.push({ key: s.key, name: s.name });
        }
      });
    });
    return states;
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      visibility: {
        ...formData.visibility,
        conditions: [...(formData.visibility.conditions || []), { field: '', operator: '=', value: '' }],
      },
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      visibility: {
        ...formData.visibility,
        conditions: formData.visibility.conditions?.filter((_, i) => i !== index),
      },
    });
  };

  const updateCondition = (index: number, key: string, value: string) => {
    const newConditions = [...(formData.visibility.conditions || [])];
    newConditions[index] = { ...newConditions[index], [key]: value };
    setFormData({
      ...formData,
      visibility: { ...formData.visibility, conditions: newConditions },
    });
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
          Child Form Relations
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={() => handleOpen()}
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          disabled={docTypes.length === 0}
        >
          Add Relation
        </Button>
      </Box>

      {docTypes.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Create Document Types first.
          </Typography>
        </Card>
      )}

      {docTypes.length > 0 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Parent</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}></TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Child</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Relation</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Visible In States</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, fontSize: '0.75rem', color: 'text.secondary' }}>
                      No child form relations yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        <Chip label={getDocTypeName(item.parentDocumentTypeId)} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <ArrowForward fontSize="small" sx={{ color: 'text.secondary' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        <Chip label={getDocTypeName(item.childDocumentTypeId)} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {item.relationType.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {(item.visibility?.visibleInStates?.length ?? 0) > 0 ? (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {item.visibility?.visibleInStates?.map((s) => (
                              <Chip key={s} label={s} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                            ))}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Always</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editing ? 'Edit Child Form Relation' : 'New Child Form Relation'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Parent Document Type</InputLabel>
            <Select
              value={formData.parentDocumentTypeId}
              onChange={(e) => setFormData({ ...formData, parentDocumentTypeId: e.target.value })}
              label="Parent Document Type"
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

          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Child Document Type</InputLabel>
            <Select
              value={formData.childDocumentTypeId}
              onChange={(e) => setFormData({ ...formData, childDocumentTypeId: e.target.value })}
              label="Child Document Type"
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

          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Relation Type</InputLabel>
            <Select
              value={formData.relationType}
              onChange={(e) => setFormData({ ...formData, relationType: e.target.value as ChildForm['relationType'] })}
              label="Relation Type"
              sx={{ fontSize: '0.8rem' }}
            >
              <MenuItem value="one_to_one" sx={{ fontSize: '0.8rem' }}>One to One</MenuItem>
              <MenuItem value="one_to_many" sx={{ fontSize: '0.8rem' }}>One to Many</MenuItem>
              <MenuItem value="many_to_many" sx={{ fontSize: '0.8rem' }}>Many to Many</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, mb: 1 }}>Visibility Rules</Typography>

          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Visible In States</InputLabel>
            <Select
              multiple
              value={formData.visibility.visibleInStates || []}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  visibility: { ...formData.visibility, visibleInStates: e.target.value as string[] },
                })
              }
              label="Visible In States"
              sx={{ fontSize: '0.8rem' }}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((v) => (
                    <Chip key={v} label={v} size="small" sx={{ fontSize: '0.65rem' }} />
                  ))}
                </Box>
              )}
            >
              {getParentWorkflowStates().map((s) => (
                <MenuItem key={s.key} value={s.key} sx={{ fontSize: '0.8rem' }}>
                  {s.name} ({s.key})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 500 }}>Field Conditions</Typography>
              <Button size="small" onClick={addCondition} sx={{ fontSize: '0.7rem', textTransform: 'none' }}>
                Add Condition
              </Button>
            </Box>
            {(formData.visibility.conditions || []).map((cond, idx) => (
              <Paper key={idx} sx={{ p: 1, mb: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Field"
                  value={cond.field}
                  onChange={(e) => updateCondition(idx, 'field', e.target.value)}
                  sx={{ flex: 1 }}
                  InputProps={{ sx: { fontSize: '0.75rem' } }}
                  InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                />
                <FormControl size="small" sx={{ width: 80 }}>
                  <Select
                    value={cond.operator}
                    onChange={(e) => updateCondition(idx, 'operator', e.target.value)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    <MenuItem value="=" sx={{ fontSize: '0.75rem' }}>=</MenuItem>
                    <MenuItem value="!=" sx={{ fontSize: '0.75rem' }}>!=</MenuItem>
                    <MenuItem value="in" sx={{ fontSize: '0.75rem' }}>in</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Value"
                  value={cond.value}
                  onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                  sx={{ flex: 1 }}
                  InputProps={{ sx: { fontSize: '0.75rem' } }}
                  InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
                />
                <IconButton size="small" onClick={() => removeCondition(idx)} color="error">
                  <Delete fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
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
    </Box>
  );
}
