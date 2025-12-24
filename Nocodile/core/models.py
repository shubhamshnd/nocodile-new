"""
Nocodile Platform - All Models
JSONB-first schema for no-code platform
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Extended user model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        db_table = "users"


class Application(models.Model):
    """Applications container"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "applications"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class DocumentType(models.Model):
    """
    Document Types (Collections)
    settings JSONB: { "ui": { "icon": "file", "color": "#1976d2" }, "defaultWorkflow": "main_flow" }
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="document_types"
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "document_types"
        ordering = ["-created_at"]
        unique_together = ["application", "slug"]

    def __str__(self):
        return f"{self.application.name} - {self.name}"


class Form(models.Model):
    """
    Multi-Stage Forms
    stages JSONB: {
        "mode": "stepper",
        "allowPartialSave": true,
        "stages": [
            { "key": "basic", "title": "Basic Info", "order": 1, "fields": ["cargoType", "weight"] },
            { "key": "logistics", "title": "Logistics", "order": 2, "fields": ["destination", "deliveryDate"] }
        ]
    }
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="forms"
    )
    name = models.CharField(max_length=255)
    stages = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "forms"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type.name} - {self.name}"


class FormComponent(models.Model):
    """
    Form Components - Layout elements and Fields
    Supports hierarchical nesting for rows, columns, containers, tabs, sections, and fields.

    COMPONENT_TYPES:
    - Layout: row, column, container, section, tabs, tab_panel, card, accordion, accordion_panel
    - Fields: text, textarea, number, date, datetime, select, multiselect, checkbox, radio, file, lookup, computed

    config JSONB structure varies by component_type:

    For layout components:
    {
        "label": "Section Title",
        "ui": {
            "columns": 12,          # for row: total grid columns (default 12)
            "span": 6,              # for column: how many grid columns to span
            "gap": 2,               # spacing between children
            "padding": 2,           # internal padding
            "background": "#f5f5f5",
            "border": true,
            "borderRadius": 1,
            "collapsible": true,    # for accordion/section
            "defaultExpanded": true
        },
        "tabs": [                   # for tabs component
            { "key": "tab1", "label": "Tab 1" },
            { "key": "tab2", "label": "Tab 2" }
        ]
    }

    For repeatable_section:
    {
        "label": "Bollards",
        "sectionKey": "bollards",      # key used in form data for the array
        "minRows": 1,                  # minimum number of rows required
        "maxRows": 10,                 # maximum number of rows allowed (0 = unlimited)
        "ui": {
            "gap": 2,
            "padding": 2,
            "background": "#f9f9f9",
            "border": true,
            "borderRadius": 1
        },
        "crossRowValidation": [        # cross-row validation rules
            {
                "type": "sum",         # sum, count, unique, custom
                "field": "quantity",   # field key within repeatable section
                "operator": "<=",      # =, !=, <, <=, >, >=
                "value": 100,          # comparison value
                "message": "Total quantity must not exceed 100"
            },
            {
                "type": "unique",
                "field": "bollard_id",
                "message": "Bollard IDs must be unique"
            }
        ]
    }

    For field components:
    {
        "label": "Cargo Type",
        "required": false,
        "placeholder": "Enter value...",
        "helpText": "Helper text shown below field",
        "defaultValue": "",
        "ui": { "width": "full" },
        "validation": { "min": 0, "max": 100, "pattern": "", "message": "" },
        "data": {
            "options": [{ "value": "a", "label": "Option A" }],
            "source": { "documentType": "cargo_master", "valueField": "code", "labelField": "name" },
            "filters": [{ "dependsOn": "shipmentMode", "operator": "=", "valuePath": "mode" }],
            "autoPopulate": { "targetField": "hazardClass", "mapping": { "hazard": "hazardClass" } }
        }
    }
    """

    # Layout component types
    LAYOUT_TYPES = [
        ("row", "Row"),
        ("column", "Column"),
        ("container", "Container"),
        ("section", "Section"),
        ("card", "Card"),
        ("tabs", "Tabs"),
        ("tab_panel", "Tab Panel"),
        ("accordion", "Accordion"),
        ("accordion_panel", "Accordion Panel"),
        ("divider", "Divider"),
        ("spacer", "Spacer"),
        ("repeatable_section", "Repeatable Section"),
    ]

    # Field component types
    FIELD_TYPES = [
        ("text", "Text"),
        ("textarea", "Textarea"),
        ("number", "Number"),
        ("date", "Date"),
        ("datetime", "DateTime"),
        ("time", "Time"),
        ("select", "Select"),
        ("multiselect", "Multi Select"),
        ("checkbox", "Checkbox"),
        ("checkbox_group", "Checkbox Group"),
        ("radio", "Radio"),
        ("switch", "Switch"),
        ("slider", "Slider"),
        ("file", "File Upload"),
        ("image", "Image Upload"),
        ("lookup", "Lookup"),
        ("computed", "Computed"),
        ("rich_text", "Rich Text Editor"),
        ("code", "Code Editor"),
        ("color", "Color Picker"),
        ("rating", "Rating"),
        ("signature", "Signature"),
    ]

    COMPONENT_TYPES = LAYOUT_TYPES + FIELD_TYPES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    form = models.ForeignKey(
        Form,
        on_delete=models.CASCADE,
        related_name="components"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children"
    )
    component_type = models.CharField(max_length=50, choices=COMPONENT_TYPES)
    field_key = models.CharField(max_length=255, blank=True, default="")  # Only for field types
    config = models.JSONField(default=dict, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "form_components"
        ordering = ["order", "created_at"]

    def __str__(self):
        if self.field_key:
            return f"{self.form.name} - {self.field_key}"
        return f"{self.form.name} - {self.component_type}"

    @property
    def is_layout(self):
        """Check if this is a layout component"""
        return self.component_type in dict(self.LAYOUT_TYPES)

    @property
    def is_field(self):
        """Check if this is a field component"""
        return self.component_type in dict(self.FIELD_TYPES)


# Keep FormField as an alias for backwards compatibility
FormField = FormComponent


class Workflow(models.Model):
    """Workflows for document types"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="workflows"
    )
    name = models.CharField(max_length=255)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflows"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type.name} - {self.name}"


class WorkflowState(models.Model):
    """
    Workflow States
    config JSONB: {
        "ui": { "color": "orange", "x": 100, "y": 50 },
        "permissions": { "allowEdit": false }
    }
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="states"
    )
    name = models.CharField(max_length=255)
    key = models.SlugField(max_length=255)
    is_initial = models.BooleanField(default=False)
    is_final = models.BooleanField(default=False)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_states"
        ordering = ["created_at"]
        unique_together = ["workflow", "key"]

    def __str__(self):
        return f"{self.workflow.name} - {self.name}"


class WorkflowTransition(models.Model):
    """
    Workflow Transitions with Buttons
    rules JSONB: { "conditions": [...], "requiredFields": [...] }
    buttons JSONB: [
        {
            "key": "approve",
            "label": "Approve",
            "variant": "success",
            "requiresComment": false,
            "onClick": { "action": "transition", "toState": "APPROVED" }
        }
    ]
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="transitions"
    )
    from_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.CASCADE,
        related_name="outgoing_transitions"
    )
    to_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.CASCADE,
        related_name="incoming_transitions"
    )
    rules = models.JSONField(default=dict, blank=True)
    buttons = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_transitions"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.from_state.name} → {self.to_state.name}"


class ChildForm(models.Model):
    """
    Child / Related Forms
    visibility JSONB: {
        "visibleInStates": ["APPROVED"],
        "conditions": [{ "field": "cargoType", "operator": "=", "value": "CBRM" }]
    }
    """
    RELATION_TYPES = [
        ("one_to_one", "One to One"),
        ("one_to_many", "One to Many"),
        ("many_to_many", "Many to Many"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent_document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="child_forms"
    )
    child_document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="parent_forms"
    )
    relation_type = models.CharField(max_length=50, choices=RELATION_TYPES, default="one_to_many")
    visibility = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "child_forms"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.parent_document_type.name} → {self.child_document_type.name}"


class Document(models.Model):
    """
    Documents (Draft + Final)
    data JSONB: { "cargoType": "CBRM", "weight": 1200, "destination": "PORT_A" }
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_type = models.ForeignKey(
        DocumentType,
        on_delete=models.CASCADE,
        related_name="documents"
    )
    parent_document = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_documents"
    )
    data = models.JSONField(default=dict, blank=True)
    stage_key = models.CharField(max_length=255, blank=True, default="")
    is_submitted = models.BooleanField(default=False)
    workflow_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents"
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_documents"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "documents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document_type.name} - {self.id}"


class DocumentHistory(models.Model):
    """Track document changes and workflow transitions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name="history"
    )
    action = models.CharField(max_length=100)
    from_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+"
    )
    to_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+"
    )
    data_snapshot = models.JSONField(default=dict, blank=True)
    comment = models.TextField(blank=True, default="")
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "document_history"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.document} - {self.action}"


class WorkflowNode(models.Model):
    """
    Visual Workflow Node for drag-and-drop builder

    NODE_TYPES:
    - start: Entry point when form is submitted
    - end: Terminal state (Approved, Rejected, etc.)
    - approval: Request approval from users/roles
    - condition: Branch based on field/user conditions
    - notification: Send email/in-app notification
    - timer: Wait for specified duration
    - child_form_entry: Configure child form data entry
    - view_permission: Set document visibility at this stage
    - email: Send custom email
    - webhook: Call external API
    - fork: Split into parallel paths
    - join: Merge parallel paths (AND/OR)

    config JSONB stores node-specific configuration (see TypeScript interfaces)
    """

    NODE_TYPES = [
        ("start", "Start"),
        ("state", "State"),
        ("end", "End"),
        ("approval", "Approval"),
        ("condition", "Condition"),
        ("notification", "Notification"),
        ("timer", "Timer"),
        ("child_form_entry", "Child Form Entry"),
        ("view_permission", "View Permission"),
        ("email", "Email"),
        ("webhook", "Webhook"),
        ("fork", "Fork"),
        ("join", "Join"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="nodes"
    )
    node_type = models.CharField(max_length=50, choices=NODE_TYPES)
    label = models.CharField(max_length=255)
    position_x = models.FloatField(default=0)
    position_y = models.FloatField(default=0)
    config = models.JSONField(default=dict, blank=True)
    linked_state = models.ForeignKey(
        WorkflowState,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nodes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "workflow_nodes"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.workflow.name} - {self.label}"


class WorkflowConnection(models.Model):
    """
    Connections between workflow nodes

    action_config JSONB (for approval->state connections):
    {
        "label": "Approve",
        "buttonColor": "success",
        "requiresComment": false,
        "icon": "check",
        "order": 1
    }
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name="connections"
    )
    source_node = models.ForeignKey(
        WorkflowNode,
        on_delete=models.CASCADE,
        related_name="outgoing_connections"
    )
    target_node = models.ForeignKey(
        WorkflowNode,
        on_delete=models.CASCADE,
        related_name="incoming_connections"
    )
    source_output = models.CharField(max_length=100, default="output")
    target_input = models.CharField(max_length=100, default="input")
    label = models.CharField(max_length=255, blank=True, default="")
    condition_key = models.CharField(max_length=100, blank=True, default="")
    action_config = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "workflow_connections"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.source_node.label} -> {self.target_node.label}"


class DocumentStateHistory(models.Model):
    """
    Track document state transitions throughout workflow execution

    Stores complete history of all state changes with who made them,
    when, and which approval action was used.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "Document",
        on_delete=models.CASCADE,
        related_name="state_history"
    )
    from_state = models.CharField(max_length=255, blank=True, default="")
    to_state = models.CharField(max_length=255)
    transitioned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_transitions"
    )
    action_key = models.CharField(max_length=255, blank=True, default="")  # Which approval button was clicked
    action_label = models.CharField(max_length=255, blank=True, default="")  # Button label (e.g., "Approve", "Reject")
    comment = models.TextField(blank=True, default="")
    workflow_node = models.ForeignKey(
        WorkflowNode,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="state_transitions"
    )
    metadata = models.JSONField(default=dict, blank=True)  # Additional context
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "document_state_history"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["document", "-created_at"]),
            models.Index(fields=["transitioned_by", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.document} | {self.from_state} → {self.to_state}"


class ApprovalTask(models.Model):
    """
    Pending approval tasks for documents in workflow

    Stores who needs to approve, what actions are available,
    and tracks completion status.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
        ("expired", "Expired"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(
        "Document",
        on_delete=models.CASCADE,
        related_name="approval_tasks"
    )
    workflow_node = models.ForeignKey(
        WorkflowNode,
        on_delete=models.CASCADE,
        related_name="approval_tasks"
    )
    assigned_to_users = models.ManyToManyField(
        User,
        related_name="assigned_approval_tasks",
        blank=True
    )
    assigned_to_roles = models.ManyToManyField(
        "auth.Group",
        related_name="assigned_approval_tasks",
        blank=True
    )
    # Available actions are auto-generated from outgoing connections
    available_actions = models.JSONField(default=list, blank=True)
    # Example: [
    #     {"key": "approve", "label": "Approve", "targetState": "approved", "requiresComment": false},
    #     {"key": "reject", "label": "Reject", "targetState": "rejected", "requiresComment": true}
    # ]
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="pending")
    completed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="completed_approval_tasks"
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    action_taken = models.CharField(max_length=255, blank=True, default="")
    comment = models.TextField(blank=True, default="")
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "approval_tasks"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["document", "status", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return f"{self.document} - {self.workflow_node.label} ({self.status})"
