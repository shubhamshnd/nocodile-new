import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  FormHelperText,
  Rating,
  Checkbox,
  Radio,
  RadioGroup,
  FormLabel,
  FormGroup,
  Slider,
  IconButton,
  AppBar,
  Toolbar,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Send,
  CloudUpload,
  Save,
  Add,
  Delete,
} from '@mui/icons-material';
import { forms, formComponents, documents } from '../services/api';
import type { Form, FormComponent, Document } from '../types';
import DocumentList from '../components/DocumentList';
import ChildFormTabs from '../components/ChildFormTabs';

type ViewMode = 'list' | 'detail';

export default function FormPreview() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (formId) loadForm();
  }, [formId]);

  useEffect(() => {
    if (currentDocumentId && viewMode === 'detail') {
      loadDocument(currentDocumentId);
    }
  }, [currentDocumentId, viewMode]);

  const loadForm = async () => {
    if (!formId) return;
    setLoading(true);
    try {
      const [formData, componentTree] = await Promise.all([
        forms.get(formId),
        formComponents.getTree(formId),
      ]);
      setForm(formData);
      setComponents(componentTree);
    } catch (error) {
      console.error('Failed to load form:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocument = async (documentId: string) => {
    try {
      const doc = await documents.get(documentId);
      setCurrentDocument(doc);
      setFormData(doc.data || {});
    } catch (error) {
      console.error('Failed to load document:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load document',
        severity: 'error',
      });
    }
  };

  const handleDocumentClick = (documentId: string) => {
    setCurrentDocumentId(documentId);
    setViewMode('detail');
  };

  const handleNewDocument = () => {
    setCurrentDocumentId(null);
    setCurrentDocument(null);
    setFormData({});
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentDocumentId(null);
    setCurrentDocument(null);
    setFormData({});
  };

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  // Handler for field changes inside a repeatable section
  const handleRepeatableFieldChange = (sectionKey: string, rowIndex: number, fieldKey: string, value: unknown) => {
    setFormData((prev) => {
      const rows = (prev[sectionKey] as Record<string, unknown>[]) || [];
      const newRows = [...rows];
      if (!newRows[rowIndex]) {
        newRows[rowIndex] = {};
      }
      newRows[rowIndex] = { ...newRows[rowIndex], [fieldKey]: value };
      return { ...prev, [sectionKey]: newRows };
    });
  };

  // Add a new row to repeatable section
  const addRepeatableRow = (sectionKey: string, maxRows: number) => {
    setFormData((prev) => {
      const rows = (prev[sectionKey] as Record<string, unknown>[]) || [];
      if (maxRows > 0 && rows.length >= maxRows) return prev;
      return { ...prev, [sectionKey]: [...rows, {}] };
    });
  };

  // Remove a row from repeatable section
  const removeRepeatableRow = (sectionKey: string, rowIndex: number, minRows: number) => {
    setFormData((prev) => {
      const rows = (prev[sectionKey] as Record<string, unknown>[]) || [];
      if (rows.length <= minRows) return prev;
      const newRows = rows.filter((_, i) => i !== rowIndex);
      return { ...prev, [sectionKey]: newRows };
    });
  };

  // Validate cross-row rules for repeatable sections
  const validateCrossRowRules = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Find all repeatable sections in components tree
    const findRepeatableSections = (comps: FormComponent[]): FormComponent[] => {
      const result: FormComponent[] = [];
      for (const comp of comps) {
        if (comp.componentType === 'repeatable_section') {
          result.push(comp);
        }
        if (comp.children) {
          result.push(...findRepeatableSections(comp.children));
        }
      }
      return result;
    };

    const repeatableSections = findRepeatableSections(components);

    for (const section of repeatableSections) {
      const config = section.config || {};
      const sectionKey = config.sectionKey || `section_${section.id.slice(0, 8)}`;
      const rows = (formData[sectionKey] as Record<string, unknown>[]) || [];
      const rules = config.crossRowValidation || [];

      // Check min rows
      if (config.minRows && rows.length < config.minRows) {
        errors.push(`${config.label || 'Section'}: Minimum ${config.minRows} row(s) required`);
      }

      // Check cross-row validation rules
      for (const rule of rules) {
        const fieldValues = rows.map(row => row[rule.field]);

        switch (rule.type) {
          case 'sum': {
            const sum = fieldValues.reduce((acc: number, val) => acc + (Number(val) || 0), 0);
            const passed = evaluateComparison(sum, rule.operator || '=', Number(rule.value) || 0);
            if (!passed) {
              errors.push(rule.message || `${config.label}: Sum validation failed`);
            }
            break;
          }
          case 'count': {
            const count = fieldValues.filter(v => v !== undefined && v !== null && v !== '').length;
            const passed = evaluateComparison(count, rule.operator || '=', Number(rule.value) || 0);
            if (!passed) {
              errors.push(rule.message || `${config.label}: Count validation failed`);
            }
            break;
          }
          case 'unique': {
            const uniqueValues = new Set(fieldValues.filter(v => v !== undefined && v !== null && v !== ''));
            const nonEmptyCount = fieldValues.filter(v => v !== undefined && v !== null && v !== '').length;
            if (uniqueValues.size !== nonEmptyCount) {
              errors.push(rule.message || `${config.label}: Values must be unique`);
            }
            break;
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  };

  // Helper to evaluate comparison operators
  const evaluateComparison = (left: number, operator: string, right: number): boolean => {
    switch (operator) {
      case '=': return left === right;
      case '!=': return left !== right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    // Validate cross-row rules
    const { valid, errors } = validateCrossRowRules();

    if (!valid) {
      setSnackbar({
        open: true,
        message: `Validation failed: ${errors.join(', ')}`,
        severity: 'error'
      });
      console.log('Validation errors:', errors);
      return;
    }

    try {
      if (currentDocumentId) {
        // Update existing document and submit
        await documents.update(currentDocumentId, {
          data: formData,
          isSubmitted: true,
        } as any);
        setSnackbar({ open: true, message: 'Document updated successfully!', severity: 'success' });
      } else {
        // Create new document as submitted
        await documents.create({
          documentTypeId: form?.documentTypeId,
          data: formData,
          isSubmitted: true,
        } as any);
        setSnackbar({ open: true, message: 'Document submitted successfully!', severity: 'success' });
      }

      // Go back to list after successful submit
      setTimeout(() => handleBackToList(), 1500);
    } catch (error: any) {
      console.error('Failed to submit document:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to submit document',
        severity: 'error',
      });
    }
  };

  const handleSaveDraft = async () => {
    try {
      if (currentDocumentId) {
        // Update existing draft
        const updatedDoc = await documents.update(currentDocumentId, {
          data: formData,
          isSubmitted: false,
        } as any);
        setCurrentDocument(updatedDoc);
        setSnackbar({ open: true, message: 'Draft updated successfully!', severity: 'success' });
      } else {
        // Create new draft
        const newDoc = await documents.create({
          documentTypeId: form?.documentTypeId,
          data: formData,
          isSubmitted: false,
        } as any);
        setCurrentDocumentId(newDoc.id);
        setCurrentDocument(newDoc);
        setSnackbar({ open: true, message: 'Draft saved successfully!', severity: 'success' });
      }
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to save draft',
        severity: 'error',
      });
    }
  };

  // Render a single field component
  const renderField = (component: FormComponent) => {
    const config = component.config || {};
    const fieldKey = component.fieldKey || component.id;
    const value = formData[fieldKey];
    const ui = (config.ui || {}) as any;

    // Calculate width based on ui.width setting
    // Gap is 4 (32px) for regular fields. For n items per row, there are (n-1) gaps.
    // Each item needs to account for: total_gap_space / n
    const widthMap: Record<string, string> = {
      full: '100%',
      half: 'calc(50% - 16px)',        // 2 items: 1 gap of 32px / 2 = 16px each
      third: 'calc(33.333% - 21.33px)', // 3 items: 2 gaps of 64px / 3 = 21.33px each
      quarter: 'calc(25% - 24px)',     // 4 items: 3 gaps of 96px / 4 = 24px each
    };
    const width = widthMap[ui.width] || '100%';

    const wrapperSx = { width, flexShrink: 0 };

    switch (component.componentType) {
      case 'text':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'textarea':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'number':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              type="number"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={value ?? ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value ? Number(e.target.value) : '')}
              size="medium"
              slotProps={{
                htmlInput: {
                  min: config.validation?.min,
                  max: config.validation?.max,
                },
              }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'date':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              type="date"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'datetime':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              type="datetime-local"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'time':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              type="time"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );

      case 'select':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControl fullWidth required={config.required} disabled={config.disabled}>
              <InputLabel sx={{ fontSize: '1rem', fontWeight: 500 }}>{config.label || fieldKey}</InputLabel>
              <Select
                value={(value as string) || ''}
                label={config.label || fieldKey}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                sx={{
                  fontSize: '1rem',
                  minHeight: 56,
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(config.data?.options || []).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 'multiselect':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControl fullWidth required={config.required} disabled={config.disabled}>
              <InputLabel sx={{ fontSize: '1rem', fontWeight: 500 }}>{config.label || fieldKey}</InputLabel>
              <Select
                multiple
                value={(value as string[]) || []}
                label={config.label || fieldKey}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
                sx={{
                  fontSize: '1rem',
                  minHeight: 56,
                }}
              >
                {(config.data?.options || []).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
              {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 'checkbox':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={(value as boolean) || false}
                  onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
                  disabled={config.disabled}
                />
              }
              label={
                <span>
                  {config.label || fieldKey}
                  {config.required && <span style={{ color: 'red' }}> *</span>}
                </span>
              }
            />
            {config.helpText && <FormHelperText sx={{ ml: 4, mt: -1 }}>{config.helpText}</FormHelperText>}
          </Box>
        );

      case 'checkbox_group':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControl component="fieldset" disabled={config.disabled}>
              <FormLabel component="legend">
                {config.label || fieldKey}
                {config.required && <span style={{ color: 'red' }}> *</span>}
              </FormLabel>
              <FormGroup>
                {(config.data?.options || []).length === 0 ? (
                  <FormHelperText sx={{ mt: 1, color: 'warning.main' }}>
                    No options configured. Please add options in the form builder.
                  </FormHelperText>
                ) : (
                  (config.data?.options || []).map((opt) => (
                    <FormControlLabel
                      key={opt.value}
                      control={
                        <Checkbox
                          checked={((value as string[]) || []).includes(opt.value)}
                          onChange={(e) => {
                            const current = (value as string[]) || [];
                            const newValue = e.target.checked
                              ? [...current, opt.value]
                              : current.filter((v) => v !== opt.value);
                            handleFieldChange(fieldKey, newValue);
                          }}
                        />
                      }
                      label={opt.label}
                    />
                  ))
                )}
              </FormGroup>
              {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 'radio':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControl component="fieldset" disabled={config.disabled}>
              <FormLabel component="legend">
                {config.label || fieldKey}
                {config.required && <span style={{ color: 'red' }}> *</span>}
              </FormLabel>
              <RadioGroup
                value={(value as string) || ''}
                onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              >
                {(config.data?.options || []).length === 0 ? (
                  <FormHelperText sx={{ mt: 1, color: 'warning.main' }}>
                    No options configured. Please add options in the form builder.
                  </FormHelperText>
                ) : (
                  (config.data?.options || []).map((opt) => (
                    <FormControlLabel key={opt.value} value={opt.value} control={<Radio />} label={opt.label} />
                  ))
                )}
              </RadioGroup>
              {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
            </FormControl>
          </Box>
        );

      case 'switch':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControlLabel
              control={
                <Switch
                  checked={(value as boolean) || false}
                  onChange={(e) => handleFieldChange(fieldKey, e.target.checked)}
                  disabled={config.disabled}
                />
              }
              label={config.label || fieldKey}
            />
            {config.helpText && <FormHelperText sx={{ ml: 6, mt: -1 }}>{config.helpText}</FormHelperText>}
          </Box>
        );

      case 'slider':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <Typography gutterBottom>
              {config.label || fieldKey}
              {config.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Slider
              value={(value as number) || config.validation?.min || 0}
              onChange={(_, v) => handleFieldChange(fieldKey, v)}
              min={config.validation?.min || 0}
              max={config.validation?.max || 100}
              step={config.step || 1}
              disabled={config.disabled}
              valueLabelDisplay="auto"
              sx={{ mx: 1 }}
            />
            {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
          </Box>
        );

      case 'file':
      case 'image':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <Typography variant="body2" gutterBottom>
              {config.label || fieldKey}
              {config.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              disabled={config.disabled}
              fullWidth
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              {component.componentType === 'image' ? 'Choose Image...' : 'Choose File...'}
              <input type="file" hidden accept={config.accept} multiple={config.multiple} />
            </Button>
            {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
          </Box>
        );

      case 'rating':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <Typography component="legend" gutterBottom>
              {config.label || fieldKey}
              {config.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <Rating
              value={(value as number) || 0}
              onChange={(_, v) => handleFieldChange(fieldKey, v)}
              max={config.maxRating || 5}
              precision={config.precision || 1}
              disabled={config.disabled}
              size="large"
            />
            {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
          </Box>
        );

      case 'color':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <Typography variant="body2" gutterBottom>
              {config.label || fieldKey}
              {config.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>
            <TextField
              type="color"
              fullWidth
              value={(value as string) || '#000000'}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              disabled={config.disabled}
              sx={{ '& input': { height: 40, cursor: 'pointer' } }}
            />
            {config.helpText && <FormHelperText>{config.helpText}</FormHelperText>}
          </Box>
        );

      default:
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: '1rem',
                  minHeight: 56,
                },
                '& .MuiInputLabel-root': {
                  fontSize: '1rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
        );
    }
  };

  // Render layout component
  const renderLayout = (component: FormComponent): React.ReactNode => {
    const config = component.config || {};
    const ui = (config.ui || {}) as any;
    const children = component.children || [];

    switch (component.componentType) {
      case 'row':
        return (
          <Box
            key={component.id}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mb: 3,
              width: '100%',
            }}
          >
            {children.map((child) => renderComponent(child))}
          </Box>
        );

      case 'column': {
        const span = ui.span || 6;
        const widthPercent = (span / 12) * 100;
        return (
          <Box
            key={component.id}
            sx={{
              width: `calc(${widthPercent}% - 24px)`,
              minWidth: 200,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {children.map((child) => renderComponent(child))}
          </Box>
        );
      }

      case 'section':
        return (
          <Paper
            key={component.id}
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: ui.background || '#fafafa',
              borderRadius: ui.borderRadius || 2,
              border: '1px solid #e0e0e0',
            }}
          >
            {config.label && (
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                {config.label}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {children.map((child) => renderComponent(child))}
            </Box>
          </Paper>
        );

      case 'card':
        return (
          <Paper
            key={component.id}
            elevation={2}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: ui.background || '#fff',
              borderRadius: ui.borderRadius || 2,
            }}
          >
            {config.label && (
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                {config.label}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {children.map((child) => renderComponent(child))}
            </Box>
          </Paper>
        );

      case 'container':
        return (
          <Box
            key={component.id}
            sx={{
              p: ui.padding || 2,
              mb: 3,
              bgcolor: ui.background || undefined,
              border: ui.border ? '1px solid #e0e0e0' : undefined,
              borderRadius: ui.borderRadius || 0,
            }}
          >
            {config.label && (
              <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                {config.label}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {children.map((child) => renderComponent(child))}
            </Box>
          </Box>
        );

      case 'repeatable_section': {
        const sectionKey = config.sectionKey || `section_${component.id.slice(0, 8)}`;
        const minRows = config.minRows || 0;
        const maxRows = config.maxRows || 0;
        const rows = (formData[sectionKey] as Record<string, unknown>[]) || [];

        // Ensure minimum rows exist
        if (rows.length < minRows) {
          const newRows = [...rows];
          while (newRows.length < minRows) {
            newRows.push({});
          }
          // Set initial rows without triggering re-render loop
          if (rows.length === 0 && minRows > 0) {
            setTimeout(() => {
              setFormData((prev) => {
                if (!prev[sectionKey] || (prev[sectionKey] as any[]).length === 0) {
                  return { ...prev, [sectionKey]: newRows };
                }
                return prev;
              });
            }, 0);
          }
        }

        const canAddRow = maxRows === 0 || rows.length < maxRows;
        const canRemoveRow = rows.length > minRows;

        return (
          <Paper
            key={component.id}
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: ui.background || '#fafafa',
              borderRadius: ui.borderRadius || 2,
              border: '1px solid #e0e0e0',
            }}
          >
            {/* Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                {config.label || 'Repeatable Section'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {rows.length} row{rows.length !== 1 ? 's' : ''}{maxRows > 0 ? ` (max ${maxRows})` : ''}
              </Typography>
            </Box>

            {/* Rows */}
            {rows.map((rowData, rowIndex) => (
              <Paper
                key={rowIndex}
                elevation={1}
                sx={{ p: 2, mb: 2, bgcolor: '#fff', border: '1px solid #e0e0e0', position: 'relative' }}
              >
                {/* Row Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={500} sx={{ flex: 1 }}>
                    Row {rowIndex + 1}
                  </Typography>
                  {canRemoveRow && (
                    <IconButton
                      size="small"
                      onClick={() => removeRepeatableRow(sectionKey, rowIndex, minRows)}
                      sx={{ color: '#d32f2f' }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {/* Row Fields */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {children.map((child) => renderRepeatableField(child, sectionKey, rowIndex, rowData))}
                </Box>
              </Paper>
            ))}

            {/* Add Row Button */}
            {canAddRow && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => addRepeatableRow(sectionKey, maxRows)}
                sx={{ color: '#9c27b0', borderColor: '#9c27b0', '&:hover': { borderColor: '#7b1fa2', bgcolor: '#f3e5f5' } }}
              >
                Add {config.label || 'Row'}
              </Button>
            )}
          </Paper>
        );
      }

      case 'divider':
        return <Divider key={component.id} sx={{ my: 3 }} />;

      case 'spacer':
        return <Box key={component.id} sx={{ height: ui.minHeight || 32, width: '100%' }} />;

      default:
        return (
          <Box key={component.id} sx={{ mb: 2 }}>
            {children.map((child) => renderComponent(child))}
          </Box>
        );
    }
  };

  // Render a field inside a repeatable section row
  const renderRepeatableField = (
    component: FormComponent,
    sectionKey: string,
    rowIndex: number,
    rowData: Record<string, unknown>
  ): React.ReactNode => {
    // If it's a layout component inside repeatable, render recursively
    if (component.isLayout) {
      const children = component.children || [];
      return (
        <Box key={component.id} sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {children.map((child) => renderRepeatableField(child, sectionKey, rowIndex, rowData))}
        </Box>
      );
    }

    const config = component.config || {};
    const fieldKey = component.fieldKey || component.id;
    const value = rowData[fieldKey];
    const ui = (config.ui || {}) as any;

    // Calculate width based on ui.width setting
    // Gap is 2 (16px). For n items per row, there are (n-1) gaps.
    // Each item needs to account for: total_gap_space / n
    const widthMap: Record<string, string> = {
      full: '100%',
      half: 'calc(50% - 8px)',        // 2 items: 1 gap of 16px / 2 = 8px each
      third: 'calc(33.333% - 10.67px)', // 3 items: 2 gaps of 32px / 3 = 10.67px each
      quarter: 'calc(25% - 12px)',    // 4 items: 3 gaps of 48px / 4 = 12px each
    };
    const width = widthMap[ui.width] || '100%';

    const wrapperSx = { width, flexShrink: 0 };

    const handleChange = (newValue: unknown) => {
      handleRepeatableFieldChange(sectionKey, rowIndex, fieldKey, newValue);
    };

    switch (component.componentType) {
      case 'text':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              size="small"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </Box>
        );

      case 'textarea':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </Box>
        );

      case 'number':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              helperText={config.helpText}
              placeholder={config.placeholder}
              value={value ?? ''}
              onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
              slotProps={{
                htmlInput: {
                  min: config.validation?.min,
                  max: config.validation?.max,
                },
              }}
            />
          </Box>
        );

      case 'date':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={config.label || fieldKey}
              required={config.required}
              disabled={config.disabled}
              value={(value as string) || ''}
              onChange={(e) => handleChange(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        );

      case 'select':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControl fullWidth size="small" required={config.required} disabled={config.disabled}>
              <InputLabel>{config.label || fieldKey}</InputLabel>
              <Select
                value={(value as string) || ''}
                label={config.label || fieldKey}
                onChange={(e) => handleChange(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {(config.data?.options || []).map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 'checkbox':
        return (
          <Box key={component.id} sx={wrapperSx}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={(value as boolean) || false}
                  onChange={(e) => handleChange(e.target.checked)}
                  disabled={config.disabled}
                />
              }
              label={config.label || fieldKey}
            />
          </Box>
        );

      default:
        return (
          <Box key={component.id} sx={wrapperSx}>
            <TextField
              fullWidth
              size="small"
              label={config.label || fieldKey}
              value={(value as string) || ''}
              onChange={(e) => handleChange(e.target.value)}
            />
          </Box>
        );
    }
  };

  // Main render function
  const renderComponent = (component: FormComponent): React.ReactNode => {
    if (component.isLayout) {
      return renderLayout(component);
    }
    return renderField(component);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Loading form...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          {viewMode === 'detail' ? (
            <IconButton edge="start" onClick={handleBackToList} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
          ) : (
            <IconButton edge="start" onClick={() => navigate(`/forms/${formId}/builder`)} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flex: 1 }}>
            {form?.name || 'Form Preview'}
            {viewMode === 'detail' && currentDocument && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                • {currentDocument.isSubmitted ? 'Viewing' : 'Editing Draft'}
              </Typography>
            )}
            {viewMode === 'detail' && !currentDocument && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                • New Document
              </Typography>
            )}
          </Typography>
          {viewMode === 'list' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleNewDocument}
              sx={{ mr: 1 }}
            >
              New Document
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/forms/${formId}/builder`)}
          >
            Edit Form
          </Button>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ px: 4, py: 4, maxWidth: '1600px', mx: 'auto', width: '100%' }}>
        {viewMode === 'list' ? (
          /* List View */
          <DocumentList
            formId={formId!}
            onDocumentClick={handleDocumentClick}
          />
        ) : (
          /* Detail View */
          <Paper
            elevation={0}
            sx={{
              p: 5,
              border: '1px solid #e0e0e0',
              borderRadius: 3,
              bgcolor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            {/* Form Header */}
            <Box sx={{ mb: 5, pb: 3, borderBottom: '2px solid #f0f0f0' }}>
              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ color: '#1a1a1a', mb: 1 }}>
                {form?.name}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                {currentDocument
                  ? `${currentDocument.isSubmitted ? 'Viewing' : 'Editing'} document`
                  : 'Fill out the form below and submit when ready.'}
              </Typography>
            </Box>

            {/* Form Fields */}
            {components.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                This form has no fields. Go back to the builder to add some components.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {components.map((component) => renderComponent(component))}
              </Box>
            )}

            {/* Form Actions */}
            {components.length > 0 && (
              <>
                <Divider sx={{ my: 5 }} />
                <Box sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'flex-end',
                  pt: 2,
                }}>
                  <Button
                    variant="outlined"
                    onClick={handleBackToList}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      }
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={handleSaveDraft}
                    size="large"
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                      }
                    }}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleSubmit}
                    size="large"
                    sx={{
                      px: 5,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                      }
                    }}
                  >
                    Submit
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        )}

        {/* Child Forms Tabs - Only show when viewing/editing an existing document */}
        {viewMode === 'detail' && currentDocument && form && (
          <ChildFormTabs
            parentDocumentId={currentDocument.id}
            documentTypeId={form.documentTypeId}
          />
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
