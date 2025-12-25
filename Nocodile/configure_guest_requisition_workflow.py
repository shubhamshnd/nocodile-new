"""
Script to configure the Guest Requisition workflow with:
- Draft → UH Approval (approve/reject/send back)
- UH Approval actions: Approve → UH_Approved, Reject → UH_Rejected, Send Back → Draft
- UH_Approved → HR Approval (approve/reject)
- HR Approval actions: Approve → Completed, Reject → HR_Rejected
"""
import os
import sys
import json
import uuid
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Nocodile.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from core.models import Workflow, WorkflowNode, WorkflowConnection, DocumentType

def create_workflow_graph():
    # Find the Guest Requisition workflow
    try:
        doc_type = DocumentType.objects.get(name='Guest Requisition')
    except DocumentType.DoesNotExist:
        print("Error: Guest Requisition document type not found")
        return

    try:
        workflow = Workflow.objects.get(document_type=doc_type)
        print(f"Found workflow: {workflow.name} (ID: {workflow.id})")
    except Workflow.DoesNotExist:
        # Create workflow if it doesn't exist
        workflow = Workflow.objects.create(
            document_type=doc_type,
            name="Guest Requisition Workflow",
            is_default=True
        )
        print(f"Created workflow: {workflow.name} (ID: {workflow.id})")

    # Delete existing nodes and connections
    WorkflowConnection.objects.filter(workflow=workflow).delete()
    WorkflowNode.objects.filter(workflow=workflow).delete()
    print("Cleared existing workflow graph")

    # Create nodes with proper positions for a clean layout
    nodes = {}

    # Row 1: Draft
    nodes['draft'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='state',
        label='Draft',
        position_x=100,
        position_y=100,
        config={
            'name': 'Draft',
            'stateKey': 'DRAFT',
            'color': '#9e9e9e',
            'isInitial': True,
            'isFinal': False,
            'allowEdit': True,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': False},
                'editMainForm': True,
                'editChildForms': True,
            }
        }
    )
    print(f"  Created: Draft (ID: {nodes['draft'].id})")

    # Row 2: UH Approval (approval node)
    nodes['uh_approval'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='approval',
        label='Unit Head Approval',
        position_x=350,
        position_y=100,
        config={
            'name': 'Unit Head Approval',
            'stateKey': 'UH_PENDING',
            'color': '#ff9800',
            'approverType': 'role',
            'approverRoles': ['Unit Head', 'Department Manager'],
            'requiresComment': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,
                'editChildForms': False,
            }
        }
    )
    print(f"  Created: Unit Head Approval (ID: {nodes['uh_approval'].id})")

    # Row 3: UH Approved, UH Rejected (outcomes of UH approval)
    nodes['uh_approved'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='state',
        label='UH Approved',
        position_x=600,
        position_y=50,
        config={
            'name': 'UH Approved',
            'stateKey': 'UH_APPROVED',
            'color': '#4caf50',
            'isInitial': False,
            'isFinal': False,
            'allowEdit': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,  # HR cannot edit main form
                'editChildForms': True,  # HR can add child forms like vehicle, hotel arrangements
            }
        }
    )
    print(f"  Created: UH Approved (ID: {nodes['uh_approved'].id})")

    nodes['uh_rejected'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='state',
        label='UH Rejected',
        position_x=600,
        position_y=200,
        config={
            'name': 'UH Rejected',
            'stateKey': 'UH_REJECTED',
            'color': '#f44336',
            'isInitial': False,
            'isFinal': True,
            'allowEdit': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,
                'editChildForms': False,
            }
        }
    )
    print(f"  Created: UH Rejected (ID: {nodes['uh_rejected'].id})")

    # Row 4: HR Approval (approval node)
    nodes['hr_approval'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='approval',
        label='HR Approval',
        position_x=850,
        position_y=50,
        config={
            'name': 'HR Approval',
            'stateKey': 'HR_PENDING',
            'color': '#2196f3',
            'approverType': 'role',
            'approverRoles': ['HR Manager', 'HR Admin'],
            'requiresComment': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,
                'editChildForms': True,
            }
        }
    )
    print(f"  Created: HR Approval (ID: {nodes['hr_approval'].id})")

    # Row 5: Completed, HR Rejected (final outcomes)
    nodes['completed'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='state',
        label='Completed',
        position_x=1100,
        position_y=0,
        config={
            'name': 'Completed',
            'stateKey': 'COMPLETED',
            'color': '#4caf50',
            'isInitial': False,
            'isFinal': True,
            'allowEdit': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,
                'editChildForms': False,
            }
        }
    )
    print(f"  Created: Completed (ID: {nodes['completed'].id})")

    nodes['hr_rejected'] = WorkflowNode.objects.create(
        workflow=workflow,
        node_type='state',
        label='HR Rejected',
        position_x=1100,
        position_y=100,
        config={
            'name': 'HR Rejected',
            'stateKey': 'HR_REJECTED',
            'color': '#f44336',
            'isInitial': False,
            'isFinal': True,
            'allowEdit': False,
            'permissions': {
                'view': {'includeSubmitter': True, 'includeApprovers': True},
                'editMainForm': False,
                'editChildForms': False,
            }
        }
    )
    print(f"  Created: HR Rejected (ID: {nodes['hr_rejected'].id})")

    print("\nCreating connections...")

    # Connection 1: Draft -> UH Approval (Submit action)
    conn1 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['draft'],
        target_node=nodes['uh_approval'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'submit',
            'buttonLabel': 'Submit for Approval',
            'buttonColor': '#1976d2',
            'buttonVariant': 'primary',
            'requiresComment': False,
            'order': 1
        }
    )
    print(f"  Created: Draft -> UH Approval (Submit)")

    # Connection 2: UH Approval -> UH Approved (Approve action)
    conn2 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['uh_approval'],
        target_node=nodes['uh_approved'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'approve',
            'buttonLabel': 'Approve',
            'buttonColor': '#4caf50',
            'buttonVariant': 'primary',
            'requiresComment': False,
            'order': 1
        }
    )
    print(f"  Created: UH Approval -> UH Approved (Approve)")

    # Connection 3: UH Approval -> UH Rejected (Reject action)
    conn3 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['uh_approval'],
        target_node=nodes['uh_rejected'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'reject',
            'buttonLabel': 'Reject',
            'buttonColor': '#f44336',
            'buttonVariant': 'error',
            'requiresComment': True,
            'order': 3
        }
    )
    print(f"  Created: UH Approval -> UH Rejected (Reject)")

    # Connection 4: UH Approval -> Draft (Send Back action)
    conn4 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['uh_approval'],
        target_node=nodes['draft'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'send_back',
            'buttonLabel': 'Send Back for Changes',
            'buttonColor': '#ff9800',
            'buttonVariant': 'secondary',
            'requiresComment': True,
            'order': 2
        }
    )
    print(f"  Created: UH Approval -> Draft (Send Back)")

    # Connection 5: UH Approved -> HR Approval (automatic or manual transition)
    conn5 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['uh_approved'],
        target_node=nodes['hr_approval'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'proceed_to_hr',
            'buttonLabel': 'Proceed to HR',
            'buttonColor': '#2196f3',
            'buttonVariant': 'primary',
            'requiresComment': False,
            'order': 1
        }
    )
    print(f"  Created: UH Approved -> HR Approval (Proceed)")

    # Connection 6: HR Approval -> Completed (Approve action)
    conn6 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['hr_approval'],
        target_node=nodes['completed'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'approve',
            'buttonLabel': 'Approve & Complete',
            'buttonColor': '#4caf50',
            'buttonVariant': 'primary',
            'requiresComment': False,
            'order': 1
        }
    )
    print(f"  Created: HR Approval -> Completed (Approve)")

    # Connection 7: HR Approval -> HR Rejected (Reject action)
    conn7 = WorkflowConnection.objects.create(
        workflow=workflow,
        source_node=nodes['hr_approval'],
        target_node=nodes['hr_rejected'],
        source_output='output',
        target_input='input',
        action_config={
            'actionKey': 'reject',
            'buttonLabel': 'Reject',
            'buttonColor': '#f44336',
            'buttonVariant': 'error',
            'requiresComment': True,
            'order': 2
        }
    )
    print(f"  Created: HR Approval -> HR Rejected (Reject)")

    print(f"\n=== Workflow Configuration Complete ===")
    print(f"Workflow ID: {workflow.id}")
    print(f"Total Nodes: {len(nodes)}")
    print(f"Total Connections: 7")
    print("\nWorkflow Flow:")
    print("  Draft")
    print("    -> [Submit for Approval] -> Unit Head Approval")
    print("                                 |-> [Approve] -> UH Approved")
    print("                                 |                 -> [Proceed to HR] -> HR Approval")
    print("                                 |                                        |-> [Approve & Complete] -> Completed")
    print("                                 |                                        |-> [Reject] -> HR Rejected")
    print("                                 |-> [Send Back] -> Draft")
    print("                                 |-> [Reject] -> UH Rejected")

if __name__ == '__main__':
    create_workflow_graph()
