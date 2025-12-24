"""
Nocodile Platform - URL Configuration
"""

from django.contrib import admin
from django.urls import path
from core import views

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth APIs
    path("api/csrf/", views.get_csrf_token, name="csrf_token"),
    path("api/auth/login/", views.login_view, name="login"),
    path("api/auth/logout/", views.logout_view, name="logout"),
    path("api/auth/me/", views.get_current_user, name="current_user"),

    # User Management APIs
    path("api/users/", views.users_list, name="users_list"),
    path("api/users/<uuid:user_id>/", views.user_detail, name="user_detail"),

    # Role Management APIs
    path("api/roles/", views.roles_list, name="roles_list"),
    path("api/roles/<int:role_id>/", views.role_detail, name="role_detail"),

    # Application APIs
    path("api/applications/", views.applications_list, name="applications_list"),
    path("api/applications/<uuid:pk>/", views.application_detail, name="application_detail"),

    # Document Type APIs
    path("api/document-types/", views.document_types_list, name="document_types_list"),
    path("api/document-types/<uuid:pk>/", views.document_type_detail, name="document_type_detail"),

    # Form APIs
    path("api/forms/", views.forms_list, name="forms_list"),
    path("api/forms/<uuid:pk>/", views.form_detail, name="form_detail"),

    # Form Component APIs (new hierarchical structure)
    path("api/form-components/", views.form_components_list, name="form_components_list"),
    path("api/form-components/<uuid:pk>/", views.form_component_detail, name="form_component_detail"),
    path("api/form-components/<uuid:pk>/move/", views.move_component, name="move_component"),
    path("api/form-components/<uuid:pk>/duplicate/", views.duplicate_component, name="duplicate_component"),
    path("api/forms/<uuid:form_id>/reorder-components/", views.reorder_components, name="reorder_components"),
    path("api/component-types/", views.get_component_types, name="component_types"),

    # Legacy Form Field APIs (backwards compatibility)
    path("api/form-fields/", views.form_fields_list, name="form_fields_list"),
    path("api/form-fields/<uuid:pk>/", views.form_field_detail, name="form_field_detail"),
    path("api/forms/<uuid:form_id>/reorder-fields/", views.reorder_fields, name="reorder_fields"),

    # Workflow APIs
    path("api/workflows/", views.workflows_list, name="workflows_list"),
    path("api/workflows/<uuid:pk>/", views.workflow_detail, name="workflow_detail"),

    # Workflow State APIs
    path("api/workflow-states/", views.workflow_states_list, name="workflow_states_list"),
    path("api/workflow-states/<uuid:pk>/", views.workflow_state_detail, name="workflow_state_detail"),

    # Workflow Transition APIs
    path("api/workflow-transitions/", views.workflow_transitions_list, name="workflow_transitions_list"),
    path("api/workflow-transitions/<uuid:pk>/", views.workflow_transition_detail, name="workflow_transition_detail"),

    # Workflow Graph APIs (Visual Builder)
    path("api/workflows/<uuid:workflow_id>/graph/", views.workflow_graph, name="workflow_graph"),
    path("api/workflows/<uuid:workflow_id>/graph/save/", views.save_workflow_graph, name="save_workflow_graph"),
    path("api/workflows/<uuid:workflow_id>/nodes/", views.workflow_nodes_list, name="workflow_nodes_list"),
    path("api/workflow-nodes/<uuid:pk>/", views.workflow_node_detail, name="workflow_node_detail"),
    path("api/workflows/<uuid:workflow_id>/connections/", views.workflow_connections_list, name="workflow_connections_list"),
    path("api/workflow-connections/<uuid:pk>/", views.workflow_connection_detail, name="workflow_connection_detail"),

    # Child Form APIs
    path("api/child-forms/", views.child_forms_list, name="child_forms_list"),
    path("api/child-forms/<uuid:pk>/", views.child_form_detail, name="child_form_detail"),

    # Document APIs
    path("api/documents/", views.documents_list, name="documents_list"),
    path("api/documents/<uuid:pk>/", views.document_detail, name="document_detail"),
    path("api/documents/<uuid:pk>/save-draft/", views.save_draft, name="save_draft"),
    path("api/documents/<uuid:pk>/submit/", views.submit_document, name="submit_document"),
    path("api/documents/<uuid:pk>/transition/", views.transition_document, name="transition_document"),
    path("api/documents/<uuid:pk>/visible-child-forms/", views.get_visible_child_forms, name="visible_child_forms"),

    # Dashboard APIs
    path("api/dashboard/stats/", views.dashboard_stats, name="dashboard_stats"),
]
