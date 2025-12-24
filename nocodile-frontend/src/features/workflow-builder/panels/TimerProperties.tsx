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
} from '@mui/material';

interface TimerPropertiesProps {
  config: Record<string, unknown>;
  onUpdate: (updates: Record<string, unknown>) => void;
  formFields: Array<{ fieldKey: string; config: { label?: string } }>;
  roles: Array<{ id: string; name: string }>;
  users: Array<{ id: string; firstName: string; lastName: string }>;
}

export function TimerProperties({ config, onUpdate, formFields }: TimerPropertiesProps) {
  const delayType = (config.delayType as string) || 'fixed';
  const delayValue = (config.delayValue as number) || 1;
  const delayUnit = (config.delayUnit as string) || 'days';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.7rem', color: '#666' }}>
        Configure how long to wait before proceeding to the next step.
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: '0.75rem' }}>Delay Type</InputLabel>
        <Select
          value={delayType}
          onChange={(e) => onUpdate({ delayType: e.target.value })}
          label="Delay Type"
          sx={{ fontSize: '0.75rem' }}
        >
          <MenuItem value="fixed" sx={{ fontSize: '0.75rem' }}>Fixed Duration</MenuItem>
          <MenuItem value="field_based" sx={{ fontSize: '0.75rem' }}>Based on Form Field</MenuItem>
          <MenuItem value="business_days" sx={{ fontSize: '0.75rem' }}>Business Days Only</MenuItem>
        </Select>
      </FormControl>

      {(delayType === 'fixed' || delayType === 'business_days') && (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            size="small"
            label="Duration"
            type="number"
            value={delayValue}
            onChange={(e) => onUpdate({ delayValue: parseInt(e.target.value) || 1 })}
            inputProps={{ min: 1 }}
            sx={{ flex: 1 }}
            InputProps={{ sx: { fontSize: '0.75rem' } }}
            InputLabelProps={{ sx: { fontSize: '0.75rem' } }}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel sx={{ fontSize: '0.75rem' }}>Unit</InputLabel>
            <Select
              value={delayUnit}
              onChange={(e) => onUpdate({ delayUnit: e.target.value })}
              label="Unit"
              sx={{ fontSize: '0.75rem' }}
            >
              <MenuItem value="minutes" sx={{ fontSize: '0.75rem' }}>Minutes</MenuItem>
              <MenuItem value="hours" sx={{ fontSize: '0.75rem' }}>Hours</MenuItem>
              <MenuItem value="days" sx={{ fontSize: '0.75rem' }}>Days</MenuItem>
            </Select>
          </FormControl>
        </Box>
      )}

      {delayType === 'field_based' && (
        <Autocomplete
          size="small"
          options={formFields.filter((f) => ['date', 'datetime', 'number'].includes(f.fieldKey))}
          getOptionLabel={(f) => f.config.label || f.fieldKey}
          value={formFields.find((f) => f.fieldKey === config.fieldKey) || null}
          onChange={(_, f) => onUpdate({ fieldKey: f?.fieldKey })}
          renderInput={(params) => (
            <TextField {...params} label="Select Date/Time Field" InputLabelProps={{ sx: { fontSize: '0.75rem' } }} />
          )}
        />
      )}

      {delayType === 'business_days' && (
        <>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={(config.excludeWeekends as boolean) !== false}
                onChange={(e) => onUpdate({ excludeWeekends: e.target.checked })}
              />
            }
            label={<Typography sx={{ fontSize: '0.75rem' }}>Exclude Weekends</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={(config.excludeHolidays as boolean) || false}
                onChange={(e) => onUpdate({ excludeHolidays: e.target.checked })}
              />
            }
            label={<Typography sx={{ fontSize: '0.75rem' }}>Exclude Holidays</Typography>}
          />
        </>
      )}
    </Box>
  );
}

export default TimerProperties;
