import {
  Box,
  TextField,
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
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { RecipientConfig } from '../types';

interface NotificationPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string; username: string }>;
  isEmail?: boolean;
}

export function NotificationProperties({
  config,
  onUpdate,
  formFields,
  roles,
  users,
  isEmail = false,
}: NotificationPropertiesProps) {
  const notificationType = (config.notificationType as string) || 'both';
  const recipients = (config.recipients as RecipientConfig[]) || [];
  const template = (config.template as { subject: string; body: string; isHtml?: boolean }) || {
    subject: '',
    body: '',
    isHtml: false,
  };

  const addRecipient = () => {
    onUpdate({ recipients: [...recipients, { type: 'submitter' }] });
  };

  const updateRecipient = (index: number, updates: Partial<RecipientConfig>) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], ...updates };
    onUpdate({ recipients: newRecipients });
  };

  const removeRecipient = (index: number) => {
    onUpdate({ recipients: recipients.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {!isEmail && (
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: '0.75rem' }}>Notification Type</InputLabel>
          <Select
            value={notificationType}
            onChange={(e) => onUpdate({ notificationType: e.target.value })}
            label="Notification Type"
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="email" sx={{ fontSize: '0.75rem' }}>Email Only</MenuItem>
            <MenuItem value="in_app" sx={{ fontSize: '0.75rem' }}>In-App Only</MenuItem>
            <MenuItem value="both" sx={{ fontSize: '0.75rem' }}>Both</MenuItem>
          </Select>
        </FormControl>
      )}

      {/* Recipients */}
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>Recipients</Typography>

        {recipients.map((recipient, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={recipient.type}
                onChange={(e) =>
                  updateRecipient(index, { type: e.target.value as RecipientConfig['type'] })
                }
                sx={{ fontSize: '0.7rem' }}
              >
                <MenuItem value="submitter" sx={{ fontSize: '0.7rem' }}>Submitter</MenuItem>
                <MenuItem value="approver" sx={{ fontSize: '0.7rem' }}>Current Approver</MenuItem>
                <MenuItem value="role" sx={{ fontSize: '0.7rem' }}>Role</MenuItem>
                <MenuItem value="user" sx={{ fontSize: '0.7rem' }}>User</MenuItem>
                <MenuItem value="dynamic" sx={{ fontSize: '0.7rem' }}>Dynamic</MenuItem>
              </Select>
            </FormControl>

            {recipient.type === 'role' && (
              <Autocomplete
                size="small"
                options={roles}
                getOptionLabel={(r) => r.name}
                value={roles.find((r) => r.id === recipient.roleId) || null}
                onChange={(_, r) => updateRecipient(index, { roleId: r?.id })}
                renderInput={(params) => <TextField {...params} placeholder="Select role" />}
                sx={{ flex: 1 }}
              />
            )}

            {recipient.type === 'user' && (
              <Autocomplete
                size="small"
                options={users}
                getOptionLabel={(u) => `${u.firstName} ${u.lastName}`.trim() || u.username}
                value={users.find((u) => u.id === recipient.userId) || null}
                onChange={(_, u) => updateRecipient(index, { userId: u?.id })}
                renderInput={(params) => <TextField {...params} placeholder="Select user" />}
                sx={{ flex: 1 }}
              />
            )}

            {recipient.type === 'dynamic' && (
              <Autocomplete
                size="small"
                options={formFields}
                getOptionLabel={(f) => f.config.label || f.fieldKey}
                value={formFields.find((f) => f.fieldKey === recipient.dynamicFieldKey) || null}
                onChange={(_, f) => updateRecipient(index, { dynamicFieldKey: f?.fieldKey })}
                renderInput={(params) => <TextField {...params} placeholder="Select field" />}
                sx={{ flex: 1 }}
              />
            )}

            {(recipient.type === 'submitter' || recipient.type === 'approver') && (
              <Box sx={{ flex: 1 }} />
            )}

            <IconButton size="small" onClick={() => removeRecipient(index)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={addRecipient}
          sx={{ fontSize: '0.65rem', textTransform: 'none' }}
        >
          Add Recipient
        </Button>
      </Box>

      {/* Template */}
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>Message Template</Typography>

        <TextField
          fullWidth
          size="small"
          label="Subject"
          value={template.subject}
          onChange={(e) =>
            onUpdate({ template: { ...template, subject: e.target.value } })
          }
          placeholder="Document {{documentName}} requires your attention"
          sx={{ mb: 1 }}
          InputProps={{ sx: { fontSize: '0.75rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        />

        <TextField
          fullWidth
          size="small"
          label="Body"
          value={template.body}
          onChange={(e) => onUpdate({ template: { ...template, body: e.target.value } })}
          multiline
          rows={4}
          placeholder="Use {{fieldName}} to insert field values"
          InputProps={{ sx: { fontSize: '0.75rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        />

        {isEmail && (
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={template.isHtml || false}
                onChange={(e) =>
                  onUpdate({ template: { ...template, isHtml: e.target.checked } })
                }
              />
            }
            label={<Typography sx={{ fontSize: '0.7rem' }}>HTML Email</Typography>}
            sx={{ mt: 1 }}
          />
        )}

        <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 1 }}>
          Available placeholders: {'{{documentName}}'}, {'{{submitter}}'}, {'{{fieldKey}}'}
        </Typography>
      </Box>

      {isEmail && (
        <FormControlLabel
          control={
            <Switch
              size="small"
              checked={(config.attachDocument as boolean) || false}
              onChange={(e) => onUpdate({ attachDocument: e.target.checked })}
            />
          }
          label={<Typography sx={{ fontSize: '0.75rem' }}>Attach Document as PDF</Typography>}
        />
      )}
    </Box>
  );
}

export default NotificationProperties;
