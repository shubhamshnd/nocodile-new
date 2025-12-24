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
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Person,
  AdminPanelSettings,
} from '@mui/icons-material';
import { users as usersApi, roles as rolesApi, type UserData, type RoleData } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<RoleData[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersData, rolesData] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load users and roles');
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (user: UserData) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email);
    setPassword(''); // Don't populate password for security
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setIsStaff(user.isStaff);
    setIsSuperuser(user.isSuperuser);
    setSelectedRoles(user.groups.map(g => roles.find(r => r.id === g.id)!).filter(Boolean));
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setIsStaff(false);
    setIsSuperuser(false);
    setSelectedRoles([]);
  };

  const handleSave = async () => {
    setError(null);

    try {
      const userData = {
        username: username.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        isStaff,
        isSuperuser,
        groupIds: selectedRoles.map(r => r.id),
      };

      if (editingUser) {
        // Update existing user
        const data: any = userData;
        if (password.trim()) {
          data.password = password;
        }
        await usersApi.update(editingUser.id, data);
      } else {
        // Create new user
        if (!password.trim()) {
          setError('Password is required for new users');
          return;
        }
        await usersApi.create({ ...userData, password });
      }

      closeDialog();
      loadData();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setError(err.response?.data?.error || 'Failed to save user');
    }
  };

  const openDeleteDialog = (user: UserData) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;

    setError(null);

    try {
      await usersApi.delete(userToDelete.id);
      closeDeleteDialog();
      loadData();
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.error || 'Failed to delete user');
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
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage user accounts and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={openCreateDialog}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    No users found. Click "Add User" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ color: '#999', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>
                        {user.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : '-'}
                  </TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    {user.groups.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.groups.map((group) => (
                          <Chip key={group.id} label={group.name} size="small" />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {user.isSuperuser && (
                        <Chip
                          icon={<AdminPanelSettings />}
                          label="Superuser"
                          size="small"
                          color="error"
                        />
                      )}
                      {user.isStaff && !user.isSuperuser && (
                        <Chip label="Staff" size="small" color="primary" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(user)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => openDeleteDialog(user)} color="error">
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
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={!!editingUser}
              helperText={editingUser ? 'Username cannot be changed' : ''}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingUser}
              helperText={editingUser ? 'Leave blank to keep current password' : 'Required'}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Box>

            <Autocomplete
              multiple
              options={roles}
              getOptionLabel={(role) => role.name}
              value={selectedRoles}
              onChange={(_, newValue) => setSelectedRoles(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Roles" placeholder="Select roles" />
              )}
            />

            <FormControlLabel
              control={
                <Switch checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} />
              }
              label="Staff Access (can access admin panel)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={isSuperuser}
                  onChange={(e) => setIsSuperuser(e.target.checked)}
                  color="error"
                />
              }
              label="Superuser (full permissions)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!username.trim() || (!editingUser && !password.trim())}
          >
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be
            undone.
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
