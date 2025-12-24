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
  Autocomplete,
  Chip,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface WebhookPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string }>;
}

export function WebhookProperties({ config, onUpdate, formFields }: WebhookPropertiesProps) {
  const headers = (config.headers as Array<{ key: string; value: string }>) || [];
  const payload = (config.payload as {
    type: string;
    selectedFields?: string[];
    customPayload?: string;
  }) || { type: 'full_document' };

  const addHeader = () => {
    onUpdate({ headers: [...headers, { key: '', value: '' }] });
  };

  const updateHeader = (index: number, updates: { key?: string; value?: string }) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    onUpdate({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    onUpdate({ headers: headers.filter((_, i) => i !== index) });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        Call an external API when this node is reached.
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="URL"
        value={(config.url as string) || ''}
        onChange={(e) => onUpdate({ url: e.target.value })}
        placeholder="https://api.example.com/webhook"
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
      />

      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Method</InputLabel>
        <Select
          value={(config.method as string) || 'POST'}
          onChange={(e) => onUpdate({ method: e.target.value })}
          label="Method"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="GET" sx={{ fontSize: '0.75rem' }}>GET</MenuItem>
          <MenuItem value="POST" sx={{ fontSize: '0.75rem' }}>POST</MenuItem>
          <MenuItem value="PUT" sx={{ fontSize: '0.75rem' }}>PUT</MenuItem>
          <MenuItem value="PATCH" sx={{ fontSize: '0.75rem' }}>PATCH</MenuItem>
        </Select>
      </FormControl>

      {/* Headers */}
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>Headers</Typography>
        {headers.map((header, index) => (
          <Box key={index} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
            <TextField
              size="small"
              placeholder="Key"
              value={header.key}
              onChange={(e) => updateHeader(index, { key: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: '0.7rem' } }}
            />
            <TextField
              size="small"
              placeholder="Value"
              value={header.value}
              onChange={(e) => updateHeader(index, { value: e.target.value })}
              sx={{ flex: 1 }}
              InputProps={{ sx: { fontSize: '0.7rem' } }}
            />
            <IconButton size="small" onClick={() => removeHeader(index)}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<Add fontSize="small" />}
          onClick={addHeader}
          sx={{ fontSize: '0.6rem', textTransform: 'none' }}
        >
          Add Header
        </Button>
      </Box>

      {/* Payload */}
      <Box>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1 }}>Payload</Typography>
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>Payload Type</InputLabel>
          <Select
            value={payload.type}
            onChange={(e) => onUpdate({ payload: { ...payload, type: e.target.value } })}
            label="Payload Type"
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="full_document" sx={{ fontSize: '0.75rem' }}>Full Document</MenuItem>
            <MenuItem value="selected_fields" sx={{ fontSize: '0.75rem' }}>Selected Fields</MenuItem>
            <MenuItem value="custom" sx={{ fontSize: '0.75rem' }}>Custom JSON</MenuItem>
          </Select>
        </FormControl>

        {payload.type === 'selected_fields' && (
          <Autocomplete
            multiple
            size="small"
            options={formFields.map((f) => f.fieldKey)}
            value={payload.selectedFields || []}
            onChange={(_, fields) =>
              onUpdate({ payload: { ...payload, selectedFields: fields } })
            }
            renderInput={(params) => (
              <TextField {...params} label="Fields to Include" InputLabelProps={{ sx: { fontSize: '0.75rem' } }} />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, i) => (
                <Chip {...getTagProps({ index: i })} key={option} label={option} size="small" />
              ))
            }
          />
        )}

        {payload.type === 'custom' && (
          <TextField
            fullWidth
            size="small"
            label="Custom JSON"
            value={payload.customPayload || ''}
            onChange={(e) =>
              onUpdate({ payload: { ...payload, customPayload: e.target.value } })
            }
            multiline
            rows={4}
            placeholder='{"key": "{{fieldName}}"}'
            InputProps={{ sx: { fontSize: '0.7rem', fontFamily: 'monospace' } }}
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
        )}
      </Box>

      {/* Error Handling */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>On Success</InputLabel>
          <Select
            value={(config.onSuccess as string) || 'continue'}
            onChange={(e) => onUpdate({ onSuccess: e.target.value })}
            label="On Success"
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="continue" sx={{ fontSize: '0.75rem' }}>Continue</MenuItem>
            <MenuItem value="branch" sx={{ fontSize: '0.75rem' }}>Branch</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel sx={{ fontSize: '0.75rem' }}>On Error</InputLabel>
          <Select
            value={(config.onError as string) || 'fail'}
            onChange={(e) => onUpdate({ onError: e.target.value })}
            label="On Error"
            sx={{ fontSize: '0.75rem' }}
          >
            <MenuItem value="fail" sx={{ fontSize: '0.75rem' }}>Fail Workflow</MenuItem>
            <MenuItem value="continue" sx={{ fontSize: '0.75rem' }}>Continue</MenuItem>
            <MenuItem value="retry" sx={{ fontSize: '0.75rem' }}>Retry</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default WebhookProperties;
