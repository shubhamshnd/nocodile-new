import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
  Autocomplete,
  Chip,
} from '@mui/material';

interface ChildFormEntryPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; username: string }>;
  childForms: Array<{ id: string; name: string }>;
}

export function ChildFormEntryProperties({
  config,
  onUpdate,
  roles,
  users,
  childForms,
}: ChildFormEntryPropertiesProps) {
  const entryPermissions = (config.entryPermissions as {
    allowedRoles: string[];
    allowedUsers: string[];
    allowSubmitter: boolean;
  }) || { allowedRoles: [], allowedUsers: [], allowSubmitter: true };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        Configure who can enter data in the child form at this workflow stage.
      </Typography>

      <Autocomplete
        size="small"
        options={childForms}
        getOptionLabel={(f) => f.name}
        value={childForms.find((f) => f.id === config.childFormId) || null}
        onChange={(_, f) => onUpdate({ childFormId: f?.id })}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Child Form"
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
        )}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={(config.required as boolean) || false}
            onChange={(e) => onUpdate({ required: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Required</Typography>}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small"
          label="Min Entries"
          type="number"
          value={(config.minEntries as number) || ''}
          onChange={(e) => onUpdate({ minEntries: parseInt(e.target.value) || undefined })}
          inputProps={{ min: 0 }}
          sx={{ flex: 1 }}
          InputProps={{ sx: { fontSize: '0.75rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        />
        <TextField
          size="small"
          label="Max Entries"
          type="number"
          value={(config.maxEntries as number) || ''}
          onChange={(e) => onUpdate({ maxEntries: parseInt(e.target.value) || undefined })}
          inputProps={{ min: 1 }}
          sx={{ flex: 1 }}
          InputProps={{ sx: { fontSize: '0.75rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        />
      </Box>

      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mt: 1 }}>
        Entry Permissions
      </Typography>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={entryPermissions.allowSubmitter}
            onChange={(e) =>
              onUpdate({
                entryPermissions: { ...entryPermissions, allowSubmitter: e.target.checked },
              })
            }
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Allow Submitter</Typography>}
      />

      <Autocomplete
        multiple
        size="small"
        options={roles}
        getOptionLabel={(r) => r.name}
        value={roles.filter((r) => entryPermissions.allowedRoles.includes(r.id))}
        onChange={(_, selected) =>
          onUpdate({
            entryPermissions: {
              ...entryPermissions,
              allowedRoles: selected.map((r) => r.id),
            },
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Allowed Roles"
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, i) => (
            <Chip
              {...getTagProps({ index: i })}
              key={option.id}
              label={option.name}
              size="small"
              sx={{ fontSize: '0.6rem' }}
            />
          ))
        }
      />

      <Autocomplete
        multiple
        size="small"
        options={users}
        getOptionLabel={(u) => `${u.firstName} ${u.lastName}`.trim() || u.username}
        value={users.filter((u) => entryPermissions.allowedUsers.includes(u.id))}
        onChange={(_, selected) =>
          onUpdate({
            entryPermissions: {
              ...entryPermissions,
              allowedUsers: selected.map((u) => u.id),
            },
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label="Allowed Users"
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, i) => (
            <Chip
              {...getTagProps({ index: i })}
              key={option.id}
              label={`${option.firstName} ${option.lastName}`.trim() || option.username}
              size="small"
              sx={{ fontSize: '0.6rem' }}
            />
          ))
        }
      />
    </Box>
  );
}

export default ChildFormEntryProperties;
