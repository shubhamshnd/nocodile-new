import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Chip,
  Tabs,
  Tab,
  Tooltip,
  Slider,
  Checkbox,
  Radio,
} from '@mui/material';
import {
  ArrowBack,
  TextFields,
  Numbers,
  CalendarMonth,
  CheckBox as CheckBoxIcon,
  RadioButtonChecked as RadioIcon,
  ArrowDropDownCircle,
  Notes,
  AttachFile,
  Search,
  Functions,
  Delete,
  DragIndicator,
  Settings,
  ViewColumn,
  ViewStream,
  Crop169,
  Segment,
  CreditCard,
  Tab as TabIcon,
  ExpandMore,
  ContentCopy,
  Add,
  HorizontalRule,
  SpaceBar,
  ToggleOn,
  LinearScale,
  Image,
  Schedule,
  AccessTime,
  Star,
  Code,
  Palette,
  Draw,
  FormatColorText,
  Checklist,
  DragHandle,
  Visibility,
  Repeat,
} from '@mui/icons-material';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { forms, formComponents } from '../services/api';
import type { Form, FormComponent, ComponentType, ComponentConfig, FieldComponentType } from '../types';
import { LAYOUT_TYPES, FIELD_TYPES, isLayoutType } from '../types';

// Icon map for component types
const ICON_MAP: Record<string, typeof TextFields> = {
  row: ViewColumn,
  column: ViewStream,
  container: Crop169,
  section: Segment,
  card: CreditCard,
  tabs: TabIcon,
  tab_panel: TabIcon,
  accordion: ExpandMore,
  accordion_panel: ExpandMore,
  divider: HorizontalRule,
  spacer: SpaceBar,
  repeatable_section: Repeat,
  text: TextFields,
  textarea: Notes,
  number: Numbers,
  date: CalendarMonth,
  datetime: Schedule,
  time: AccessTime,
  select: ArrowDropDownCircle,
  multiselect: Checklist,
  checkbox: CheckBoxIcon,
  checkbox_group: CheckBoxIcon,
  radio: RadioIcon,
  switch: ToggleOn,
  slider: LinearScale,
  file: AttachFile,
  image: Image,
  lookup: Search,
  computed: Functions,
  rich_text: FormatColorText,
  code: Code,
  color: Palette,
  rating: Star,
  signature: Draw,
};

function getIcon(type: ComponentType) {
  return ICON_MAP[type] || TextFields;
}

// ==================== Palette Components ====================

function PaletteSection({ title, items }: { title: string; items: { value: string; label: string }[] }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', mb: 0.5, px: 0.5 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {items.map((item) => (
          <PaletteItem key={item.value} type={item.value as ComponentType} label={item.label} />
        ))}
      </Box>
    </Box>
  );
}

function PaletteItem({ type, label }: { type: ComponentType; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type, isNew: true },
  });

  const Icon = getIcon(type);

  return (
    <Tooltip title={label} placement="top">
      <Paper
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        sx={{
          p: 0.75,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.25,
          cursor: 'grab',
          opacity: isDragging ? 0.5 : 1,
          width: 56,
          '&:hover': { bgcolor: '#e3f2fd', borderColor: '#1976d2' },
          border: '1px solid #e0e0e0',
          transition: 'all 0.15s',
        }}
      >
        <Icon sx={{ fontSize: 18, color: '#555' }} />
        <Typography sx={{ fontSize: '0.55rem', textAlign: 'center', lineHeight: 1.1 }}>{label}</Typography>
      </Paper>
    </Tooltip>
  );
}

// ==================== Drop Zone ====================

function DropZone({ id, children, isEmpty, label }: { id: string; children?: React.ReactNode; isEmpty?: boolean; label?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight: isEmpty ? 60 : 'auto',
        p: isEmpty ? 2 : 0,
        border: isEmpty ? '2px dashed' : 'none',
        borderColor: isOver ? '#1976d2' : '#ccc',
        borderRadius: 1,
        bgcolor: isOver ? '#e3f2fd' : isEmpty ? '#fafafa' : 'transparent',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        flex: 1,
      }}
    >
      {isEmpty ? (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center' }}>{label || 'Drop here'}</Typography>
      ) : (
        children
      )}
    </Box>
  );
}

// ==================== Column Resize Handle ====================

interface ResizeHandleProps {
  onResize: (deltaSpan: number) => void;
  leftSpan: number;
  rightSpan: number;
}

function ResizeHandle({ onResize, leftSpan, rightSpan }: ResizeHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const containerWidthRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startXRef.current = e.clientX;
    // Get the row container width
    const row = handleRef.current?.closest('[data-row-container]');
    containerWidthRef.current = row?.clientWidth || 600;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const spanPerPixel = 12 / containerWidthRef.current;
      const deltaSpan = Math.round(deltaX * spanPerPixel);

      if (deltaSpan !== 0 && leftSpan + deltaSpan >= 1 && rightSpan - deltaSpan >= 1) {
        onResize(deltaSpan);
        startXRef.current = e.clientX;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize, leftSpan, rightSpan]);

  return (
    <Box
      ref={handleRef}
      onMouseDown={handleMouseDown}
      sx={{
        width: 8,
        minHeight: 40,
        cursor: 'col-resize',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDragging ? '#1976d2' : 'transparent',
        '&:hover': { bgcolor: '#e3f2fd' },
        borderRadius: 0.5,
        mx: 0.25,
        transition: 'background-color 0.15s',
      }}
    >
      <DragHandle sx={{ fontSize: 12, color: isDragging ? '#fff' : '#999', transform: 'rotate(90deg)' }} />
    </Box>
  );
}

// ==================== Canvas Component ====================

interface CanvasComponentProps {
  component: FormComponent;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  depth: number;
  selectedId: string | null;
  onSelectComponent: (id: string) => void;
  onDeleteComponent: (id: string) => void;
  onDuplicateComponent: (id: string) => void;
  onUpdateComponent: (id: string, updates: Partial<FormComponent>) => void;
  isInsideRow?: boolean;
}

function CanvasComponent({
  component,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
  depth,
  selectedId,
  onSelectComponent,
  onDeleteComponent,
  onDuplicateComponent,
  onUpdateComponent,
  isInsideRow,
}: CanvasComponentProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
    data: { type: component.componentType, parentId: component.parentId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = getIcon(component.componentType);
  const isLayout = component.isLayout;
  const config = component.config || {};
  const ui = (config.ui || {}) as any;

  // Handle column resize
  const handleColumnResize = (leftIndex: number, deltaSpan: number) => {
    if (!component.children || component.children.length < 2) return;

    const leftChild = component.children[leftIndex];
    const rightChild = component.children[leftIndex + 1];

    if (!leftChild || !rightChild) return;

    const leftSpan = (leftChild.config?.ui as any)?.span || 6;
    const rightSpan = (rightChild.config?.ui as any)?.span || 6;

    const newLeftSpan = Math.max(1, Math.min(11, leftSpan + deltaSpan));
    const newRightSpan = Math.max(1, Math.min(11, rightSpan - deltaSpan));

    // Update both columns
    onUpdateComponent(leftChild.id, {
      config: { ...leftChild.config, ui: { ...(leftChild.config?.ui || {}), span: newLeftSpan } },
    });
    onUpdateComponent(rightChild.id, {
      config: { ...rightChild.config, ui: { ...(rightChild.config?.ui || {}), span: newRightSpan } },
    });
  };

  // Layout-specific rendering
  if (isLayout) {
    const isRow = component.componentType === 'row';
    const isColumn = component.componentType === 'column';
    const isRepeatableSection = component.componentType === 'repeatable_section';

    return (
      <Paper
        ref={setNodeRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        sx={{
          border: isSelected ? '2px solid #1976d2' : isRepeatableSection ? '2px solid #9c27b0' : '1px solid #e0e0e0',
          borderRadius: 1,
          bgcolor: isSelected ? '#e3f2fd' : isRepeatableSection ? '#f3e5f5' : ui.background || '#fff',
          p: ui.padding ? ui.padding * 0.5 : 1,
          mb: isInsideRow && isColumn ? 0 : 1,
          position: 'relative',
          minHeight: isRow ? 60 : 40,
          height: isInsideRow && isColumn ? '100%' : undefined,
          boxSizing: 'border-box',
          ...(component.componentType === 'divider' && {
            minHeight: 20,
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
          }),
          ...(component.componentType === 'spacer' && {
            minHeight: ui.minHeight || 24,
            bgcolor: 'transparent',
            border: isSelected ? '2px dashed #1976d2' : '1px dashed #ccc',
          }),
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
          <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', p: 0.25 }}>
            <DragIndicator sx={{ fontSize: 14 }} />
          </IconButton>
          <Icon sx={{ fontSize: 14, color: isRepeatableSection ? '#9c27b0' : '#666' }} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, flex: 1 }}>
            {config.label || component.componentType}
            {isColumn && ` (${ui.span || 6}/12)`}
            {isRepeatableSection && (
              <Chip
                label={`${config.minRows || 0}-${config.maxRows || '∞'} rows`}
                size="small"
                sx={{ ml: 1, fontSize: '0.55rem', height: 16, bgcolor: '#9c27b0', color: '#fff' }}
              />
            )}
          </Typography>
          <Tooltip title="Duplicate">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} sx={{ p: 0.25 }}>
              <ContentCopy sx={{ fontSize: 12 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }} sx={{ p: 0.25 }}>
              <Delete sx={{ fontSize: 12, color: '#d32f2f' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Repeatable Section Info */}
        {isRepeatableSection && (
          <Box sx={{
            mb: 1,
            p: 0.75,
            bgcolor: '#fff',
            borderRadius: 0.5,
            border: '1px dashed #9c27b0',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <Repeat sx={{ fontSize: 14, color: '#9c27b0' }} />
            <Typography sx={{ fontSize: '0.65rem', color: '#666' }}>
              Key: <strong>{config.sectionKey || 'section_' + component.id.slice(0, 8)}</strong>
              {' • '}
              Fields below will repeat for each row
            </Typography>
          </Box>
        )}

        {/* Children area */}
        {component.componentType !== 'divider' && component.componentType !== 'spacer' && (
          <Box
            data-row-container={isRow ? 'true' : undefined}
            data-column-container={isColumn ? 'true' : undefined}
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: isRow ? '4px' : '8px',
              minHeight: 40,
              width: '100%',
            }}
          >
            {component.children && component.children.length > 0 ? (
              <SortableContext items={component.children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                {component.children.map((child, index) => {
                  // For columns inside rows, use span-based width
                  const span = (child.config?.ui as any)?.span || 6;
                  const spanWidthPercent = (span / 12) * 100;

                  // For fields inside columns, use width setting (full, half, third, quarter)
                  const fieldWidth = (child.config?.ui as any)?.width || 'full';
                  const fieldWidthMap: Record<string, number> = {
                    full: 100,
                    half: 50,
                    third: 33.33,
                    quarter: 25,
                  };
                  const fieldWidthPercent = fieldWidthMap[fieldWidth] || 100;

                  // Calculate the actual width
                  let childWidth = '100%';
                  const childCount = component.children?.length || 1;
                  const gapPx = 8; // gap between items

                  if (isRow && child.componentType === 'column') {
                    // Row children (columns): use span-based width
                    const colGapAdjust = childCount > 1 ? 4 : 0;
                    childWidth = `calc(${spanWidthPercent}% - ${colGapAdjust}px)`;
                  } else if (!isRow && child.isField) {
                    // Non-row containers (columns, sections, etc.): use field width setting
                    if (fieldWidth !== 'full') {
                      // Account for gap when not full width
                      const itemsPerRow = Math.floor(100 / fieldWidthPercent);
                      const gapAdjust = itemsPerRow > 1 ? gapPx * (itemsPerRow - 1) / itemsPerRow : 0;
                      childWidth = `calc(${fieldWidthPercent}% - ${gapAdjust}px)`;
                    }
                  }

                  return (
                    <Box
                      key={child.id}
                      sx={{
                        position: 'relative',
                        width: childWidth,
                        flexShrink: 0,
                      }}
                    >
                      <CanvasComponent
                        component={child}
                        isSelected={selectedId === child.id}
                        onSelect={() => onSelectComponent(child.id)}
                        onDelete={() => onDeleteComponent(child.id)}
                        onDuplicate={() => onDuplicateComponent(child.id)}
                        depth={depth + 1}
                        selectedId={selectedId}
                        onSelectComponent={onSelectComponent}
                        onDeleteComponent={onDeleteComponent}
                        onDuplicateComponent={onDuplicateComponent}
                        onUpdateComponent={onUpdateComponent}
                        isInsideRow={isRow}
                      />
                      {/* Resize handle on right edge of column (except last) */}
                      {isRow && child.componentType === 'column' && component.children && index < component.children.length - 1 && (
                        <Box sx={{ position: 'absolute', right: -6, top: 0, bottom: 0, zIndex: 10 }}>
                          <ResizeHandle
                            leftSpan={(child.config?.ui as any)?.span || 6}
                            rightSpan={(component.children?.[index + 1]?.config?.ui as any)?.span || 6}
                            onResize={(delta) => handleColumnResize(index, delta)}
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </SortableContext>
            ) : (
              <DropZone id={`drop-${component.id}`} isEmpty label="Drop components here" />
            )}
          </Box>
        )}

        {component.componentType === 'divider' && <Divider sx={{ flex: 1 }} />}
      </Paper>
    );
  }

  // Field component rendering
  const fieldWidth = ui.width || 'full';
  const widthLabel = fieldWidth !== 'full' ? ` (${fieldWidth})` : '';

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      sx={{
        p: 1,
        mb: 0, // No bottom margin - gap is handled by parent flexbox
        border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
        bgcolor: isSelected ? '#e3f2fd' : '#fff',
        cursor: 'pointer',
        height: '100%',
        boxSizing: 'border-box',
        '&:hover': { borderColor: '#1976d2' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', p: 0.25 }}>
          <DragIndicator sx={{ fontSize: 14 }} />
        </IconButton>
        <Icon sx={{ fontSize: 14, color: '#666' }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.label || component.fieldKey || component.componentType}{widthLabel}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {component.fieldKey && `${component.fieldKey} • `}{component.componentType}
          </Typography>
        </Box>
        {config.required && <Chip label="*" size="small" color="error" sx={{ fontSize: '0.6rem', height: 16, minWidth: 16 }} />}
        <Tooltip title="Duplicate">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} sx={{ p: 0.25 }}>
            <ContentCopy sx={{ fontSize: 12 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }} sx={{ p: 0.25 }}>
            <Delete sx={{ fontSize: 12, color: '#d32f2f' }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ mt: 1, pl: 3 }}>
        <FieldPreview type={component.componentType as FieldComponentType} config={config} />
      </Box>
    </Paper>
  );
}

// ==================== Field Preview ====================

function FieldPreview({ type, config }: { type: FieldComponentType; config: ComponentConfig }) {
  const inputSx = { '& .MuiInputBase-input': { fontSize: '0.7rem' } };

  switch (type) {
    case 'text':
      return <TextField size="small" fullWidth placeholder={config.placeholder || 'Enter text...'} disabled sx={inputSx} />;
    case 'textarea':
      return <TextField size="small" fullWidth multiline rows={2} placeholder={config.placeholder || 'Enter text...'} disabled sx={inputSx} />;
    case 'number':
      return <TextField size="small" type="number" fullWidth placeholder="0" disabled sx={inputSx} />;
    case 'date':
      return <TextField size="small" type="date" fullWidth disabled sx={inputSx} />;
    case 'datetime':
      return <TextField size="small" type="datetime-local" fullWidth disabled sx={inputSx} />;
    case 'time':
      return <TextField size="small" type="time" fullWidth disabled sx={inputSx} />;
    case 'select':
    case 'multiselect':
      return <Select size="small" fullWidth displayEmpty disabled sx={{ fontSize: '0.7rem' }}><MenuItem value="">Select...</MenuItem></Select>;
    case 'checkbox':
      return <FormControlLabel control={<Checkbox disabled size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Option</Typography>} />;
    case 'radio':
      return <FormControlLabel control={<Radio disabled size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Option</Typography>} />;
    case 'switch':
      return <FormControlLabel control={<Switch disabled size="small" />} label={<Typography sx={{ fontSize: '0.7rem' }}>Toggle</Typography>} />;
    case 'slider':
      return <Slider size="small" disabled defaultValue={50} sx={{ mx: 1 }} />;
    case 'file':
    case 'image':
      return <Button size="small" variant="outlined" disabled sx={{ fontSize: '0.65rem' }}>Upload</Button>;
    case 'rating':
      return <Box sx={{ display: 'flex', gap: 0.25 }}>{[1, 2, 3, 4, 5].map(i => <Star key={i} sx={{ fontSize: 16, color: '#ccc' }} />)}</Box>;
    default:
      return <TextField size="small" fullWidth placeholder="..." disabled sx={inputSx} />;
  }
}

// ==================== Properties Panel ====================

function PropertiesPanel({ component, onUpdate }: { component: FormComponent | null; onUpdate: (updates: Partial<FormComponent>) => void }) {
  const [tabIndex, setTabIndex] = useState(0);

  if (!component) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Settings sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
        <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>Select a component to edit</Typography>
      </Box>
    );
  }

  const config = component.config || {};
  const ui = (config.ui || {}) as any;
  const isLayout = component.isLayout;

  const updateConfig = (updates: Partial<ComponentConfig>) => {
    onUpdate({ config: { ...config, ...updates } });
  };

  const updateUI = (updates: Record<string, any>) => {
    updateConfig({ ui: { ...ui, ...updates } });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, borderBottom: '1px solid #eee' }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{config.label || component.componentType}</Typography>
        <Typography sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{component.componentType}</Typography>
      </Box>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Basic" sx={{ fontSize: '0.65rem', minWidth: 50, textTransform: 'none', p: 1 }} />
        <Tab label="Style" sx={{ fontSize: '0.65rem', minWidth: 50, textTransform: 'none', p: 1 }} />
        {(!isLayout || component.componentType === 'repeatable_section') && <Tab label="Validation" sx={{ fontSize: '0.65rem', minWidth: 50, textTransform: 'none', p: 1 }} />}
        {!isLayout && <Tab label="Data" sx={{ fontSize: '0.65rem', minWidth: 50, textTransform: 'none', p: 1 }} />}
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {/* Basic Tab */}
        {tabIndex === 0 && (
          <>
            {!isLayout && (
              <TextField fullWidth size="small" label="Field Key" value={component.fieldKey || ''}
                onChange={(e) => onUpdate({ fieldKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
            )}
            <TextField fullWidth size="small" label="Label" value={config.label || ''}
              onChange={(e) => updateConfig({ label: e.target.value })}
              margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />

            {/* Repeatable Section Configuration */}
            {component.componentType === 'repeatable_section' && (
              <>
                <Divider sx={{ my: 1.5 }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1, color: '#9c27b0' }}>
                  Repeatable Section Settings
                </Typography>
                <TextField fullWidth size="small" label="Section Key" value={config.sectionKey || ''}
                  onChange={(e) => updateConfig({ sectionKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }}
                  helperText="Unique key for this section in form data (e.g., bollards)"
                  FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField fullWidth size="small" label="Min Rows" type="number" value={config.minRows ?? 0}
                    onChange={(e) => updateConfig({ minRows: parseInt(e.target.value) || 0 })}
                    margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 0, max: 100 } }}
                    InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                  <TextField fullWidth size="small" label="Max Rows" type="number" value={config.maxRows ?? 0}
                    onChange={(e) => updateConfig({ maxRows: parseInt(e.target.value) || 0 })}
                    margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 0, max: 100 } }}
                    InputLabelProps={{ sx: { fontSize: '0.7rem' } }}
                    helperText="0 = unlimited"
                    FormHelperTextProps={{ sx: { fontSize: '0.6rem' } }}
                  />
                </Box>
                <Divider sx={{ my: 1.5 }} />
              </>
            )}

            {!isLayout && (
              <>
                <TextField fullWidth size="small" label="Placeholder" value={config.placeholder || ''}
                  onChange={(e) => updateConfig({ placeholder: e.target.value })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Help Text" value={config.helpText || ''} multiline rows={2}
                  onChange={(e) => updateConfig({ helpText: e.target.value })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Default Value" value={(config.defaultValue as string) || ''}
                  onChange={(e) => updateConfig({ defaultValue: e.target.value })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
              </>
            )}
            <FormControlLabel
              control={<Switch size="small" checked={config.hidden || false} onChange={(e) => updateConfig({ hidden: e.target.checked })} />}
              label={<Typography sx={{ fontSize: '0.7rem' }}>Hidden</Typography>}
            />
            <FormControlLabel
              control={<Switch size="small" checked={config.disabled || false} onChange={(e) => updateConfig({ disabled: e.target.checked })} />}
              label={<Typography sx={{ fontSize: '0.7rem' }}>Disabled</Typography>}
            />
          </>
        )}

        {/* Style Tab */}
        {tabIndex === 1 && (
          <>
            {isLayout ? (
              <>
                {component.componentType === 'column' && (
                  <>
                    <Typography sx={{ fontSize: '0.7rem', mb: 0.5, fontWeight: 500 }}>Column Width ({ui.span || 6}/12)</Typography>
                    <Box sx={{ px: 1, mb: 2 }}>
                      <Slider
                        size="small"
                        value={ui.span || 6}
                        onChange={(_, v) => updateUI({ span: v })}
                        min={1}
                        max={12}
                        marks={[
                          { value: 3, label: '3' },
                          { value: 6, label: '6' },
                          { value: 9, label: '9' },
                          { value: 12, label: '12' },
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Box>
                    <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 1 }}>
                      Tip: Drag the handle between columns to resize visually
                    </Typography>
                  </>
                )}
                <TextField fullWidth size="small" label="Gap" type="number" value={ui.gap || 1}
                  onChange={(e) => updateUI({ gap: parseInt(e.target.value) || 1 })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 0, max: 10 } }}
                  InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Padding" type="number" value={ui.padding || 1}
                  onChange={(e) => updateUI({ padding: parseInt(e.target.value) || 1 })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 0, max: 10 } }}
                  InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Background" type="color" value={ui.background || '#ffffff'}
                  onChange={(e) => updateUI({ background: e.target.value })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }}
                  InputLabelProps={{ sx: { fontSize: '0.7rem' }, shrink: true }} />
                <FormControlLabel
                  control={<Switch size="small" checked={ui.border || false} onChange={(e) => updateUI({ border: e.target.checked })} />}
                  label={<Typography sx={{ fontSize: '0.7rem' }}>Show Border</Typography>}
                />
                <TextField fullWidth size="small" label="Border Radius" type="number" value={ui.borderRadius || 0}
                  onChange={(e) => updateUI({ borderRadius: parseInt(e.target.value) || 0 })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 0, max: 20 } }}
                  InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                {component.componentType === 'spacer' && (
                  <TextField fullWidth size="small" label="Height (px)" type="number" value={ui.minHeight || 24}
                    onChange={(e) => updateUI({ minHeight: parseInt(e.target.value) || 24 })}
                    margin="dense" InputProps={{ sx: { fontSize: '0.7rem' }, inputProps: { min: 8, max: 200 } }}
                    InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                )}
              </>
            ) : (
              <>
                <FormControl fullWidth size="small" margin="dense">
                  <InputLabel sx={{ fontSize: '0.7rem' }}>Width</InputLabel>
                  <Select value={ui.width || 'full'} onChange={(e) => updateUI({ width: e.target.value })} label="Width" sx={{ fontSize: '0.7rem' }}>
                    <MenuItem value="full" sx={{ fontSize: '0.7rem' }}>Full</MenuItem>
                    <MenuItem value="half" sx={{ fontSize: '0.7rem' }}>Half</MenuItem>
                    <MenuItem value="third" sx={{ fontSize: '0.7rem' }}>Third</MenuItem>
                    <MenuItem value="quarter" sx={{ fontSize: '0.7rem' }}>Quarter</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" margin="dense">
                  <InputLabel sx={{ fontSize: '0.7rem' }}>Size</InputLabel>
                  <Select value={ui.size || 'medium'} onChange={(e) => updateUI({ size: e.target.value })} label="Size" sx={{ fontSize: '0.7rem' }}>
                    <MenuItem value="small" sx={{ fontSize: '0.7rem' }}>Small</MenuItem>
                    <MenuItem value="medium" sx={{ fontSize: '0.7rem' }}>Medium</MenuItem>
                    <MenuItem value="large" sx={{ fontSize: '0.7rem' }}>Large</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </>
        )}

        {/* Validation Tab */}
        {tabIndex === 2 && (!isLayout || component.componentType === 'repeatable_section') && (
          <>
            {/* Regular field validation */}
            {!isLayout && (
              <>
                <FormControlLabel
                  control={<Switch size="small" checked={config.required || false} onChange={(e) => updateConfig({ required: e.target.checked })} />}
                  label={<Typography sx={{ fontSize: '0.7rem' }}>Required</Typography>}
                />
                {['text', 'textarea', 'number'].includes(component.componentType) && (
                  <>
                    <TextField fullWidth size="small" label={component.componentType === 'number' ? 'Min Value' : 'Min Length'} type="number"
                      value={config.validation?.min || ''}
                      onChange={(e) => updateConfig({ validation: { ...config.validation, min: parseInt(e.target.value) || undefined } })}
                      margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                    <TextField fullWidth size="small" label={component.componentType === 'number' ? 'Max Value' : 'Max Length'} type="number"
                      value={config.validation?.max || ''}
                      onChange={(e) => updateConfig({ validation: { ...config.validation, max: parseInt(e.target.value) || undefined } })}
                      margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                  </>
                )}
                {['text', 'textarea'].includes(component.componentType) && (
                  <TextField fullWidth size="small" label="Pattern (Regex)" value={config.validation?.pattern || ''}
                    onChange={(e) => updateConfig({ validation: { ...config.validation, pattern: e.target.value } })}
                    margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                )}
                <TextField fullWidth size="small" label="Error Message" value={config.validation?.message || ''}
                  onChange={(e) => updateConfig({ validation: { ...config.validation, message: e.target.value } })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
              </>
            )}

            {/* Repeatable Section Cross-Row Validation */}
            {component.componentType === 'repeatable_section' && (
              <>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, mb: 1, color: '#9c27b0' }}>
                  Cross-Row Validation Rules
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary', mb: 1 }}>
                  Define rules that validate across all rows (e.g., sum, unique values)
                </Typography>

                {(config.crossRowValidation || []).map((rule: any, idx: number) => (
                  <Paper key={idx} sx={{ p: 1, mb: 1, bgcolor: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <InputLabel sx={{ fontSize: '0.65rem' }}>Type</InputLabel>
                        <Select value={rule.type || 'sum'} label="Type" sx={{ fontSize: '0.65rem' }}
                          onChange={(e) => {
                            const newRules = [...(config.crossRowValidation || [])];
                            newRules[idx] = { ...rule, type: e.target.value };
                            updateConfig({ crossRowValidation: newRules });
                          }}>
                          <MenuItem value="sum" sx={{ fontSize: '0.65rem' }}>Sum</MenuItem>
                          <MenuItem value="count" sx={{ fontSize: '0.65rem' }}>Count</MenuItem>
                          <MenuItem value="unique" sx={{ fontSize: '0.65rem' }}>Unique</MenuItem>
                          <MenuItem value="custom" sx={{ fontSize: '0.65rem' }}>Custom</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField size="small" label="Field" value={rule.field || ''} sx={{ flex: 1 }}
                        onChange={(e) => {
                          const newRules = [...(config.crossRowValidation || [])];
                          newRules[idx] = { ...rule, field: e.target.value };
                          updateConfig({ crossRowValidation: newRules });
                        }}
                        InputProps={{ sx: { fontSize: '0.65rem' } }} InputLabelProps={{ sx: { fontSize: '0.65rem' } }} />
                      <IconButton size="small" onClick={() => {
                        const newRules = (config.crossRowValidation || []).filter((_: any, i: number) => i !== idx);
                        updateConfig({ crossRowValidation: newRules });
                      }}>
                        <Delete sx={{ fontSize: 14, color: '#d32f2f' }} />
                      </IconButton>
                    </Box>
                    {rule.type !== 'unique' && (
                      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                        <FormControl size="small" sx={{ minWidth: 60 }}>
                          <InputLabel sx={{ fontSize: '0.65rem' }}>Op</InputLabel>
                          <Select value={rule.operator || '='} label="Op" sx={{ fontSize: '0.65rem' }}
                            onChange={(e) => {
                              const newRules = [...(config.crossRowValidation || [])];
                              newRules[idx] = { ...rule, operator: e.target.value };
                              updateConfig({ crossRowValidation: newRules });
                            }}>
                            <MenuItem value="=" sx={{ fontSize: '0.65rem' }}>=</MenuItem>
                            <MenuItem value="!=" sx={{ fontSize: '0.65rem' }}>!=</MenuItem>
                            <MenuItem value="<" sx={{ fontSize: '0.65rem' }}>&lt;</MenuItem>
                            <MenuItem value="<=" sx={{ fontSize: '0.65rem' }}>&lt;=</MenuItem>
                            <MenuItem value=">" sx={{ fontSize: '0.65rem' }}>&gt;</MenuItem>
                            <MenuItem value=">=" sx={{ fontSize: '0.65rem' }}>&gt;=</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField size="small" label="Value" type="number" value={rule.value ?? ''} sx={{ flex: 1 }}
                          onChange={(e) => {
                            const newRules = [...(config.crossRowValidation || [])];
                            newRules[idx] = { ...rule, value: parseFloat(e.target.value) || 0 };
                            updateConfig({ crossRowValidation: newRules });
                          }}
                          InputProps={{ sx: { fontSize: '0.65rem' } }} InputLabelProps={{ sx: { fontSize: '0.65rem' } }} />
                      </Box>
                    )}
                    <TextField fullWidth size="small" label="Error Message" value={rule.message || ''}
                      onChange={(e) => {
                        const newRules = [...(config.crossRowValidation || [])];
                        newRules[idx] = { ...rule, message: e.target.value };
                        updateConfig({ crossRowValidation: newRules });
                      }}
                      InputProps={{ sx: { fontSize: '0.65rem' } }} InputLabelProps={{ sx: { fontSize: '0.65rem' } }} />
                  </Paper>
                ))}

                <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    const newRules = [...(config.crossRowValidation || []), { type: 'sum' as const, field: '', operator: '<=' as const, value: 0, message: '' }];
                    updateConfig({ crossRowValidation: newRules });
                  }}
                  sx={{ fontSize: '0.65rem', textTransform: 'none', color: '#9c27b0' }}>
                  Add Validation Rule
                </Button>
              </>
            )}
          </>
        )}

        {/* Data Tab */}
        {tabIndex === 3 && !isLayout && (
          <>
            {['select', 'multiselect', 'radio', 'checkbox_group'].includes(component.componentType) && (
              <Box>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, mb: 1 }}>Options</Typography>
                {(config.data?.options || []).map((opt, idx) => (
                  <Box key={idx} sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                    <TextField size="small" placeholder="Value" value={opt.value}
                      onChange={(e) => {
                        const newOptions = [...(config.data?.options || [])];
                        newOptions[idx] = { ...opt, value: e.target.value };
                        updateConfig({ data: { ...config.data, options: newOptions } });
                      }}
                      sx={{ flex: 1 }} InputProps={{ sx: { fontSize: '0.65rem' } }} />
                    <TextField size="small" placeholder="Label" value={opt.label}
                      onChange={(e) => {
                        const newOptions = [...(config.data?.options || [])];
                        newOptions[idx] = { ...opt, label: e.target.value };
                        updateConfig({ data: { ...config.data, options: newOptions } });
                      }}
                      sx={{ flex: 1 }} InputProps={{ sx: { fontSize: '0.65rem' } }} />
                    <IconButton size="small" onClick={() => {
                      const newOptions = (config.data?.options || []).filter((_, i) => i !== idx);
                      updateConfig({ data: { ...config.data, options: newOptions } });
                    }}>
                      <Delete sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
                <Button size="small" startIcon={<Add sx={{ fontSize: 14 }} />}
                  onClick={() => {
                    const newOptions = [...(config.data?.options || []), { value: '', label: '' }];
                    updateConfig({ data: { ...config.data, options: newOptions } });
                  }}
                  sx={{ fontSize: '0.65rem', textTransform: 'none' }}>
                  Add Option
                </Button>
              </Box>
            )}
            {component.componentType === 'lookup' && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 500, mb: 1 }}>Lookup Source</Typography>
                <TextField fullWidth size="small" label="Document Type" value={config.data?.source?.documentType || ''}
                  onChange={(e) => updateConfig({ data: { ...config.data, source: { ...config.data?.source, documentType: e.target.value } } })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Value Field" value={config.data?.source?.valueField || ''}
                  onChange={(e) => updateConfig({ data: { ...config.data, source: { ...config.data?.source, valueField: e.target.value } } })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
                <TextField fullWidth size="small" label="Label Field" value={config.data?.source?.labelField || ''}
                  onChange={(e) => updateConfig({ data: { ...config.data, source: { ...config.data?.source, labelField: e.target.value } } })}
                  margin="dense" InputProps={{ sx: { fontSize: '0.7rem' } }} InputLabelProps={{ sx: { fontSize: '0.7rem' } }} />
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

// ==================== Main FormBuilder ====================

export default function FormBuilder() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (formId) loadForm();
  }, [formId]);

  const loadForm = async () => {
    if (!formId) return;
    const [formData, componentTree] = await Promise.all([
      forms.get(formId),
      formComponents.getTree(formId),
    ]);
    setForm(formData);
    setComponents(componentTree);
  };

  const findComponent = useCallback((id: string, tree: FormComponent[]): FormComponent | null => {
    for (const comp of tree) {
      if (comp.id === id) return comp;
      if (comp.children) {
        const found = findComponent(id, comp.children);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const selectedComponent = useMemo(() => {
    if (!selectedId) return null;
    return findComponent(selectedId, components);
  }, [selectedId, components, findComponent]);

  const updateComponentInTree = useCallback((tree: FormComponent[], id: string, updates: Partial<FormComponent>): FormComponent[] => {
    return tree.map((comp) => {
      if (comp.id === id) {
        const newConfig = updates.config ? { ...comp.config, ...updates.config } : comp.config;
        return { ...comp, ...updates, config: newConfig };
      }
      if (comp.children) {
        return { ...comp, children: updateComponentInTree(comp.children, id, updates) };
      }
      return comp;
    });
  }, []);

  const deleteComponentFromTree = useCallback((tree: FormComponent[], id: string): FormComponent[] => {
    return tree.filter((comp) => comp.id !== id).map((comp) => {
      if (comp.children) {
        return { ...comp, children: deleteComponentFromTree(comp.children, id) };
      }
      return comp;
    });
  }, []);

  const addComponentToTree = useCallback((tree: FormComponent[], parentId: string | null, newComponent: FormComponent): FormComponent[] => {
    if (!parentId) return [...tree, newComponent];
    return tree.map((comp) => {
      if (comp.id === parentId) {
        return { ...comp, children: [...(comp.children || []), newComponent] };
      }
      if (comp.children) {
        return { ...comp, children: addComponentToTree(comp.children, parentId, newComponent) };
      }
      return comp;
    });
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !formId) return;

    const activeData = active.data.current;

    if (activeData?.isNew) {
      const componentType = activeData.type as ComponentType;
      let parentId: string | null = null;

      const overId = over.id as string;
      if (overId.startsWith('drop-')) {
        parentId = overId.replace('drop-', '');
      } else if (overId !== 'canvas') {
        const overComponent = findComponent(overId, components);
        if (overComponent?.isLayout) {
          parentId = overId;
        } else {
          parentId = overComponent?.parentId || null;
        }
      }

      const isLayout = isLayoutType(componentType);
      const newComponent = await formComponents.create({
        formId,
        parentId,
        componentType,
        fieldKey: isLayout ? '' : `field_${Date.now()}`,
        config: {
          label: [...LAYOUT_TYPES, ...FIELD_TYPES].find((t) => t.value === componentType)?.label || componentType,
          ...(componentType === 'column' && { ui: { span: 6 } }),
        },
      });

      setComponents(addComponentToTree(components, parentId, newComponent));
      setSelectedId(newComponent.id);
    }
  };

  // Handle component update (including from resize)
  const handleUpdateComponent = async (id: string, updates: Partial<FormComponent>) => {
    const comp = findComponent(id, components);
    if (!comp) return;

    const updated = { ...comp, ...updates };
    if (updates.config) {
      updated.config = { ...comp.config, ...updates.config };
    }

    setComponents(updateComponentInTree(components, id, updated));

    // Debounce API call
    setSaving(true);
    await formComponents.update(id, {
      componentType: updated.componentType,
      fieldKey: updated.fieldKey,
      config: updated.config,
    });
    setSaving(false);
  };

  const handleUpdateSelectedComponent = async (updates: Partial<FormComponent>) => {
    if (!selectedId) return;
    await handleUpdateComponent(selectedId, updates);
  };

  const handleDeleteComponent = async (id: string) => {
    if (!confirm('Delete this component?')) return;
    await formComponents.delete(id);
    setComponents(deleteComponentFromTree(components, id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleDuplicateComponent = async (id: string) => {
    const duplicated = await formComponents.duplicate(id);
    await loadForm();
    setSelectedId(duplicated.id);
  };

  const activeDragType = activeId?.startsWith('palette-') ? (activeId.replace('palette-', '') as ComponentType) : null;
  const ActiveIcon = activeDragType ? getIcon(activeDragType) : null;

  return (
    <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 1, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={() => navigate('/forms')}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, flex: 1 }}>{form?.name || 'Form Builder'}</Typography>
          {saving && <Chip label="Saving..." size="small" sx={{ fontSize: '0.6rem' }} />}
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={() => navigate(`/forms/${formId}/preview`)}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            Preview
          </Button>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left Panel */}
          <Box sx={{ width: 180, borderRight: '1px solid #eee', overflow: 'auto', p: 1, bgcolor: '#fafafa' }}>
            <PaletteSection title="Layout" items={LAYOUT_TYPES} />
            <Divider sx={{ my: 1 }} />
            <PaletteSection title="Fields" items={FIELD_TYPES} />
          </Box>

          {/* Center Canvas */}
          <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#f0f0f0' }}>
            <Paper sx={{ maxWidth: 900, mx: 'auto', p: 2, minHeight: 500 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 2, color: '#333' }}>{form?.name}</Typography>

              <DropZone id="canvas" isEmpty={components.length === 0} label="Drag a Row to start, then add Columns inside it">
                <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                  {components.map((component) => (
                    <CanvasComponent
                      key={component.id}
                      component={component}
                      isSelected={selectedId === component.id}
                      onSelect={() => setSelectedId(component.id)}
                      onDelete={() => handleDeleteComponent(component.id)}
                      onDuplicate={() => handleDuplicateComponent(component.id)}
                      depth={0}
                      selectedId={selectedId}
                      onSelectComponent={setSelectedId}
                      onDeleteComponent={handleDeleteComponent}
                      onDuplicateComponent={handleDuplicateComponent}
                      onUpdateComponent={handleUpdateComponent}
                    />
                  ))}
                </SortableContext>
              </DropZone>
            </Paper>
          </Box>

          {/* Right Panel */}
          <Box sx={{ width: 260, borderLeft: '1px solid #eee', bgcolor: '#fff', overflow: 'hidden' }}>
            <PropertiesPanel component={selectedComponent} onUpdate={handleUpdateSelectedComponent} />
          </Box>
        </Box>
      </Box>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeDragType && ActiveIcon && (
          <Paper sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, opacity: 0.9 }}>
            <ActiveIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontSize: '0.75rem' }}>
              {[...LAYOUT_TYPES, ...FIELD_TYPES].find((t) => t.value === activeDragType)?.label}
            </Typography>
          </Paper>
        )}
      </DragOverlay>

    </DndContext>
  );
}
