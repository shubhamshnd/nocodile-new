import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Autocomplete,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import { FiberManualRecord, ExpandMore } from '@mui/icons-material';
import type { StatePermissions } from '../types';

interface StatePropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  roles?: Array<{ id: string; name: string }>;
  users?: Array<{ id: string; firstName: string; lastName: string; username: string }>;
  childForms?: Array<{ id: string; name: string }>;
}

const STATE_COLORS = [
  { value: '#673ab7', label: 'Purple' },
  { value: '#2196F3', label: 'Blue' },
  { value: '#4CAF50', label: 'Green' },
  { value: '#FF9800', label: 'Orange' },
  { value: '#F44336', label: 'Red' },
  { value: '#00BCD4', label: 'Cyan' },
  { value: '#FFEB3B', label: 'Yellow' },
  { value: '#607D8B', label: 'Gray' },
];

export function StateProperties({ config, onUpdate, roles = [], childForms = [] }: StatePropertiesProps) {
  const stateKey = (config.stateKey as string) || '';
  const color = (config.color as string) || '#673ab7';
  const isInitial = (config.isInitial as boolean) || false;
  const isFinal = (config.isFinal as boolean) || false;

  // Get permissions or create default
  const permissions = (config.permissions as StatePermissions) || {
    view: { includeSubmitter: true, includeApprovers: true },
    editMainForm: true,
    editChildForms: true,
  };

  const updatePermissions = (updates: Partial<StatePermissions>) => {
    onUpdate({ ...config, permissions: { ...permissions, ...updates } });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        State nodes represent different stages of your document workflow (e.g., Draft, Submitted, Approved).
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="State Key"
        value={stateKey}
        disabled
        helperText="Auto-generated from state name"
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        FormHelperTextProps={{ sx: { fontSize: '0.65rem' } }}
      />

      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Color</InputLabel>
        <Select
          value={color}
          onChange={(e) => onUpdate({ color: e.target.value })}
          label="Color"
          sx={{ fontSize: '0.75rem' }}
        >
          {STATE_COLORS.map((c) => (
            <MenuItem key={c.value} value={c.value} sx={{ fontSize: '0.75rem' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FiberManualRecord sx={{ color: c.value, fontSize: '1rem' }} />
                {c.label}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={isInitial}
            onChange={(e) => onUpdate({ isInitial: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Initial State (starting point)</Typography>}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={isFinal}
            onChange={(e) => onUpdate({ isFinal: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Final State (end of workflow)</Typography>}
      />

      <Divider sx={{ my: 1 }} />

      {/* Permissions Section */}
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 1 }}>
        Permissions
      </Typography>

      {/* View Permissions Accordion */}
      <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <AccordionSummary expandIcon={<ExpandMore fontSize="small" />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>View Permissions</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permissions.view?.includeSubmitter !== false}
                  onChange={(e) => updatePermissions({ view: { ...permissions.view, includeSubmitter: e.target.checked } })}
                />
              }
              label={<Typography sx={{ fontSize: '0.7rem' }}>Include Submitter</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permissions.view?.includeApprovers !== false}
                  onChange={(e) => updatePermissions({ view: { ...permissions.view, includeApprovers: e.target.checked } })}
                />
              }
              label={<Typography sx={{ fontSize: '0.7rem' }}>Include Approvers</Typography>}
            />
            <Autocomplete
              multiple
              size="small"
              options={roles}
              getOptionLabel={(r) => r.name}
              value={roles.filter((r) => permissions.view?.roles?.includes(r.id))}
              onChange={(_, selected) => updatePermissions({ view: { ...permissions.view, roles: selected.map((r) => r.id) } })}
              renderInput={(params) => <TextField {...params} label="Additional Roles" InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                ))
              }
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Edit Main Form Accordion */}
      <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <AccordionSummary expandIcon={<ExpandMore fontSize="small" />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Edit Main Form</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permissions.editMainForm !== false}
                  onChange={(e) => updatePermissions({ editMainForm: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: '0.7rem' }}>Allow Main Form Editing</Typography>}
            />
            {permissions.editMainForm && (
              <>
                <Autocomplete
                  multiple
                  size="small"
                  options={roles}
                  getOptionLabel={(r) => r.name}
                  value={roles.filter((r) => permissions.editMainFormRoles?.includes(r.id))}
                  onChange={(_, selected) => updatePermissions({ editMainFormRoles: selected.map((r) => r.id) })}
                  renderInput={(params) => <TextField {...params} label="Restrict to Roles" helperText="Leave empty for all" FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ))
                  }
                />
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Edit Child Forms Accordion */}
      <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
        <AccordionSummary expandIcon={<ExpandMore fontSize="small" />} sx={{ minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 500 }}>Edit Child Forms</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={permissions.editChildForms !== false}
                  onChange={(e) => updatePermissions({ editChildForms: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontSize: '0.7rem' }}>Allow Child Form Editing</Typography>}
            />
            {permissions.editChildForms && (
              <>
                <Autocomplete
                  multiple
                  size="small"
                  options={roles}
                  getOptionLabel={(r) => r.name}
                  value={roles.filter((r) => permissions.editChildFormsRoles?.includes(r.id))}
                  onChange={(_, selected) => updatePermissions({ editChildFormsRoles: selected.map((r) => r.id) })}
                  renderInput={(params) => <TextField {...params} label="Restrict to Roles" helperText="Leave empty for all" FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ))
                  }
                />
                <Autocomplete
                  multiple
                  size="small"
                  options={childForms}
                  getOptionLabel={(f) => f.name}
                  value={childForms.filter((f) => permissions.specificChildForms?.includes(f.id))}
                  onChange={(_, selected) => updatePermissions({ specificChildForms: selected.map((f) => f.id) })}
                  renderInput={(params) => <TextField {...params} label="Specific Child Forms" helperText="Leave empty for all" FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={option.id} label={option.name} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                    ))
                  }
                />
              </>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Approval Level */}
      <TextField
        fullWidth
        size="small"
        label="Approval Level (Optional)"
        value={permissions.approvalLevel || ''}
        onChange={(e) => updatePermissions({ approvalLevel: e.target.value })}
        helperText="e.g., 'user_level', 'unit_head_level', 'hr_level'"
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        FormHelperTextProps={{ sx: { fontSize: '0.65rem' } }}
      />

      <Typography sx={{ fontSize: '0.65rem', color: '#999', mt: 1 }}>
        <strong>Tip:</strong> Connect approval nodes to state nodes to automatically transition documents when approved/rejected.
      </Typography>
    </Box>
  );
}

export default StateProperties;
