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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { documentTypes, applications } from '../services/api';
import type { DocumentType, Application } from '../types';

export default function DocumentTypes() {
  const [items, setItems] = useState<DocumentType[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [formData, setFormData] = useState({
    applicationId: '',
    name: '',
    slug: '',
    settings: { ui: { icon: 'file', color: '#1976d2' } },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dts, appsList] = await Promise.all([
        documentTypes.list(),
        applications.list(),
      ]);
      setItems(dts);
      setApps(appsList);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: DocumentType) => {
    if (item) {
      setEditing(item);
      setFormData({
        applicationId: item.applicationId,
        name: item.name,
        slug: item.slug,
        settings: { ui: { icon: item.settings?.ui?.icon || 'file', color: item.settings?.ui?.color || '#1976d2' } },
      });
    } else {
      setEditing(null);
      setFormData({
        applicationId: apps[0]?.id || '',
        name: '',
        slug: '',
        settings: { ui: { icon: 'file', color: '#1976d2' } },
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
        await documentTypes.update(editing.id, formData);
      } else {
        await documentTypes.create(formData);
      }
      handleClose();
      loadData();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;
    try {
      await documentTypes.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getAppName = (appId: string) => {
    return apps.find((a) => a.id === appId)?.name || '-';
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
          Document Types
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={() => handleOpen()}
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          disabled={apps.length === 0}
        >
          Add Document Type
        </Button>
      </Box>

      {apps.length === 0 && (
        <Card sx={{ p: 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            Create an Application first before adding Document Types.
          </Typography>
        </Card>
      )}

      {apps.length > 0 && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Slug</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Application</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Color</TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, fontSize: '0.75rem', color: 'text.secondary' }}>
                      No document types yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{item.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        <code>{item.slug}</code>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <Chip label={getAppName(item.applicationId)} size="small" sx={{ fontSize: '0.7rem' }} />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            borderRadius: 0.5,
                            bgcolor: item.settings?.ui?.color || '#1976d2',
                          }}
                        />
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
          {editing ? 'Edit Document Type' : 'New Document Type'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <FormControl fullWidth size="small" margin="dense">
            <InputLabel sx={{ fontSize: '0.8rem' }}>Application</InputLabel>
            <Select
              value={formData.applicationId}
              onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
              label="Application"
              sx={{ fontSize: '0.8rem' }}
              disabled={!!editing}
            >
              {apps.map((app) => (
                <MenuItem key={app.id} value={app.id} sx={{ fontSize: '0.8rem' }}>
                  {app.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            margin="dense"
            helperText="Unique identifier (e.g., cargo_manifest)"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' } }}
            FormHelperTextProps={{ sx: { fontSize: '0.7rem' } }}
          />
          <TextField
            fullWidth
            size="small"
            label="Color"
            type="color"
            value={formData.settings?.ui?.color || '#1976d2'}
            onChange={(e) =>
              setFormData({
                ...formData,
                settings: { ...formData.settings, ui: { ...formData.settings?.ui, color: e.target.value } },
              })
            }
            margin="dense"
            InputProps={{ sx: { fontSize: '0.8rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.8rem' }, shrink: true }}
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
