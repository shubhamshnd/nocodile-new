import axios from 'axios';
import type {
  User,
  Application,
  DocumentType,
  Form,
  FormComponent,
  FormField,
  Workflow,
  WorkflowState,
  WorkflowTransition,
  ChildForm,
  Document,
  DashboardStats,
  ComponentType,
  ComponentConfig,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCsrfTokenFromCookie(): string {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

let csrfToken = '';

export async function fetchCsrfToken(): Promise<string> {
  const res = await api.get('/csrf/');
  csrfToken = res.data.csrfToken;
  return csrfToken;
}

export function getCsrfToken(): string {
  if (csrfToken) return csrfToken;
  return getCsrfTokenFromCookie();
}

export function resetCsrfToken(): void {
  csrfToken = '';
}

// Initialize CSRF token
fetchCsrfToken().catch(() => {});

api.interceptors.request.use((config) => {
  if (['post', 'put', 'delete', 'patch'].includes(config.method || '')) {
    const token = getCsrfToken();
    if (token) {
      config.headers['X-CSRFToken'] = token;
    }
  }
  return config;
});

// Auth
export const auth = {
  login: async (username: string, password: string): Promise<{ user: User }> => {
    // Ensure we have a CSRF token before login
    await fetchCsrfToken();
    const res = await api.post('/auth/login/', { username, password });
    // Refresh CSRF token after login (session changed)
    await fetchCsrfToken();
    return res.data;
  },
  logout: async (): Promise<void> => {
    await api.post('/auth/logout/');
    resetCsrfToken();
    await fetchCsrfToken();
  },
  getCurrentUser: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me/');
    return res.data;
  },
};

// Users
export interface UserData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isActive: boolean;
  isSuperuser: boolean;
  groups: { id: number; name: string }[];
  dateJoined?: string;
  lastLogin?: string;
}

export const users = {
  list: async (): Promise<UserData[]> => {
    const res = await api.get('/users/');
    return res.data;
  },
  get: async (id: string): Promise<UserData> => {
    const res = await api.get(`/users/${id}/`);
    return res.data;
  },
  create: async (data: {
    username: string;
    password: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isStaff?: boolean;
    isSuperuser?: boolean;
    groupIds?: number[];
  }): Promise<UserData> => {
    const res = await api.post('/users/', data);
    return res.data;
  },
  update: async (id: string, data: {
    username?: string;
    password?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    isStaff?: boolean;
    isActive?: boolean;
    isSuperuser?: boolean;
    groupIds?: number[];
  }): Promise<UserData> => {
    const res = await api.put(`/users/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}/`);
  },
};

// Roles
export interface RoleData {
  id: number;
  name: string;
  userCount: number;
  permissions: { id: number; name: string; codename: string }[];
}

export const roles = {
  list: async (): Promise<RoleData[]> => {
    const res = await api.get('/roles/');
    return res.data;
  },
  get: async (id: number): Promise<RoleData> => {
    const res = await api.get(`/roles/${id}/`);
    return res.data;
  },
  create: async (data: { name: string }): Promise<RoleData> => {
    const res = await api.post('/roles/', data);
    return res.data;
  },
  update: async (id: number, data: { name: string }): Promise<RoleData> => {
    const res = await api.put(`/roles/${id}/`, data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}/`);
  },
};

// Applications
export const applications = {
  list: async (): Promise<Application[]> => {
    const res = await api.get('/applications/');
    return res.data;
  },
  get: async (id: string): Promise<Application> => {
    const res = await api.get(`/applications/${id}/`);
    return res.data;
  },
  create: async (data: Partial<Application>): Promise<Application> => {
    const res = await api.post('/applications/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const res = await api.put(`/applications/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/applications/${id}/`);
  },
};

// Document Types
export const documentTypes = {
  list: async (applicationId?: string): Promise<DocumentType[]> => {
    const params = applicationId ? { applicationId } : {};
    const res = await api.get('/document-types/', { params });
    return res.data;
  },
  get: async (id: string): Promise<DocumentType> => {
    const res = await api.get(`/document-types/${id}/`);
    return res.data;
  },
  create: async (data: Partial<DocumentType>): Promise<DocumentType> => {
    const res = await api.post('/document-types/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<DocumentType>): Promise<DocumentType> => {
    const res = await api.put(`/document-types/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/document-types/${id}/`);
  },
};

// Forms
export const forms = {
  list: async (documentTypeId?: string): Promise<Form[]> => {
    const params = documentTypeId ? { documentTypeId } : {};
    const res = await api.get('/forms/', { params });
    return res.data;
  },
  get: async (id: string): Promise<Form> => {
    const res = await api.get(`/forms/${id}/`);
    return res.data;
  },
  create: async (data: Partial<Form>): Promise<Form> => {
    const res = await api.post('/forms/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Form>): Promise<Form> => {
    const res = await api.put(`/forms/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/forms/${id}/`);
  },
};

// Form Components (new hierarchical structure)
export interface CreateComponentData {
  formId: string;
  parentId?: string | null;
  componentType: ComponentType;
  fieldKey?: string;
  config?: ComponentConfig;
  order?: number;
}

export interface UpdateComponentData {
  componentType?: ComponentType;
  fieldKey?: string;
  config?: ComponentConfig;
  order?: number;
}

export interface MoveComponentData {
  parentId: string | null;
  order: number;
}

export interface ReorderComponentData {
  id: string;
  order: number;
  parentId?: string | null;
}

export const formComponents = {
  // Get component tree for a form (nested structure)
  getTree: async (formId: string): Promise<FormComponent[]> => {
    const res = await api.get('/form-components/', { params: { formId } });
    return res.data;
  },

  // Get flat list of all components
  listFlat: async (formId: string): Promise<FormComponent[]> => {
    const res = await api.get('/form-components/', { params: { formId, flat: 'true' } });
    return res.data;
  },

  // Get single component
  get: async (id: string, includeChildren = false): Promise<FormComponent> => {
    const params = includeChildren ? { includeChildren: 'true' } : {};
    const res = await api.get(`/form-components/${id}/`, { params });
    return res.data;
  },

  // Create component
  create: async (data: CreateComponentData): Promise<FormComponent> => {
    const res = await api.post('/form-components/', data);
    return res.data;
  },

  // Update component
  update: async (id: string, data: UpdateComponentData): Promise<FormComponent> => {
    const res = await api.put(`/form-components/${id}/`, data);
    return res.data;
  },

  // Delete component (cascades to children)
  delete: async (id: string): Promise<void> => {
    await api.delete(`/form-components/${id}/`);
  },

  // Move component to new parent/position
  move: async (id: string, data: MoveComponentData): Promise<FormComponent> => {
    const res = await api.post(`/form-components/${id}/move/`, data);
    return res.data;
  },

  // Duplicate component and children
  duplicate: async (id: string): Promise<FormComponent> => {
    const res = await api.post(`/form-components/${id}/duplicate/`);
    return res.data;
  },

  // Batch reorder components
  reorder: async (formId: string, componentOrders: ReorderComponentData[]): Promise<FormComponent[]> => {
    const res = await api.post(`/forms/${formId}/reorder-components/`, { componentOrders });
    return res.data;
  },
};

// Get available component types
export const getComponentTypes = async (): Promise<{
  layout: { type: string; label: string }[];
  fields: { type: string; label: string }[];
}> => {
  const res = await api.get('/component-types/');
  return res.data;
};

// Legacy Form Fields API (for backwards compatibility)
export const formFields = {
  list: async (formId?: string): Promise<FormField[]> => {
    const params = formId ? { formId, flat: 'true' } : {};
    const res = await api.get('/form-components/', { params });
    return res.data;
  },
  get: async (id: string): Promise<FormField> => {
    const res = await api.get(`/form-components/${id}/`);
    return res.data;
  },
  create: async (data: Partial<FormField>): Promise<FormField> => {
    const res = await api.post('/form-components/', {
      formId: data.formId,
      componentType: data.componentType || 'text',
      fieldKey: data.fieldKey,
      config: data.config,
      order: data.order,
    });
    return res.data;
  },
  update: async (id: string, data: Partial<FormField>): Promise<FormField> => {
    const res = await api.put(`/form-components/${id}/`, {
      componentType: data.componentType,
      fieldKey: data.fieldKey,
      config: data.config,
      order: data.order,
    });
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/form-components/${id}/`);
  },
  reorder: async (formId: string, fieldOrders: { id: string; order: number }[]): Promise<FormField[]> => {
    const res = await api.post(`/forms/${formId}/reorder-components/`, {
      componentOrders: fieldOrders.map(f => ({ id: f.id, order: f.order })),
    });
    return res.data;
  },
};

// Workflows
export const workflows = {
  list: async (documentTypeId?: string, includeDetails = false): Promise<Workflow[]> => {
    const params: Record<string, string> = {};
    if (documentTypeId) params.documentTypeId = documentTypeId;
    if (includeDetails) params.includeDetails = 'true';
    const res = await api.get('/workflows/', { params });
    return res.data;
  },
  get: async (id: string): Promise<Workflow> => {
    const res = await api.get(`/workflows/${id}/`);
    return res.data;
  },
  create: async (data: Partial<Workflow>): Promise<Workflow> => {
    const res = await api.post('/workflows/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Workflow>): Promise<Workflow> => {
    const res = await api.put(`/workflows/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflows/${id}/`);
  },
};

// Workflow States
export const workflowStates = {
  list: async (workflowId?: string): Promise<WorkflowState[]> => {
    const params = workflowId ? { workflowId } : {};
    const res = await api.get('/workflow-states/', { params });
    return res.data;
  },
  get: async (id: string): Promise<WorkflowState> => {
    const res = await api.get(`/workflow-states/${id}/`);
    return res.data;
  },
  create: async (data: Partial<WorkflowState>): Promise<WorkflowState> => {
    const res = await api.post('/workflow-states/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<WorkflowState>): Promise<WorkflowState> => {
    const res = await api.put(`/workflow-states/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflow-states/${id}/`);
  },
};

// Workflow Transitions
export const workflowTransitions = {
  list: async (workflowId?: string): Promise<WorkflowTransition[]> => {
    const params = workflowId ? { workflowId } : {};
    const res = await api.get('/workflow-transitions/', { params });
    return res.data;
  },
  get: async (id: string): Promise<WorkflowTransition> => {
    const res = await api.get(`/workflow-transitions/${id}/`);
    return res.data;
  },
  create: async (data: Partial<WorkflowTransition>): Promise<WorkflowTransition> => {
    const res = await api.post('/workflow-transitions/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<WorkflowTransition>): Promise<WorkflowTransition> => {
    const res = await api.put(`/workflow-transitions/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflow-transitions/${id}/`);
  },
};

// Workflow Graph (Visual Builder)
export interface WorkflowGraphNode {
  id: string;
  workflowId: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  linkedStateId?: string;
}

export interface WorkflowGraphConnection {
  id: string;
  workflowId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceOutput: string;
  targetInput: string;
  label?: string;
  conditionKey?: string;
  actionConfig?: {
    label: string;
    buttonColor: 'success' | 'error' | 'warning' | 'primary';
    requiresComment: boolean;
    icon?: string;
    order?: number;
  };
}

export interface WorkflowGraphData {
  workflowId: string;
  nodes: WorkflowGraphNode[];
  connections: WorkflowGraphConnection[];
}

export const workflowGraph = {
  get: async (workflowId: string): Promise<WorkflowGraphData> => {
    const res = await api.get(`/workflows/${workflowId}/graph/`);
    return res.data;
  },
  save: async (workflowId: string, graph: WorkflowGraphData): Promise<WorkflowGraphData> => {
    const res = await api.post(`/workflows/${workflowId}/graph/save/`, graph);
    return res.data;
  },
};

// Workflow Nodes (individual node CRUD)
export const workflowNodes = {
  list: async (workflowId: string): Promise<WorkflowGraphNode[]> => {
    const res = await api.get(`/workflows/${workflowId}/nodes/`);
    return res.data;
  },
  create: async (workflowId: string, data: Partial<WorkflowGraphNode>): Promise<WorkflowGraphNode> => {
    const res = await api.post(`/workflows/${workflowId}/nodes/`, data);
    return res.data;
  },
  get: async (id: string): Promise<WorkflowGraphNode> => {
    const res = await api.get(`/workflow-nodes/${id}/`);
    return res.data;
  },
  update: async (id: string, data: Partial<WorkflowGraphNode>): Promise<WorkflowGraphNode> => {
    const res = await api.put(`/workflow-nodes/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflow-nodes/${id}/`);
  },
};

// Workflow Connections
export const workflowConnections = {
  list: async (workflowId: string): Promise<WorkflowGraphConnection[]> => {
    const res = await api.get(`/workflows/${workflowId}/connections/`);
    return res.data;
  },
  create: async (workflowId: string, data: Partial<WorkflowGraphConnection>): Promise<WorkflowGraphConnection> => {
    const res = await api.post(`/workflows/${workflowId}/connections/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/workflow-connections/${id}/`);
  },
};

// Child Forms
export const childForms = {
  list: async (parentDocumentTypeId?: string): Promise<ChildForm[]> => {
    const params = parentDocumentTypeId ? { parentDocumentTypeId } : {};
    const res = await api.get('/child-forms/', { params });
    return res.data;
  },
  get: async (id: string): Promise<ChildForm> => {
    const res = await api.get(`/child-forms/${id}/`);
    return res.data;
  },
  create: async (data: Partial<ChildForm>): Promise<ChildForm> => {
    const res = await api.post('/child-forms/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<ChildForm>): Promise<ChildForm> => {
    const res = await api.put(`/child-forms/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/child-forms/${id}/`);
  },
};

// Documents
export const documents = {
  list: async (documentTypeId?: string, parentDocumentId?: string): Promise<Document[]> => {
    const params: Record<string, string> = {};
    if (documentTypeId) params.documentTypeId = documentTypeId;
    if (parentDocumentId) params.parentDocumentId = parentDocumentId;
    const res = await api.get('/documents/', { params });
    return res.data;
  },
  get: async (id: string, includeHistory = false): Promise<Document> => {
    const params = includeHistory ? { includeHistory: 'true' } : {};
    const res = await api.get(`/documents/${id}/`, { params });
    return res.data;
  },
  create: async (data: Partial<Document>): Promise<Document> => {
    const res = await api.post('/documents/', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Document>): Promise<Document> => {
    const res = await api.put(`/documents/${id}/`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}/`);
  },
  saveDraft: async (id: string, data: { data: Record<string, unknown>; stageKey: string }): Promise<Document> => {
    const res = await api.post(`/documents/${id}/save-draft/`, data);
    return res.data;
  },
  submit: async (id: string, data?: { data: Record<string, unknown> }): Promise<Document> => {
    const res = await api.post(`/documents/${id}/submit/`, data || {});
    return res.data;
  },
  transition: async (id: string, toStateId: string, comment?: string): Promise<Document> => {
    const res = await api.post(`/documents/${id}/transition/`, { toStateId, comment });
    return res.data;
  },
  getVisibleChildForms: async (id: string): Promise<ChildForm[]> => {
    const res = await api.get(`/documents/${id}/visible-child-forms/`);
    return res.data;
  },
};

// Dashboard
export const dashboard = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/dashboard/stats/');
    return res.data;
  },
};

export default api;
