"""
Workflow Execution Engine

Handles workflow execution, approval tasks, state transitions, and action processing.
"""
from typing import List, Dict, Optional, Any
from django.db import transaction
from django.utils import timezone
from django.contrib.auth.models import User, Group
from .models import (
    Document,
    WorkflowNode,
    WorkflowConnection,
    ApprovalTask,
    DocumentStateHistory,
)


class WorkflowEngine:
    """
    Core workflow execution engine

    Responsibilities:
    - Create approval tasks when document reaches approval node
    - Auto-generate approval buttons from workflow connections
    - Process approval actions and trigger state transitions
    - Track complete state history for audit trail
    """

    @staticmethod
    def get_available_actions(approval_node: WorkflowNode) -> List[Dict[str, Any]]:
        """
        Get available approval actions from outgoing connections.

        Each connection from approval → state node becomes one approval button.

        Args:
            approval_node: The approval node to get actions for

        Returns:
            List of action configurations:
            [
                {
                    "connectionId": "uuid",
                    "key": "approve",
                    "label": "Approve",
                    "buttonColor": "success",
                    "requiresComment": false,
                    "order": 1,
                    "targetNodeId": "state_node_uuid",
                    "targetState": "UH_APPROVED"
                },
                ...
            ]
        """
        outgoing_connections = WorkflowConnection.objects.filter(
            source_node=approval_node
        ).select_related('target_node')

        actions = []
        for conn in outgoing_connections:
            # Only create actions for connections to state nodes
            if conn.target_node.node_type != 'state':
                continue

            # Get action config from connection, or use defaults
            action_config = conn.action_config or {}

            # Get target state from the state node's config
            target_state_config = conn.target_node.config or {}
            target_state_key = target_state_config.get('stateKey', '')

            action = {
                'connectionId': str(conn.id),
                'key': action_config.get('label', 'Action').lower().replace(' ', '_'),
                'label': action_config.get('label', 'Action'),
                'buttonColor': action_config.get('buttonColor', 'primary'),
                'requiresComment': action_config.get('requiresComment', False),
                'order': action_config.get('order', 1),
                'icon': action_config.get('icon', ''),
                'targetNodeId': str(conn.target_node.id),
                'targetState': target_state_key,
            }
            actions.append(action)

        # Sort by order
        actions.sort(key=lambda x: x['order'])

        return actions

    @staticmethod
    def get_approvers(approval_node: WorkflowNode, document: Document) -> Dict[str, Any]:
        """
        Determine who should approve based on approval node configuration.

        Args:
            approval_node: The approval node
            document: The document being approved

        Returns:
            {
                'users': [User objects],
                'roles': [Group objects]
            }
        """
        config = approval_node.config or {}

        users = []
        roles = []

        # Get default approvers
        default_approvers = config.get('defaultApprovers', [])

        for approver_config in default_approvers:
            approver_type = approver_config.get('type')

            if approver_type == 'user':
                user_id = approver_config.get('userId')
                if user_id:
                    try:
                        user = User.objects.get(id=user_id)
                        users.append(user)
                    except User.DoesNotExist:
                        pass

            elif approver_type == 'role':
                role_id = approver_config.get('roleId')
                if role_id:
                    try:
                        role = Group.objects.get(id=role_id)
                        roles.append(role)
                    except Group.DoesNotExist:
                        pass

            elif approver_type == 'submitter_manager':
                # Get the submitter's manager (if User model has manager field)
                if hasattr(document.submitted_by, 'manager') and document.submitted_by.manager:
                    users.append(document.submitted_by.manager)

        # TODO: Implement user approval rules (per-user routing)
        # user_approval_rules = config.get('userApprovalRules', [])
        # For now, just use default approvers

        return {
            'users': users,
            'roles': roles,
        }

    @staticmethod
    @transaction.atomic
    def create_approval_task(
        document: Document,
        approval_node: WorkflowNode,
        timeout_days: Optional[int] = None
    ) -> ApprovalTask:
        """
        Create an approval task when document reaches an approval node.

        Args:
            document: The document to create approval for
            approval_node: The approval node that triggered this task
            timeout_days: Optional timeout in days

        Returns:
            Created ApprovalTask instance
        """
        # Get available actions from outgoing connections
        available_actions = WorkflowEngine.get_available_actions(approval_node)

        if not available_actions:
            raise ValueError(
                f"Approval node '{approval_node.label}' has no outgoing connections to state nodes. "
                "Cannot create approval buttons."
            )

        # Get approvers
        approvers = WorkflowEngine.get_approvers(approval_node, document)

        # Calculate due date
        due_date = None
        if timeout_days:
            due_date = timezone.now() + timezone.timedelta(days=timeout_days)
        elif approval_node.config:
            timeout = approval_node.config.get('timeoutDays')
            if timeout:
                due_date = timezone.now() + timezone.timedelta(days=timeout)

        # Create approval task
        approval_task = ApprovalTask.objects.create(
            document=document,
            workflow_node=approval_node,
            available_actions=available_actions,
            status='pending',
            due_date=due_date,
        )

        # Assign to users and roles
        if approvers['users']:
            approval_task.assigned_to_users.set(approvers['users'])
        if approvers['roles']:
            approval_task.assigned_to_roles.set(approvers['roles'])

        return approval_task

    @staticmethod
    @transaction.atomic
    def transition_to_state(
        document: Document,
        target_node: WorkflowNode,
        transitioned_by: User,
        action_key: str = '',
        action_label: str = '',
        comment: str = '',
        metadata: Optional[Dict[str, Any]] = None
    ) -> DocumentStateHistory:
        """
        Transition document to a new state and record history.

        Args:
            document: The document to transition
            target_node: The target state node
            transitioned_by: User who triggered the transition
            action_key: The action key (e.g., 'approve', 'reject')
            action_label: The action label (e.g., 'Approve', 'Reject')
            comment: Optional comment from approver
            metadata: Optional additional metadata

        Returns:
            Created DocumentStateHistory instance
        """
        # Get current state
        from_state = document.current_state or ''

        # Get target state from node config
        target_state_config = target_node.config or {}
        to_state = target_state_config.get('stateKey', target_node.label)

        # Update document state
        document.current_state = to_state
        document.save(update_fields=['current_state'])

        # Create state history record
        history = DocumentStateHistory.objects.create(
            document=document,
            from_state=from_state,
            to_state=to_state,
            transitioned_by=transitioned_by,
            action_key=action_key,
            action_label=action_label,
            comment=comment,
            workflow_node=target_node,
            metadata=metadata or {},
        )

        return history

    @staticmethod
    @transaction.atomic
    def execute_approval_action(
        approval_task: ApprovalTask,
        action_key: str,
        user: User,
        comment: str = ''
    ) -> DocumentStateHistory:
        """
        Execute an approval action and transition the document.

        Args:
            approval_task: The approval task being acted upon
            action_key: The action key (matches connection's action config key)
            user: User executing the action
            comment: Optional comment

        Returns:
            Created DocumentStateHistory instance

        Raises:
            ValueError: If action not found or task already completed
        """
        # Validate task is still pending
        if approval_task.status != 'pending':
            raise ValueError(f"Approval task is already {approval_task.status}")

        # Find the action in available_actions
        action = None
        for available_action in approval_task.available_actions:
            if available_action['key'] == action_key:
                action = available_action
                break

        if not action:
            raise ValueError(f"Action '{action_key}' not found in available actions")

        # Validate comment requirement
        if action.get('requiresComment') and not comment:
            raise ValueError(f"Action '{action['label']}' requires a comment")

        # Get target state node
        try:
            target_node = WorkflowNode.objects.get(id=action['targetNodeId'])
        except WorkflowNode.DoesNotExist:
            raise ValueError(f"Target node not found: {action['targetNodeId']}")

        # Transition document to target state
        history = WorkflowEngine.transition_to_state(
            document=approval_task.document,
            target_node=target_node,
            transitioned_by=user,
            action_key=action_key,
            action_label=action['label'],
            comment=comment,
            metadata={
                'approval_task_id': str(approval_task.id),
                'approval_node_id': str(approval_task.workflow_node.id),
                'button_color': action.get('buttonColor'),
            }
        )

        # Mark approval task as completed
        approval_task.status = 'completed'
        approval_task.completed_by = user
        approval_task.completed_at = timezone.now()
        approval_task.action_taken = action_key
        approval_task.comment = comment
        approval_task.save()

        # Cancel any other pending approval tasks for this document at the same node
        ApprovalTask.objects.filter(
            document=approval_task.document,
            workflow_node=approval_task.workflow_node,
            status='pending'
        ).exclude(id=approval_task.id).update(
            status='cancelled'
        )

        # TODO: Check if we need to create next approval task
        # This would involve:
        # 1. Check if target_node has outgoing connections to other approval nodes
        # 2. If yes, create approval task for that node
        # For now, this will be handled by document submission flow

        return history

    @staticmethod
    def get_user_pending_approvals(
        user: User,
        document_type_id: Optional[str] = None
    ) -> List[ApprovalTask]:
        """
        Get all pending approval tasks assigned to a user.

        Args:
            user: The user to get approvals for
            document_type_id: Optional filter by document type

        Returns:
            List of pending ApprovalTask instances
        """
        # Get tasks assigned directly to user
        tasks_by_user = ApprovalTask.objects.filter(
            assigned_to_users=user,
            status='pending'
        )

        # Get tasks assigned to user's roles
        user_roles = user.groups.all()
        tasks_by_role = ApprovalTask.objects.filter(
            assigned_to_roles__in=user_roles,
            status='pending'
        )

        # Combine and deduplicate
        all_tasks = (tasks_by_user | tasks_by_role).distinct()

        # Filter by document type if specified
        if document_type_id:
            all_tasks = all_tasks.filter(
                document__document_type_id=document_type_id
            )

        # Prefetch related objects for efficiency
        all_tasks = all_tasks.select_related(
            'document',
            'document__document_type',
            'document__submitted_by',
            'workflow_node'
        ).prefetch_related(
            'assigned_to_users',
            'assigned_to_roles'
        ).order_by('-created_at')

        return list(all_tasks)

    @staticmethod
    def check_state_permissions(
        document: Document,
        user: User,
        permission_type: str  # 'view', 'edit_main_form', 'edit_child_forms'
    ) -> bool:
        """
        Check if user has specific permission for document in its current state.

        Args:
            document: The document to check
            user: The user requesting access
            permission_type: Type of permission to check

        Returns:
            True if user has permission, False otherwise
        """
        # Get current state node
        try:
            # Find the state node that matches document's current state
            workflow = document.document_type.workflows.filter(is_active=True).first()
            if not workflow:
                return False

            state_nodes = WorkflowNode.objects.filter(
                workflow=workflow,
                node_type='state'
            )

            current_state_node = None
            for node in state_nodes:
                node_config = node.config or {}
                if node_config.get('stateKey') == document.current_state:
                    current_state_node = node
                    break

            if not current_state_node:
                return False

            permissions = current_state_node.config.get('permissions', {}) if current_state_node.config else {}

            # Check permission based on type
            if permission_type == 'view':
                view_perms = permissions.get('view', {})

                # Check if submitter is included
                if view_perms.get('includeSubmitter') and document.submitted_by == user:
                    return True

                # Check if user is an approver
                if view_perms.get('includeApprovers'):
                    # Check if user has any pending approval tasks for this document
                    has_approval = ApprovalTask.objects.filter(
                        document=document,
                        assigned_to_users=user
                    ).exists()
                    if has_approval:
                        return True

                    # Check if user's role has approval tasks
                    has_role_approval = ApprovalTask.objects.filter(
                        document=document,
                        assigned_to_roles__in=user.groups.all()
                    ).exists()
                    if has_role_approval:
                        return True

                # Check specific roles
                allowed_roles = view_perms.get('roles', [])
                if allowed_roles:
                    user_role_ids = list(user.groups.values_list('id', flat=True))
                    if any(str(role_id) in allowed_roles for role_id in user_role_ids):
                        return True

                # Check specific users
                allowed_users = view_perms.get('users', [])
                if str(user.id) in allowed_users:
                    return True

            elif permission_type == 'edit_main_form':
                # Check if main form editing is enabled
                if not permissions.get('editMainForm', False):
                    return False

                # Check role restrictions
                allowed_roles = permissions.get('editMainFormRoles', [])
                if allowed_roles:
                    user_role_ids = list(user.groups.values_list('id', flat=True))
                    if not any(str(role_id) in allowed_roles for role_id in user_role_ids):
                        return False

                # Check user restrictions
                allowed_users = permissions.get('editMainFormUsers', [])
                if allowed_users:
                    if str(user.id) not in allowed_users:
                        return False

                return True

            elif permission_type == 'edit_child_forms':
                # Check if child form editing is enabled
                if not permissions.get('editChildForms', False):
                    return False

                # Check role restrictions
                allowed_roles = permissions.get('editChildFormsRoles', [])
                if allowed_roles:
                    user_role_ids = list(user.groups.values_list('id', flat=True))
                    if not any(str(role_id) in allowed_roles for role_id in user_role_ids):
                        return False

                # Check user restrictions
                allowed_users = permissions.get('editChildFormsUsers', [])
                if allowed_users:
                    if str(user.id) not in allowed_users:
                        return False

                return True

            return False

        except Exception as e:
            print(f"Error checking state permissions: {e}")
            return False
