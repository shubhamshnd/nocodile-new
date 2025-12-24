import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Switch,
  FormControlLabel,
  Autocomplete,
  TextField,
  Chip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { ViewPermission } from '../types';

interface ViewPermissionPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; username: string }>;
}

export function ViewPermissionProperties({
  config,
  onUpdate,
  formFields,
  roles,
  users,
}: ViewPermissionPropertiesProps) {
  const permissions = (config.permissions as ViewPermission[]) || [];

  const addPermission = () => {
    const newPermission: ViewPermission = {
      type: 'submitter',
      canView: true,
      canEdit: false,
    };
    onUpdate({ permissions: [...permissions, newPermission] });
  };

  const updatePermission = (index: number, updates: Partial<ViewPermission>) => {
    const newPermissions = [...permissions];
    newPermissions[index] = { ...newPermissions[index], ...updates };
    onUpdate({ permissions: newPermissions });
  };

  const removePermission = (index: number) => {
    onUpdate({ permissions: permissions.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        Configure who can view and edit the document at this stage.
      </Typography>

      {permissions.map((permission, index) => (
        <Box
          key={index}
          sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 1, bgcolor: '#fafafa' }}
        >
          <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel sx={{ fontSize: '0.7rem' }}>Type</InputLabel>
              <Select
                value={permission.type}
                onChange={(e) =>
                  updatePermission(index, { type: e.target.value as ViewPermission['type'] })
                }
                label="Type"
                sx={{ fontSize: '0.7rem' }}
              >
                <MenuItem value="submitter" sx={{ fontSize: '0.7rem' }}>Submitter</MenuItem>
                <MenuItem value="approver" sx={{ fontSize: '0.7rem' }}>Current Approver</MenuItem>
                <MenuItem value="role" sx={{ fontSize: '0.7rem' }}>Role</MenuItem>
                <MenuItem value="user" sx={{ fontSize: '0.7rem' }}>User</MenuItem>
                <MenuItem value="department" sx={{ fontSize: '0.7rem' }}>Department</MenuItem>
              </Select>
            </FormControl>

            {permission.type === 'role' && (
              <Autocomplete
                size="small"
                options={roles}
                getOptionLabel={(r) => r.name}
                value={roles.find((r) => r.id === permission.value) || null}
                onChange={(_, r) => updatePermission(index, { value: r?.id })}
                renderInput={(params) => <TextField {...params} placeholder="Select role" />}
                sx={{ flex: 1 }}
              />
            )}

            {permission.type === 'user' && (
              <Autocomplete
                size="small"
                options={users}
                getOptionLabel={(u) => `${u.firstName} ${u.lastName}`.trim() || u.username}
                value={users.find((u) => u.id === permission.value) || null}
                onChange={(_, u) => updatePermission(index, { value: u?.id })}
                renderInput={(params) => <TextField {...params} placeholder="Select user" />}
                sx={{ flex: 1 }}
              />
            )}

            {permission.type === 'department' && (
              <TextField
                size="small"
                placeholder="Department key"
                value={permission.value || ''}
                onChange={(e) => updatePermission(index, { value: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontSize: '0.7rem' } }}
              />
            )}

            {(permission.type === 'submitter' || permission.type === 'approver') && (
              <Box sx={{ flex: 1 }} />
            )}

            <IconButton size="small" onClick={() => removePermission(index)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permission.canView}
                  onChange={(e) => updatePermission(index, { canView: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: '0.65rem' }}>Can View</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permission.canEdit}
                  onChange={(e) => updatePermission(index, { canEdit: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: '0.65rem' }}>Can Edit</Typography>}
            />
          </Box>

          {(permission.visibleFields?.length || permission.editableFields?.length) ? null : (
            <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 1 }}>
              All fields visible. Add specific fields below to restrict.
            </Typography>
          )}

          <Autocomplete
            multiple
            size="small"
            options={formFields.map((f) => f.fieldKey)}
            value={permission.visibleFields || []}
            onChange={(_, fields) => updatePermission(index, { visibleFields: fields })}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Visible Fields (empty = all)"
                placeholder="Select fields"
                InputLabelProps={{ sx: { fontSize: '0.65rem' } }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, i) => (
                <Chip {...getTagProps({ index: i })} key={option} label={option} size="small" sx={{ fontSize: '0.6rem' }} />
              ))
            }
            sx={{ mt: 1 }}
          />
        </Box>
      ))}

      <Button
        size="small"
        startIcon={<Add fontSize="small" />}
        onClick={addPermission}
        sx={{ fontSize: '0.65rem', textTransform: 'none' }}
      >
        Add Permission
      </Button>
    </Box>
  );
}

export default ViewPermissionProperties;
