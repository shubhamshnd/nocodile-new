import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Typography,
  Autocomplete,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Add, Delete, ExpandMore } from '@mui/icons-material';
import type { ApproverConfig, UserApprovalRule } from '../types';

interface ApprovalPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; username: string }>;
}

export function ApprovalProperties({
  config,
  onUpdate,
  formFields,
  roles,
  users,
}: ApprovalPropertiesProps) {
  const defaultApprovers = (config.defaultApprovers as ApproverConfig[]) || [];
  const userApprovalRules = (config.userApprovalRules as UserApprovalRule[]) || [];
  const approvalType = (config.approvalType as string) || 'single';

  const addApprover = () => {
    onUpdate({
      defaultApprovers: [...defaultApprovers, { type: 'role', roleId: '' }],
    });
  };

  const updateApprover = (index: number, updates: Partial<ApproverConfig>) => {
    const newApprovers = [...defaultApprovers];
    newApprovers[index] = { ...newApprovers[index], ...updates };
    onUpdate({ defaultApprovers: newApprovers });
  };

  const removeApprover = (index: number) => {
    onUpdate({
      defaultApprovers: defaultApprovers.filter((_, i) => i !== index),
    });
  };

  const addUserRule = () => {
    const newRule: UserApprovalRule = {
      id: `rule_${Date.now()}`,
      submitterCondition: { type: 'department', value: '', operator: '==' },
      approvers: [{ type: 'user', userId: '' }],
    };
    onUpdate({
      userApprovalRules: [...userApprovalRules, newRule],
    });
  };

  const updateUserRule = (index: number, updates: Partial<UserApprovalRule>) => {
    const newRules = [...userApprovalRules];
    newRules[index] = { ...newRules[index], ...updates };
    onUpdate({ userApprovalRules: newRules });
  };

  const removeUserRule = (index: number) => {
    onUpdate({
      userApprovalRules: userApprovalRules.filter((_, i) => i !== index),
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Description */}
      <TextField
        fullWidth
        size="small"
        label="Description"
        value={(config.description as string) || ''}
        onChange={(e) => onUpdate({ description: e.target.value })}
        multiline
        rows={2}
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
      />

      {/* Approval Type */}
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Approval Type</InputLabel>
        <Select
          value={approvalType}
          onChange={(e) => onUpdate({ approvalType: e.target.value })}
          label="Approval Type"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="single" sx={{ fontSize: '0.75rem' }}>
            Single Approver
          </MenuItem>
          <MenuItem value="all" sx={{ fontSize: '0.75rem' }}>
            All Must Approve (AND)
          </MenuItem>
          <MenuItem value="any" sx={{ fontSize: '0.75rem' }}>
            Any Can Approve (OR)
          </MenuItem>
        </Select>
      </FormControl>

      <Divider />

      {/* Default Approvers */}
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>
          Default Approvers
        </Typography>

        {defaultApprovers.map((approver, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel sx={{ fontSize: '0.7rem' }}>Type</InputLabel>
              <Select
                value={approver.type}
                onChange={(e) => updateApprover(index, { type: e.target.value as ApproverConfig['type'] })}
                label="Type"
                sx={{ fontSize: '0.7rem' }}
              >
                <MenuItem value="role" sx={{ fontSize: '0.7rem' }}>Role</MenuItem>
                <MenuItem value="user" sx={{ fontSize: '0.7rem' }}>User</MenuItem>
                <MenuItem value="submitter_manager" sx={{ fontSize: '0.7rem' }}>Manager</MenuItem>
                <MenuItem value="department" sx={{ fontSize: '0.7rem' }}>Department</MenuItem>
                <MenuItem value="dynamic" sx={{ fontSize: '0.7rem' }}>Dynamic</MenuItem>
              </Select>
            </FormControl>

            {approver.type === 'role' && (
              <Autocomplete
                size="small"
                options={roles}
                getOptionLabel={(r) => r.name}
                value={roles.find((r) => r.id === approver.roleId) || null}
                onChange={(_, r) => updateApprover(index, { roleId: r?.id })}
                renderInput={(params) => (
                  <TextField {...params} label="Role" InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                )}
                sx={{ flex: 1 }}
              />
            )}

            {approver.type === 'user' && (
              <Autocomplete
                size="small"
                options={users}
                getOptionLabel={(u) => `${u.firstName} ${u.lastName}`.trim() || u.username}
                value={users.find((u) => u.id === approver.userId) || null}
                onChange={(_, u) => updateApprover(index, { userId: u?.id })}
                renderInput={(params) => (
                  <TextField {...params} label="User" InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                )}
                sx={{ flex: 1 }}
              />
            )}

            {approver.type === 'submitter_manager' && (
              <Typography sx={{ fontSize: '0.7rem', color: '#666', flex: 1, alignSelf: 'center' }}>
                Submitter's direct manager
              </Typography>
            )}

            {approver.type === 'department' && (
              <TextField
                size="small"
                label="Department"
                value={approver.departmentKey || ''}
                onChange={(e) => updateApprover(index, { departmentKey: e.target.value })}
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontSize: '0.7rem' } }}
                InputLabelProps={{ sx: { fontSize: '0.7rem' } }}
              />
            )}

            {approver.type === 'dynamic' && (
              <Autocomplete
                size="small"
                options={formFields.filter((f) => f.fieldKey)}
                getOptionLabel={(f) => f.config.label || f.fieldKey}
                value={formFields.find((f) => f.fieldKey === approver.dynamicFieldKey) || null}
                onChange={(_, f) => updateApprover(index, { dynamicFieldKey: f?.fieldKey })}
                renderInput={(params) => (
                  <TextField {...params} label="Field" InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                )}
                sx={{ flex: 1 }}
              />
            )}

            <IconButton size="small" onClick={() => removeApprover(index)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={addApprover}
          sx={{ fontSize: '0.65rem', textTransform: 'none' }}
        >
          Add Approver
        </Button>
      </Box>

      <Divider />

      {/* Per-User Rules */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
            Per-User Rules
          </Typography>
          <Button
            size="small"
            startIcon={<Add fontSize="small" />}
            onClick={addUserRule}
            sx={{ fontSize: '0.6rem', textTransform: 'none' }}
          >
            Add Rule
          </Button>
        </Box>

        <Typography sx={{ fontSize: '0.6rem', color: '#999', mb: 1 }}>
          Configure "If X submits, Y approves" rules
        </Typography>

        {userApprovalRules.map((rule, index) => (
          <Accordion key={rule.id} sx={{ mb: 0.5, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ minHeight: 36 }}>
              <Typography sx={{ fontSize: '0.7rem' }}>
                Rule {index + 1}: If {rule.submitterCondition.type} {rule.submitterCondition.operator} "{rule.submitterCondition.value}"
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#666' }}>
                  When submitter matches:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                      value={rule.submitterCondition.type}
                      onChange={(e) =>
                        updateUserRule(index, {
                          submitterCondition: { ...rule.submitterCondition, type: e.target.value as 'user' | 'role' | 'department' | 'attribute' },
                        })
                      }
                      sx={{ fontSize: '0.7rem' }}
                    >
                      <MenuItem value="user" sx={{ fontSize: '0.7rem' }}>User</MenuItem>
                      <MenuItem value="role" sx={{ fontSize: '0.7rem' }}>Role</MenuItem>
                      <MenuItem value="department" sx={{ fontSize: '0.7rem' }}>Department</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 60 }}>
                    <Select
                      value={rule.submitterCondition.operator || '=='}
                      onChange={(e) =>
                        updateUserRule(index, {
                          submitterCondition: { ...rule.submitterCondition, operator: e.target.value as '==' | '!=' | 'in' | 'contains' },
                        })
                      }
                      sx={{ fontSize: '0.7rem' }}
                    >
                      <MenuItem value="==" sx={{ fontSize: '0.7rem' }}>=</MenuItem>
                      <MenuItem value="!=" sx={{ fontSize: '0.7rem' }}>!=</MenuItem>
                      <MenuItem value="in" sx={{ fontSize: '0.7rem' }}>in</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    value={rule.submitterCondition.value}
                    onChange={(e) =>
                      updateUserRule(index, {
                        submitterCondition: { ...rule.submitterCondition, value: e.target.value },
                      })
                    }
                    placeholder="Value"
                    sx={{ flex: 1 }}
                    InputProps={{ sx: { fontSize: '0.7rem' } }}
                  />
                </Box>

                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', mt: 1 }}>
                  Assign to:
                </Typography>
                {rule.approvers.map((approver, aIndex) => (
                  <Box key={aIndex} sx={{ display: 'flex', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 90 }}>
                      <Select
                        value={approver.type}
                        onChange={(e) => {
                          const newApprovers = [...rule.approvers];
                          newApprovers[aIndex] = { ...approver, type: e.target.value as ApproverConfig['type'] };
                          updateUserRule(index, { approvers: newApprovers });
                        }}
                        sx={{ fontSize: '0.7rem' }}
                      >
                        <MenuItem value="user" sx={{ fontSize: '0.7rem' }}>User</MenuItem>
                        <MenuItem value="role" sx={{ fontSize: '0.7rem' }}>Role</MenuItem>
                      </Select>
                    </FormControl>
                    {approver.type === 'user' && (
                      <Autocomplete
                        size="small"
                        options={users}
                        getOptionLabel={(u) => `${u.firstName} ${u.lastName}`.trim() || u.username}
                        value={users.find((u) => u.id === approver.userId) || null}
                        onChange={(_, u) => {
                          const newApprovers = [...rule.approvers];
                          newApprovers[aIndex] = { ...approver, userId: u?.id };
                          updateUserRule(index, { approvers: newApprovers });
                        }}
                        renderInput={(params) => <TextField {...params} />}
                        sx={{ flex: 1 }}
                      />
                    )}
                    {approver.type === 'role' && (
                      <Autocomplete
                        size="small"
                        options={roles}
                        getOptionLabel={(r) => r.name}
                        value={roles.find((r) => r.id === approver.roleId) || null}
                        onChange={(_, r) => {
                          const newApprovers = [...rule.approvers];
                          newApprovers[aIndex] = { ...approver, roleId: r?.id };
                          updateUserRule(index, { approvers: newApprovers });
                        }}
                        renderInput={(params) => <TextField {...params} />}
                        sx={{ flex: 1 }}
                      />
                    )}
                  </Box>
                ))}

                <Button
                  size="small"
                  color="error"
                  onClick={() => removeUserRule(index)}
                  sx={{ fontSize: '0.6rem', textTransform: 'none', alignSelf: 'flex-start' }}
                >
                  Remove Rule
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Divider />

      {/* Options */}
      <Box>
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={(config.requiresComment as boolean) || false}
              onChange={(e) => onUpdate({ requiresComment: e.target.checked })}
            />
          }
          label={<Typography sx={{ fontSize: '0.7rem' }}>Require Comment</Typography>}
        />
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={(config.allowReassign as boolean) !== false}
              onChange={(e) => onUpdate({ allowReassign: e.target.checked })}
            />
          }
          label={<Typography sx={{ fontSize: '0.7rem' }}>Allow Reassignment</Typography>}
        />
      </Box>
    </Box>
  );
}

export default ApprovalProperties;
