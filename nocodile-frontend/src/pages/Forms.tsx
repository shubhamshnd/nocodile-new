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
} from '@mui/material';
import { Add, Edit, Delete, Build } from '@mui/icons-material';
import { forms, documentTypes } from '../services/api';
import type { Form, DocumentType, FormStage } from '../types';

export default function Forms() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Form[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Form | null>(null);
  const [formData, setFormData] = useState({
    documentTypeId: '',
    name: '',
    stages: { mode: 'stepper' as const, allowPartialSave: true, stages: [] as FormStage[] },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [formsList, dtsList] = await Promise.all([
        forms.list(),
        documentTypes.list(),
      ]);
      setItems(formsList);
      setDocTypes(dtsList);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: Form) => {
    if (item) {
      setEditing(item);
      setFormData({
        documentTypeId: item.documentTypeId,
        name: item.name,
        stages: { mode: (item.stages?.mode || 'stepper') as 'stepper', allowPartialSave: item.stages?.allowPartialSave ?? true, stages: item.stages?.stages || [] },
      });
    } else {
      setEditing(null);
      setFormData({
        documentTypeId: docTypes[0]?.id || '',
        name: '',
        stages: { mode: 'stepper', allowPartialSave: true, stages: [] },
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
        await forms.update(editing.id, formData);
      } else {
        const newForm = await forms.create(formData);
        // Navigate to builder after creating
        handleClose();
        navigate(`/forms/${newForm.id}/builder`);
        return;
      }
      handleClose();
      loadData();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;
    try {
      await forms.delete(id);
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
          Forms
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={() => handleOpen()}
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          disabled={docTypes.length === 0}
        >
          Add Form
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
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Stages</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, fontSize: '0.75rem', color: 'text.secondary' }}>
                      No forms yet.
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
                        {item.stages?.stages?.length || 0} stages
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Build sx={{ fontSize: 14 }} />}
                          onClick={() => navigate(`/forms/${item.id}/builder`)}
                          sx={{ fontSize: '0.7rem', textTransform: 'none', mr: 1 }}
                        >
                          Builder
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

      {/* Form Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editing ? 'Edit Form' : 'New Form'}
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
            label="Form Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            {editing ? 'Save' : 'Create & Open Builder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
