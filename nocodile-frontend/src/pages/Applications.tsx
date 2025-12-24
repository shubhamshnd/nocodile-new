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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { applications } from '../services/api';
import type { Application } from '../types';

export default function Applications() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await applications.list();
      setItems(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: Application) => {
    if (item) {
      setEditing(item);
      setFormData({ name: item.name, description: item.description });
    } else {
      setEditing(null);
      setFormData({ name: '', description: '' });
    }
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditing(null);
    setFormData({ name: '', description: '' });
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await applications.update(editing.id, formData);
      } else {
        await applications.create(formData);
      }
      handleClose();
      loadData();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    try {
      await applications.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
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
          Applications
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={() => handleOpen()}
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
        >
          Add Application
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, fontSize: '0.75rem', color: 'text.secondary' }}>
                    No applications yet. Click "Add Application" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontSize: '0.8rem' }}>{item.name}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {item.description || '-'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem', py: 1.5 }}>
          {editing ? 'Edit Application' : 'New Application'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="dense"
            multiline
            rows={2}
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} size="small" sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            size="small"
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            {editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
