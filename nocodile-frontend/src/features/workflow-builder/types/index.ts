// Workflow Builder Type Definitions

// Node types enumeration
export type WorkflowNodeType =
  | 'start'
  | 'state'
  | 'end'
  | 'approval'
  | 'condition'
  | 'notification'
  | 'timer'
  | 'child_form_entry'
  | 'view_permission'
  | 'email'
  | 'webhook'
  | 'fork'
  | 'join';

// Base node configuration interface
export interface BaseNodeConfig {
  id: string;
  type: WorkflowNodeType;
  label: string;
  position: { x: number; y: number };
}

// Approver configuration
export interface ApproverConfig {
  type: 'role' | 'user' | 'dynamic' | 'submitter_manager' | 'department';
  roleId?: string;
  userId?: string;
  userIds?: string[];
  departmentKey?: string;
  dynamicFieldKey?: string;
}

// Per-user approval rules
export interface UserApprovalRule {
  id: string;
  submitterCondition: {
    type: 'user' | 'role' | 'department' | 'attribute';
    value: string;
    operator?: '==' | '!=' | 'in' | 'contains';
  };
  approvers: ApproverConfig[];
}

// Approval action button
export interface ApprovalAction {
  key: string;
  label: string;
  variant: 'success' | 'warning' | 'error' | 'primary';
  targetConnection: string;
  requiresComment: boolean;
  transitionId?: string; // Optional state transition to trigger
}

// Approval node configuration
export interface ApprovalNodeData {
  name: string;
  description?: string;
  defaultApprovers: ApproverConfig[];
  userApprovalRules: UserApprovalRule[];
  approvalType: 'single' | 'all' | 'any';
  timeoutDays?: number;
  escalationConfig?: {
    enabled: boolean;
    afterDays: number;
    escalateTo: ApproverConfig;
  };
  allowReassign: boolean;
  requiresComment: boolean;
  actions: ApprovalAction[];
}

// Condition expression
export interface ConditionExpression {
  leftOperand: {
    type: 'field' | 'user_attribute' | 'constant';
    value: string;
  };
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in' | 'startsWith' | 'endsWith';
  rightOperand: {
    type: 'field' | 'user_attribute' | 'constant';
    value: string | number | boolean | string[];
  };
}

// Condition rule (branch)
export interface ConditionRule {
  id: string;
  name: string;
  rules: ConditionExpression[];
  logicalOperator: 'AND' | 'OR';
  targetBranch: string;
}

// Condition node configuration
export interface ConditionNodeData {
  name: string;
  conditionType: 'field' | 'user_attribute' | 'expression';
  conditions: ConditionRule[];
  defaultBranch: string;
}

// End node configuration
export interface EndNodeData {
  name: string;
  stateKey: string;
  isFinal: boolean;
  notifySubmitter: boolean;
  notificationTemplate?: string;
}

// Recipient configuration
export interface RecipientConfig {
  type: 'submitter' | 'approver' | 'role' | 'user' | 'dynamic';
  roleId?: string;
  userId?: string;
  dynamicFieldKey?: string;
}

// Notification node configuration
export interface NotificationNodeData {
  name: string;
  notificationType: 'email' | 'in_app' | 'both';
  recipients: RecipientConfig[];
  template: {
    subject: string;
    body: string;
  };
}

// Timer node configuration
export interface TimerNodeData {
  name: string;
  delayType: 'fixed' | 'field_based' | 'business_days';
  delayValue?: number;
  delayUnit?: 'minutes' | 'hours' | 'days';
  fieldKey?: string;
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
}

// Child form entry node configuration
export interface ChildFormEntryNodeData {
  name: string;
  childFormId: string;
  entryPermissions: {
    allowedRoles: string[];
    allowedUsers: string[];
    allowSubmitter: boolean;
  };
  required: boolean;
  minEntries?: number;
  maxEntries?: number;
}

// View permission
export interface ViewPermission {
  type: 'role' | 'user' | 'department' | 'submitter' | 'approver';
  value?: string;
  canView: boolean;
  canEdit: boolean;
  visibleFields?: string[];
  editableFields?: string[];
}

// View permission node configuration
export interface ViewPermissionNodeData {
  name: string;
  permissions: ViewPermission[];
}

// Email node configuration
export interface EmailNodeData {
  name: string;
  recipients: RecipientConfig[];
  ccRecipients?: RecipientConfig[];
  bccRecipients?: RecipientConfig[];
  template: {
    subject: string;
    body: string;
    isHtml: boolean;
  };
  attachDocument: boolean;
  attachmentFields?: string[];
}

// Webhook node configuration
export interface WebhookNodeData {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers: { key: string; value: string }[];
  payload: {
    type: 'full_document' | 'selected_fields' | 'custom';
    selectedFields?: string[];
    customPayload?: string;
  };
  authentication?: {
    type: 'none' | 'bearer' | 'basic' | 'api_key';
    credentials?: string;
  };
  onSuccess: 'continue' | 'branch';
  onError: 'fail' | 'continue' | 'retry';
  retryConfig?: {
    maxRetries: number;
    retryDelaySeconds: number;
  };
}

// Fork node configuration
export interface ForkNodeData {
  name: string;
  branches: {
    id: string;
    name: string;
  }[];
}

// Join node configuration
export interface JoinNodeData {
  name: string;
  joinType: 'all' | 'any';
  expectedBranches: string[];
  timeout?: {
    enabled: boolean;
    days: number;
    action: 'continue' | 'escalate' | 'cancel';
  };
}

// Start node configuration
export interface StartNodeData {
  name: string;
  triggerType: 'form_submit' | 'api_call' | 'scheduled';
  autoAssignFirstApprover: boolean;
}

// State permissions configuration
export interface StatePermissions {
  // Who can view documents in this state
  view?: {
    roles?: string[];
    users?: string[];
    includeSubmitter?: boolean;
    includeApprovers?: boolean;
  };
  // Main form editing permissions
  editMainForm?: boolean;
  editMainFormRoles?: string[];
  editMainFormUsers?: string[];
  // Child forms editing permissions
  editChildForms?: boolean;
  editChildFormsRoles?: string[];
  editChildFormsUsers?: string[];
  specificChildForms?: string[]; // IDs of specific child forms that can be edited
  // Approval level restriction
  approvalLevel?: string; // e.g., 'user_level', 'unit_head_level', 'hr_level'
}

// State node configuration
export interface StateNodeData {
  name: string;
  stateKey: string;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
  allowEdit: boolean; // Deprecated - use permissions.editMainForm instead
  permissions?: StatePermissions;
}

// Union type for all node data
export type WorkflowNodeData =
  | { type: 'start'; config: StartNodeData }
  | { type: 'state'; config: StateNodeData }
  | { type: 'end'; config: EndNodeData }
  | { type: 'approval'; config: ApprovalNodeData }
  | { type: 'condition'; config: ConditionNodeData }
  | { type: 'notification'; config: NotificationNodeData }
  | { type: 'timer'; config: TimerNodeData }
  | { type: 'child_form_entry'; config: ChildFormEntryNodeData }
  | { type: 'view_permission'; config: ViewPermissionNodeData }
  | { type: 'email'; config: EmailNodeData }
  | { type: 'webhook'; config: WebhookNodeData }
  | { type: 'fork'; config: ForkNodeData }
  | { type: 'join'; config: JoinNodeData };

// Serialized node for API
export interface SerializedNode {
  id: string;
  workflowId: string;
  type: WorkflowNodeType;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  linkedStateId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Action configuration for approval->state connections
export interface ActionConfig {
  label: string; // Button text (e.g., "Approve", "Reject", "Send Back")
  buttonColor: 'success' | 'error' | 'warning' | 'primary';
  requiresComment: boolean;
  icon?: string;
  order?: number; // Display order of buttons (1, 2, 3...)
}

// Connection between nodes
export interface WorkflowConnection {
  id: string;
  workflowId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
  label?: string;
  conditionKey?: string;
  // Action configuration for approval->state connections
  actionConfig?: ActionConfig;
}

// Complete workflow graph
export interface WorkflowGraph {
  workflowId: string;
  nodes: SerializedNode[];
  connections: WorkflowConnection[];
}

// Node type metadata for palette
export interface NodeTypeInfo {
  type: WorkflowNodeType;
  label: string;
  description: string;
  color: string;
  icon: string;
  inputs: number | 'dynamic';
  outputs: number | 'dynamic';
}

// Preset state configurations for common workflow states
export interface StatePreset {
  key: string;
  name: string;
  stateKey: string;
  color: string;
  isInitial: boolean;
  isFinal: boolean;
  icon: string;
  description: string;
  defaultPermissions: StatePermissions;
}

export const STATE_PRESETS: StatePreset[] = [
  {
    key: 'draft',
    name: 'Draft',
    stateKey: 'DRAFT',
    color: '#9e9e9e',
    isInitial: true,
    isFinal: false,
    icon: 'Edit',
    description: 'Initial state - document can be edited by submitter',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: false },
      editMainForm: true,
      editChildForms: true,
    },
  },
  {
    key: 'pending',
    name: 'Pending Approval',
    stateKey: 'PENDING',
    color: '#ff9800',
    isInitial: false,
    isFinal: false,
    icon: 'HourglassEmpty',
    description: 'Waiting for approval - read-only for submitter',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: false,
      editChildForms: false,
    },
  },
  {
    key: 'approved',
    name: 'Approved',
    stateKey: 'APPROVED',
    color: '#4caf50',
    isInitial: false,
    isFinal: false,
    icon: 'CheckCircle',
    description: 'Document has been approved',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: false,
      editChildForms: false,
    },
  },
  {
    key: 'rejected',
    name: 'Rejected',
    stateKey: 'REJECTED',
    color: '#f44336',
    isInitial: false,
    isFinal: true,
    icon: 'Cancel',
    description: 'Document has been rejected (final state)',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: false,
      editChildForms: false,
    },
  },
  {
    key: 'sent_back',
    name: 'Sent Back',
    stateKey: 'SENT_BACK',
    color: '#ff5722',
    isInitial: false,
    isFinal: false,
    icon: 'Undo',
    description: 'Returned for changes - submitter can edit',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: true,
      editChildForms: true,
    },
  },
  {
    key: 'completed',
    name: 'Completed',
    stateKey: 'COMPLETED',
    color: '#2196f3',
    isInitial: false,
    isFinal: true,
    icon: 'Done',
    description: 'Workflow completed (final state)',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: false,
      editChildForms: false,
    },
  },
  {
    key: 'custom',
    name: 'Custom State',
    stateKey: '',
    color: '#673ab7',
    isInitial: false,
    isFinal: false,
    icon: 'FiberManualRecord',
    description: 'Create a custom state with your own settings',
    defaultPermissions: {
      view: { includeSubmitter: true, includeApprovers: true },
      editMainForm: false,
      editChildForms: false,
    },
  },
];

// Node type metadata
export const NODE_TYPE_INFO: Record<WorkflowNodeType, NodeTypeInfo> = {
  start: {
    type: 'start',
    label: 'Start',
    description: 'Entry point when form is submitted (deprecated - use Draft state)',
    color: '#4caf50',
    icon: 'PlayArrow',
    inputs: 0,
    outputs: 1,
  },
  state: {
    type: 'state',
    label: 'State',
    description: 'Document state with access control',
    color: '#673ab7',
    icon: 'FiberManualRecord',
    inputs: 'dynamic',
    outputs: 'dynamic',
  },
  end: {
    type: 'end',
    label: 'End',
    description: 'Terminal state (deprecated - use final state)',
    color: '#f44336',
    icon: 'Stop',
    inputs: 1,
    outputs: 0,
  },
  approval: {
    type: 'approval',
    label: 'Approval',
    description: 'Request approval from users/roles',
    color: '#2196f3',
    icon: 'HowToVote',
    inputs: 1,
    outputs: 'dynamic',
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on field/user conditions',
    color: '#ff9800',
    icon: 'CallSplit',
    inputs: 1,
    outputs: 'dynamic',
  },
  notification: {
    type: 'notification',
    label: 'Notification',
    description: 'Send email/in-app notification',
    color: '#9c27b0',
    icon: 'Notifications',
    inputs: 1,
    outputs: 1,
  },
  timer: {
    type: 'timer',
    label: 'Timer',
    description: 'Wait for specified duration',
    color: '#795548',
    icon: 'Timer',
    inputs: 1,
    outputs: 1,
  },
  child_form_entry: {
    type: 'child_form_entry',
    label: 'Child Form',
    description: 'Configure child form data entry',
    color: '#607d8b',
    icon: 'Description',
    inputs: 1,
    outputs: 1,
  },
  view_permission: {
    type: 'view_permission',
    label: 'View Permission',
    description: 'Set document visibility at this stage',
    color: '#009688',
    icon: 'Visibility',
    inputs: 1,
    outputs: 1,
  },
  email: {
    type: 'email',
    label: 'Email',
    description: 'Send custom email',
    color: '#e91e63',
    icon: 'Email',
    inputs: 1,
    outputs: 1,
  },
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Call external API',
    color: '#3f51b5',
    icon: 'Webhook',
    inputs: 1,
    outputs: 2,
  },
  fork: {
    type: 'fork',
    label: 'Fork',
    description: 'Split into parallel paths',
    color: '#00bcd4',
    icon: 'CallSplit',
    inputs: 1,
    outputs: 'dynamic',
  },
  join: {
    type: 'join',
    label: 'Join',
    description: 'Merge parallel paths (AND/OR)',
    color: '#00bcd4',
    icon: 'CallMerge',
    inputs: 'dynamic',
    outputs: 1,
  },
};

// Default configurations for new nodes
export function getDefaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case 'start':
      return {
        name: 'Start',
        triggerType: 'form_submit',
        autoAssignFirstApprover: false,
      };
    case 'state':
      return {
        name: 'New State',
        stateKey: '',
        isInitial: false,
        isFinal: false,
        color: '#673ab7',
        allowEdit: true,
        permissions: {
          view: {
            includeSubmitter: true,
            includeApprovers: true,
          },
          editMainForm: true,
          editChildForms: true,
        },
      };
    case 'end':
      return {
        name: 'End',
        stateKey: 'COMPLETED',
        isFinal: true,
        notifySubmitter: true,
      };
    case 'approval':
      return {
        name: 'Approval',
        description: '',
        defaultApprovers: [],
        userApprovalRules: [],
        approvalType: 'single',
        allowReassign: true,
        requiresComment: false,
        actions: [
          { key: 'approve', label: 'Approve', variant: 'success', targetConnection: 'approved', requiresComment: false },
          { key: 'reject', label: 'Reject', variant: 'error', targetConnection: 'rejected', requiresComment: true },
        ],
      };
    case 'condition':
      return {
        name: 'Condition',
        conditionType: 'field',
        conditions: [],
        defaultBranch: 'else',
      };
    case 'notification':
      return {
        name: 'Notification',
        notificationType: 'both',
        recipients: [{ type: 'submitter' }],
        template: { subject: '', body: '' },
      };
    case 'timer':
      return {
        name: 'Timer',
        delayType: 'fixed',
        delayValue: 1,
        delayUnit: 'days',
      };
    case 'child_form_entry':
      return {
        name: 'Child Form Entry',
        childFormId: '',
        entryPermissions: { allowedRoles: [], allowedUsers: [], allowSubmitter: true },
        required: false,
      };
    case 'view_permission':
      return {
        name: 'View Permission',
        permissions: [],
      };
    case 'email':
      return {
        name: 'Email',
        recipients: [],
        template: { subject: '', body: '', isHtml: false },
        attachDocument: false,
      };
    case 'webhook':
      return {
        name: 'Webhook',
        url: '',
        method: 'POST',
        headers: [],
        payload: { type: 'full_document' },
        onSuccess: 'continue',
        onError: 'fail',
      };
    case 'fork':
      return {
        name: 'Fork',
        branches: [
          { id: 'branch_1', name: 'Branch 1' },
          { id: 'branch_2', name: 'Branch 2' },
        ],
      };
    case 'join':
      return {
        name: 'Join',
        joinType: 'all',
        expectedBranches: [],
      };
    default:
      return { name: type };
  }
}
