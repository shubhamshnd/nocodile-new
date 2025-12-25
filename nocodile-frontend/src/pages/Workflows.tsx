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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { workflows, documentTypes, workflowGraph } from '../services/api';
import type { Workflow, DocumentType } from '../types';

export default function Workflows() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Workflow[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Workflow | null>(null);
  const [formData, setFormData] = useState({ documentTypeId: '', name: '', isDefault: false });

  // Track node counts for each workflow
  const [nodeCounts, setNodeCounts] = useState<Record<string, number>>({});

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

      // Load node counts for each workflow
      const counts: Record<string, number> = {};
      for (const wf of wfList) {
        try {
          const graph = await workflowGraph.get(wf.id);
          // Count only state nodes
          const stateNodes = graph.nodes?.filter(n => n.type === 'state') || [];
          counts[wf.id] = stateNodes.length;
        } catch {
          counts[wf.id] = 0;
        }
      }
      setNodeCounts(counts);
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

  const getDocTypeName = (id: string) => docTypes.find((d) => d.id === id)?.name || '-';

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
                        {nodeCounts[item.id] || 0} states
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
    </Box>
  );
}
