import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
} from '@mui/icons-material';
import { roles as rolesApi, type RoleData } from '../services/api';

export default function Roles() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);

  // Form state
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const rolesData = await rolesApi.list();
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setRoleName('');
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleData) => {
    setEditingRole(role);
    setRoleName(role.name);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRole(null);
    setRoleName('');
  };

  const handleSave = async () => {
    setError(null);

    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      if (editingRole) {
        await rolesApi.update(editingRole.id, { name: roleName.trim() });
      } else {
        await rolesApi.create({ name: roleName.trim() });
      }

      closeDialog();
      loadData();
    } catch (err: any) {
      console.error('Failed to save role:', err);
      setError(err.response?.data?.error || 'Failed to save role');
    }
  };

  const openDeleteDialog = (role: RoleData) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    setError(null);

    try {
      await rolesApi.delete(roleToDelete.id);
      closeDeleteDialog();
      loadData();
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      setError(err.response?.data?.error || 'Failed to delete role');
      closeDeleteDialog();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Roles
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user roles and access levels
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          Add Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Roles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Role Name</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No roles found. Click "Add Role" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group sx={{ color: '#999', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {role.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${role.userCount} users`} size="small" />
                  </TableCell>
                  <TableCell>
                    {role.permissions.length > 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {role.permissions.length} permissions
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No permissions
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(role)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDeleteDialog(role)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Role Name"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              placeholder="e.g., Manager, Approver, Viewer"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!roleName.trim()}
          >
            {editingRole ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete role "{roleToDelete?.name}"?
            {roleToDelete && roleToDelete.userCount > 0 && (
              <>
                {' '}
                This role is currently assigned to {roleToDelete.userCount} user
                {roleToDelete.userCount !== 1 && 's'}.
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
