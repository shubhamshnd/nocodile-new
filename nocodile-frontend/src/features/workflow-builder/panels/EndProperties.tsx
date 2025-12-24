import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Typography,
} from '@mui/material';

interface EndPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string }>;
}

export function EndProperties({ config, onUpdate }: EndPropertiesProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        The End node represents a terminal state in the workflow.
      </Typography>

      <TextField
        fullWidth
        size="small"
        label="State Key"
        value={(config.stateKey as string) || 'COMPLETED'}
        onChange={(e) => onUpdate({ stateKey: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
        helperText="e.g., APPROVED, REJECTED, CANCELLED"
        InputProps={{ sx: { fontSize: '0.75rem' } }}
        InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={(config.isFinal as boolean) !== false}
            onChange={(e) => onUpdate({ isFinal: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Mark as Final State</Typography>}
      />

      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={(config.notifySubmitter as boolean) || false}
            onChange={(e) => onUpdate({ notifySubmitter: e.target.checked })}
          />
        }
        label={<Typography sx={{ fontSize: '0.75rem' }}>Notify Submitter</Typography>}
      />

      {(config.notifySubmitter as boolean) && (
        <TextField
          fullWidth
          size="small"
          label="Notification Message"
          value={(config.notificationTemplate as string) || ''}
          onChange={(e) => onUpdate({ notificationTemplate: e.target.value })}
          multiline
          rows={3}
          placeholder="Your document has been {{stateKey}}."
          InputProps={{ sx: { fontSize: '0.75rem' } }}
          InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
        />
      )}
    </Box>
  );
}

export default EndProperties;
