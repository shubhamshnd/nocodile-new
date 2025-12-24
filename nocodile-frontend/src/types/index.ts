export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isSuperuser: boolean;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentType {
  id: string;
  applicationId: string;
  name: string;
  slug: string;
  settings: {
    ui?: { icon?: string; color?: string };
    defaultWorkflow?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FormStage {
  key: string;
  title: string;
  order: number;
  fields: string[];
}

export interface FormStages {
  mode: 'stepper' | 'tabs';
  allowPartialSave: boolean;
  stages: FormStage[];
}

export interface Form {
  id: string;
  documentTypeId: string;
  name: string;
  stages: FormStages;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============== Component Types ==============

// Layout component types
export type LayoutComponentType =
  | 'row'
  | 'column'
  | 'container'
  | 'section'
  | 'card'
  | 'tabs'
  | 'tab_panel'
  | 'accordion'
  | 'accordion_panel'
  | 'divider'
  | 'spacer'
  | 'repeatable_section';

// Field component types
export type FieldComponentType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkbox_group'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'file'
  | 'image'
  | 'lookup'
  | 'computed'
  | 'rich_text'
  | 'code'
  | 'color'
  | 'rating'
  | 'signature';

export type ComponentType = LayoutComponentType | FieldComponentType;

// UI configuration for layout components
export interface LayoutUIConfig {
  columns?: number;       // Grid columns (default 12)
  span?: number;          // Column span
  gap?: number;           // Spacing between children
  padding?: number;       // Internal padding
  margin?: number;        // External margin
  background?: string;    // Background color
  border?: boolean;       // Show border
  borderColor?: string;   // Border color
  borderRadius?: number;  // Border radius
  shadow?: boolean;       // Show shadow
  collapsible?: boolean;  // Can collapse (section/accordion)
  defaultExpanded?: boolean;
  minHeight?: number;     // Minimum height
  maxHeight?: number;     // Maximum height
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
}

// UI configuration for field components
export interface FieldUIConfig {
  width?: 'full' | 'half' | 'third' | 'quarter' | 'auto';
  labelPosition?: 'top' | 'left' | 'hidden';
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
}

// Tab definition for tabs component
export interface TabDefinition {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
}

// Validation rules
export interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  message?: string;
  custom?: string;  // Custom validation expression
}

// Cross-row validation rules for repeatable sections
export interface CrossRowValidation {
  type: 'sum' | 'count' | 'unique' | 'custom';
  field: string;          // Field key within the repeatable section
  operator?: '=' | '!=' | '<' | '<=' | '>' | '>=';
  value?: number | string;
  expression?: string;    // For custom type: JavaScript expression
  message: string;        // Error message to display
}

// Repeatable section configuration
export interface RepeatableSectionConfig {
  sectionKey: string;      // Key used in form data for the array
  minRows: number;         // Minimum number of rows required (default: 0)
  maxRows: number;         // Maximum number of rows allowed (0 = unlimited)
  crossRowValidation?: CrossRowValidation[];
}

// Data source configuration
export interface DataSourceConfig {
  type?: 'static' | 'lookup' | 'api';
  options?: { value: string; label: string }[];
  source?: {
    documentType?: string;
    valueField?: string;
    labelField?: string;
    distinct?: boolean;
    filter?: Record<string, unknown>;
  };
  api?: {
    url?: string;
    method?: 'GET' | 'POST';
    valueField?: string;
    labelField?: string;
  };
  filters?: {
    dependsOn?: string;
    operator?: string;
    valuePath?: string;
  }[];
  autoPopulate?: {
    targetField?: string;
    mapping?: Record<string, string>;
  };
}

// Component configuration (unified for both layout and field types)
export interface ComponentConfig {
  // Common
  label?: string;
  helpText?: string;
  hidden?: boolean;
  disabled?: boolean;
  className?: string;
  style?: Record<string, string | number>;

  // Layout-specific
  ui?: LayoutUIConfig | FieldUIConfig;
  tabs?: TabDefinition[];  // For tabs component

  // Repeatable section specific
  sectionKey?: string;     // Key used in form data for the array
  minRows?: number;        // Minimum number of rows required
  maxRows?: number;        // Maximum number of rows allowed (0 = unlimited)
  crossRowValidation?: CrossRowValidation[];

  // Field-specific
  required?: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  readOnly?: boolean;
  validation?: ValidationRules;
  data?: DataSourceConfig;

  // Computed field
  expression?: string;  // JavaScript expression for computed fields

  // File/Image field
  accept?: string;      // File types to accept
  maxSize?: number;     // Max file size in bytes
  multiple?: boolean;   // Allow multiple files

  // Slider field
  step?: number;
  marks?: { value: number; label: string }[];

  // Rating field
  maxRating?: number;
  precision?: number;
}

// Form Component (supports both layout and field types)
export interface FormComponent {
  id: string;
  formId: string;
  parentId: string | null;
  componentType: ComponentType;
  fieldKey: string;  // Only for field types
  config: ComponentConfig;
  order: number;
  isLayout: boolean;
  isField: boolean;
  children?: FormComponent[];  // Nested children for layout components
  createdAt: string;
  updatedAt: string;
}

// Legacy FormField interface for backwards compatibility
export interface FormField extends FormComponent {}

// FieldConfig alias for backwards compatibility
export interface FieldConfig extends ComponentConfig {}

// ============== Workflow Types ==============

export interface Workflow {
  id: string;
  documentTypeId: string;
  name: string;
  isDefault: boolean;
  states?: WorkflowState[];
  transitions?: WorkflowTransition[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStateConfig {
  ui?: { color?: string; x?: number; y?: number };
  permissions?: { allowEdit?: boolean };
}

export interface WorkflowState {
  id: string;
  workflowId: string;
  name: string;
  key: string;
  isInitial: boolean;
  isFinal: boolean;
  config: WorkflowStateConfig;
  createdAt: string;
  updatedAt: string;
}

export interface TransitionButton {
  key: string;
  label: string;
  variant: 'primary' | 'success' | 'warning' | 'error';
  requiresComment: boolean;
  onClick: { action: string; toState: string };
}

export interface WorkflowTransition {
  id: string;
  workflowId: string;
  fromStateId: string;
  toStateId: string;
  rules: Record<string, unknown>;
  buttons: TransitionButton[];
  createdAt: string;
  updatedAt: string;
}

// ============== Child Form Types ==============

export interface ChildFormVisibility {
  visibleInStates?: string[];
  conditions?: {
    field: string;
    operator: string;
    value: unknown;
  }[];
}

export interface ChildForm {
  id: string;
  parentDocumentTypeId: string;
  childDocumentTypeId: string;
  relationType: 'one_to_one' | 'one_to_many' | 'many_to_many';
  visibility: ChildFormVisibility;
  createdAt: string;
  updatedAt: string;
}

// ============== Document Types ==============

export interface Document {
  id: string;
  documentTypeId: string;
  parentDocumentId: string | null;
  data: Record<string, unknown>;
  stageKey: string;
  isSubmitted: boolean;
  workflowStateId: string | null;
  workflowState?: WorkflowState;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============== Dashboard Types ==============

export interface DashboardStats {
  applications: number;
  documentTypes: number;
  forms: number;
  workflows: number;
  documents: number;
  submittedDocuments: number;
  draftDocuments: number;
}

// ============== Component Type Definitions ==============

export const LAYOUT_TYPES: { value: LayoutComponentType; label: string; icon: string }[] = [
  { value: 'row', label: 'Row', icon: 'ViewColumn' },
  { value: 'column', label: 'Column', icon: 'ViewStream' },
  { value: 'container', label: 'Container', icon: 'Crop169' },
  { value: 'section', label: 'Section', icon: 'Segment' },
  { value: 'card', label: 'Card', icon: 'CreditCard' },
  { value: 'tabs', label: 'Tabs', icon: 'Tab' },
  { value: 'tab_panel', label: 'Tab Panel', icon: 'WebAsset' },
  { value: 'accordion', label: 'Accordion', icon: 'Expand' },
  { value: 'accordion_panel', label: 'Accordion Panel', icon: 'Article' },
  { value: 'divider', label: 'Divider', icon: 'HorizontalRule' },
  { value: 'spacer', label: 'Spacer', icon: 'SpaceBar' },
  { value: 'repeatable_section', label: 'Repeatable', icon: 'Repeat' },
];

export const FIELD_TYPES: { value: FieldComponentType; label: string; icon: string }[] = [
  { value: 'text', label: 'Text Input', icon: 'TextFields' },
  { value: 'textarea', label: 'Text Area', icon: 'Notes' },
  { value: 'number', label: 'Number', icon: 'Numbers' },
  { value: 'date', label: 'Date', icon: 'CalendarMonth' },
  { value: 'datetime', label: 'Date Time', icon: 'Schedule' },
  { value: 'time', label: 'Time', icon: 'AccessTime' },
  { value: 'select', label: 'Dropdown', icon: 'ArrowDropDownCircle' },
  { value: 'multiselect', label: 'Multi Select', icon: 'Checklist' },
  { value: 'checkbox', label: 'Checkbox', icon: 'CheckBox' },
  { value: 'checkbox_group', label: 'Checkbox Group', icon: 'ChecklistRtl' },
  { value: 'radio', label: 'Radio', icon: 'RadioButtonChecked' },
  { value: 'switch', label: 'Switch', icon: 'ToggleOn' },
  { value: 'slider', label: 'Slider', icon: 'LinearScale' },
  { value: 'file', label: 'File Upload', icon: 'AttachFile' },
  { value: 'image', label: 'Image Upload', icon: 'Image' },
  { value: 'lookup', label: 'Lookup', icon: 'Search' },
  { value: 'computed', label: 'Computed', icon: 'Functions' },
  { value: 'rich_text', label: 'Rich Text', icon: 'FormatColorText' },
  { value: 'code', label: 'Code Editor', icon: 'Code' },
  { value: 'color', label: 'Color Picker', icon: 'Palette' },
  { value: 'rating', label: 'Rating', icon: 'Star' },
  { value: 'signature', label: 'Signature', icon: 'Draw' },
];

// Helper to check if a component type is a layout type
export function isLayoutType(type: ComponentType): type is LayoutComponentType {
  return LAYOUT_TYPES.some(t => t.value === type);
}

// Helper to check if a component type is a field type
export function isFieldType(type: ComponentType): type is FieldComponentType {
  return FIELD_TYPES.some(t => t.value === type);
}

// Helper to get component type info
export function getComponentTypeInfo(type: ComponentType) {
  return [...LAYOUT_TYPES, ...FIELD_TYPES].find(t => t.value === type);
}
