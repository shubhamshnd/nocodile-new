# Workflow Builder Implementation Plan

## Overview

Build a visual, node-based workflow editor using **Rete.js v2** for the Nocodile no-code platform. This will allow users to configure approval flows, conditional routing, notifications, and permissions through drag-and-drop.

## Requirements Summary

Based on your inputs:
- **Approver Assignment**: Both role-based and user-based
- **Node Types**: Full set (Approval, Notification, Condition, Timer, Child Form Entry, View Permission, Email, Webhook, Fork/Join)
- **Conditional Logic**: Both field-based and user attribute conditions
- **Parallel Paths**: Yes, with AND/OR join logic

---

## Architecture

```
+---------------------------+        +------------------------+
|    WorkflowBuilder.tsx    |        |    Backend (Django)    |
|                           |        |                        |
|  +--------------------+   |        |  +------------------+  |
|  | Rete.js Editor     |   |  <-->  |  | WorkflowNode     |  |
|  | - Canvas           |   |        |  | WorkflowConnection|  |
|  | - Nodes            |   |        |  | (NEW MODELS)     |  |
|  | - Connections      |   |        |  +------------------+  |
|  +--------------------+   |        |                        |
|                           |        |  +------------------+  |
|  +--------------------+   |        |  | Workflow Engine  |  |
|  | Node Palette       |   |        |  | (Runtime)        |  |
|  +--------------------+   |        |  +------------------+  |
|                           |        |                        |
|  +--------------------+   |        |                        |
|  | Properties Panel   |   |        |                        |
|  +--------------------+   |        |                        |
+---------------------------+        +------------------------+
```

---

## Node Types

| Node | Purpose | Outputs |
|------|---------|---------|
| **Start** | Entry point when form submitted | 1 (next) |
| **End** | Terminal state (Approved, Rejected, etc.) | 0 |
| **Approval** | Request approval from users/roles | 2+ (approved, rejected, returned) |
| **Condition** | Branch based on field/user conditions | 2+ (branches) |
| **Notification** | Send email/in-app notification | 1 (next) |
| **Timer** | Wait for duration | 1 (next) |
| **Child Form Entry** | Configure who enters child form data | 1 (next) |
| **View Permission** | Set document visibility at this stage | 1 (next) |
| **Email** | Send custom email | 1 (next) |
| **Webhook** | Call external API | 2 (success, error) |
| **Fork** | Split into parallel paths | N (branches) |
| **Join** | Merge parallel paths (AND/OR) | 1 (next) |

---

## Implementation Phases

### Phase 1: Foundation
1. Install Rete.js packages (`rete`, `rete-react-plugin`, `rete-area-plugin`, `rete-connection-plugin`, etc.)
2. Create editor setup and React wrapper
3. Implement base node class with MUI styling
4. Build node palette (left sidebar)
5. Create properties panel structure (right sidebar)
6. Set up 3-column layout similar to FormBuilder

### Phase 2: Node Types
7. Implement Start and End nodes
8. Implement Approval node with:
   - Default approvers (role/user/manager/department/dynamic)
   - Per-user rules ("If X submits, Y approves")
   - Approval type (single/all/any)
   - Actions (approve/reject/return)
9. Implement Condition node with:
   - Field-based conditions (if amount > 10000)
   - User attribute conditions (if submitter.department == 'Sales')
   - Multiple branches with AND/OR logic
10. Implement Notification and Email nodes
11. Implement Timer node
12. Implement Fork/Join for parallel paths
13. Implement View Permission node
14. Implement Child Form Entry node
15. Implement Webhook node

### Phase 3: Backend
16. Create new Django models:
    - `WorkflowNode` (stores node type, position, config)
    - `WorkflowConnection` (stores connections between nodes)
    - `WorkflowExecution` (runtime execution state)
    - `ApprovalTask` (individual approval tasks)
17. Create API endpoints:
    - `GET/POST /api/workflows/:id/graph/` - Load/save entire graph
    - `CRUD /api/workflow-nodes/` - Node management
    - `CRUD /api/workflow-connections/` - Connection management
18. Build serialization (Rete.js graph <-> API format)

### Phase 4: Workflow Execution Engine
19. Build runtime engine that:
    - Starts workflow on document submit
    - Processes each node type
    - Creates approval tasks for users
    - Evaluates conditions
    - Handles parallel execution (fork/join)
    - Sends notifications/emails
    - Calls webhooks
20. Implement approval task handling
21. Add notification/email integration

### Phase 5: Polish & Integration
22. Add graph validation (start/end required, no cycles, etc.)
23. Implement auto-layout using elkjs
24. Add minimap for large workflows
25. Add context menu for quick actions
26. Update Workflows list page to link to builder
27. Add route `/workflows/:id/builder`

---

## File Structure

```
nocodile-frontend/src/
  pages/
    WorkflowBuilder.tsx              # Main builder page

  features/
    workflow-builder/
      editor/
        index.ts                     # Rete editor factory
        ReteEditor.tsx               # React wrapper
        useWorkflowEditor.ts         # Editor lifecycle hook

      nodes/
        index.ts                     # Export all nodes
        BaseNode.ts                  # Base class
        StartNode.ts
        EndNode.ts
        ApprovalNode.ts
        ConditionNode.ts
        NotificationNode.ts
        TimerNode.ts
        ChildFormEntryNode.ts
        ViewPermissionNode.ts
        EmailNode.ts
        WebhookNode.ts
        ForkNode.ts
        JoinNode.ts

      components/
        NodeWrapper.tsx              # Styled node container
        SocketComponent.tsx          # Connection points
        ConnectionComponent.tsx      # Line styling

      panels/
        PropertiesPanel.tsx          # Right sidebar
        ApprovalProperties.tsx       # Approval config UI
        ConditionProperties.tsx      # Condition builder UI
        ...

      palette/
        NodePalette.tsx              # Left sidebar

      utils/
        serialization.ts             # Graph <-> API
        validation.ts                # Graph validation

      types/
        index.ts                     # TypeScript interfaces
```

---

## Backend Models

```python
class WorkflowNode(models.Model):
    id = models.UUIDField(primary_key=True)
    workflow = models.ForeignKey(Workflow, on_delete=CASCADE)
    node_type = models.CharField(max_length=50)  # start, end, approval, etc.
    label = models.CharField(max_length=255)
    position_x = models.FloatField()
    position_y = models.FloatField()
    config = models.JSONField()  # Node-specific configuration

class WorkflowConnection(models.Model):
    id = models.UUIDField(primary_key=True)
    workflow = models.ForeignKey(Workflow, on_delete=CASCADE)
    source_node = models.ForeignKey(WorkflowNode, related_name='outgoing')
    target_node = models.ForeignKey(WorkflowNode, related_name='incoming')
    source_output = models.CharField(max_length=100)  # 'approved', 'rejected', etc.
    target_input = models.CharField(max_length=100)
    label = models.CharField(max_length=255, blank=True)

class WorkflowExecution(models.Model):
    id = models.UUIDField(primary_key=True)
    workflow = models.ForeignKey(Workflow, on_delete=CASCADE)
    document = models.ForeignKey(Document, on_delete=CASCADE)
    status = models.CharField()  # active, completed, cancelled
    current_nodes = models.ManyToManyField(WorkflowNode)  # For parallel execution
    context = models.JSONField()  # Runtime variables

class ApprovalTask(models.Model):
    id = models.UUIDField(primary_key=True)
    execution = models.ForeignKey(WorkflowExecution, on_delete=CASCADE)
    node = models.ForeignKey(WorkflowNode, on_delete=CASCADE)
    assigned_to = models.ForeignKey(User, on_delete=CASCADE)
    status = models.CharField()  # pending, approved, rejected
    comment = models.TextField(blank=True)
```

---

## Key Features Detail

### Approval Node Configuration
```typescript
{
  name: "Manager Approval",
  approvalType: "single" | "all" | "any",
  defaultApprovers: [
    { type: "role", roleId: "..." },
    { type: "user", userId: "..." },
    { type: "submitter_manager" },
    { type: "department", departmentKey: "HR" },
    { type: "dynamic", dynamicFieldKey: "approver_field" }
  ],
  userApprovalRules: [
    {
      submitterCondition: { type: "department", value: "Sales", operator: "==" },
      approvers: [{ type: "user", userId: "sales_manager_id" }]
    }
  ],
  actions: [
    { key: "approve", label: "Approve", variant: "success", targetConnection: "approved" },
    { key: "reject", label: "Reject", variant: "error", targetConnection: "rejected" }
  ]
}
```

### Condition Node Configuration
```typescript
{
  name: "Check Amount",
  conditionType: "field" | "user_attribute" | "expression",
  conditions: [
    {
      name: "High Value",
      rules: [
        { leftOperand: { type: "field", value: "amount" }, operator: ">", rightOperand: { type: "constant", value: 10000 } }
      ],
      logicalOperator: "AND",
      targetBranch: "high_value"
    }
  ],
  defaultBranch: "normal"
}
```

### View Permission Node Configuration
```typescript
{
  name: "Finance Review Visibility",
  permissions: [
    { type: "role", value: "finance_team", canView: true, canEdit: true },
    { type: "submitter", canView: true, canEdit: false },
    { type: "department", value: "HR", canView: true, canEdit: false, visibleFields: ["name", "amount"] }
  ]
}
```

### Child Form Entry Node Configuration
```typescript
{
  name: "Line Items Entry",
  childFormId: "...",
  entryPermissions: {
    allowedRoles: ["data_entry"],
    allowedUsers: [],
    allowSubmitter: true
  },
  required: true,
  minEntries: 1,
  maxEntries: 100
}
```

---

## Dependencies to Install

```bash
cd nocodile-frontend
npm install rete@^2.0.0 rete-react-plugin@^2.0.0 rete-area-plugin@^2.0.0 rete-connection-plugin@^2.0.0 rete-render-utils@^2.0.0 rete-auto-arrange-plugin@^2.0.0 rete-minimap-plugin@^2.0.0 rete-context-menu-plugin@^2.0.0 elkjs@^0.9.0
```

---

## Routes to Add

```typescript
// App.tsx
<Route path="/workflows/:workflowId/builder" element={<ProtectedRoute><WorkflowBuilder /></ProtectedRoute>} />
```

---

## API Endpoints to Add

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workflows/:id/graph/` | Get workflow graph (nodes + connections) |
| POST | `/api/workflows/:id/graph/save/` | Save entire graph |
| GET/POST | `/api/workflows/:id/nodes/` | List/create nodes |
| GET/PUT/DELETE | `/api/workflow-nodes/:id/` | Node CRUD |
| GET/POST | `/api/workflows/:id/connections/` | List/create connections |
| GET/DELETE | `/api/workflow-connections/:id/` | Connection operations |
| GET | `/api/approval-tasks/` | List pending approvals |
| POST | `/api/approval-tasks/:id/action/` | Take approval action |

---

## Estimated Effort

- **Phase 1 (Foundation)**: Core setup
- **Phase 2 (Node Types)**: All 12 node types with property panels
- **Phase 3 (Backend)**: Models, migrations, APIs
- **Phase 4 (Execution)**: Runtime workflow engine
- **Phase 5 (Polish)**: Validation, auto-layout, integration

This plan follows the same patterns established in FormBuilder.tsx for consistency.
