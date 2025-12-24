"""
Nocodile Platform - All API Views
Django REST Framework APIs for no-code platform
"""

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Group
from django.middleware.csrf import get_token
from django.db import models, transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    User, Application, DocumentType, Form, FormComponent,
    Workflow, WorkflowState, WorkflowTransition,
    ChildForm, Document, DocumentHistory,
    WorkflowNode, WorkflowConnection
)


# ============== AUTH APIs ==============

@api_view(["GET"])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Get CSRF token for frontend"""
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Login user"""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response({
            "user": {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "isStaff": user.is_staff,
                "isSuperuser": user.is_superuser,
            }
        })
    return Response(
        {"error": "Invalid credentials"},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(["POST"])
def logout_view(request):
    """Logout user"""
    logout(request)
    return Response({"message": "Logged out successfully"})


@api_view(["GET"])
def get_current_user(request):
    """Get current logged in user"""
    user = request.user
    return Response({
        "user": {
            "id": str(user.id),
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "isStaff": user.is_staff,
            "isSuperuser": user.is_superuser,
        }
    })


# ============== USER MANAGEMENT APIs ==============

def serialize_user(user):
    """Serialize user object"""
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "isStaff": user.is_staff,
        "isActive": user.is_active,
        "isSuperuser": user.is_superuser,
        "groups": [{"id": g.id, "name": g.name} for g in user.groups.all()],
        "dateJoined": user.date_joined.isoformat() if user.date_joined else None,
        "lastLogin": user.last_login.isoformat() if user.last_login else None,
    }


@api_view(["GET", "POST"])
def users_list(request):
    """List all users or create a new user"""
    if request.method == "GET":
        users = User.objects.all().order_by("-date_joined")
        return Response([serialize_user(u) for u in users])

    elif request.method == "POST":
        username = request.data.get("username")
        email = request.data.get("email", "")
        password = request.data.get("password")
        first_name = request.data.get("firstName", "")
        last_name = request.data.get("lastName", "")
        is_staff = request.data.get("isStaff", False)
        is_superuser = request.data.get("isSuperuser", False)
        group_ids = request.data.get("groupIds", [])

        if not username:
            return Response(
                {"error": "Username is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not password:
            return Response(
                {"error": "Password is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff,
            is_superuser=is_superuser,
        )

        # Add user to groups
        if group_ids:
            groups = Group.objects.filter(id__in=group_ids)
            user.groups.set(groups)

        return Response(serialize_user(user), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def user_detail(request, user_id):
    """Get, update, or delete a user"""
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        return Response(serialize_user(user))

    elif request.method == "PUT":
        user.username = request.data.get("username", user.username)
        user.email = request.data.get("email", user.email)
        user.first_name = request.data.get("firstName", user.first_name)
        user.last_name = request.data.get("lastName", user.last_name)
        user.is_staff = request.data.get("isStaff", user.is_staff)
        user.is_active = request.data.get("isActive", user.is_active)
        user.is_superuser = request.data.get("isSuperuser", user.is_superuser)

        # Update password if provided
        password = request.data.get("password")
        if password:
            user.set_password(password)

        # Update groups
        group_ids = request.data.get("groupIds")
        if group_ids is not None:
            groups = Group.objects.filter(id__in=group_ids)
            user.groups.set(groups)

        user.save()
        return Response(serialize_user(user))

    elif request.method == "DELETE":
        # Prevent deleting yourself
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== ROLE (GROUP) MANAGEMENT APIs ==============

def serialize_role(group):
    """Serialize role/group object"""
    return {
        "id": group.id,
        "name": group.name,
        "userCount": group.user_set.count(),
        "permissions": [
            {
                "id": p.id,
                "name": p.name,
                "codename": p.codename,
            }
            for p in group.permissions.all()
        ],
    }


@api_view(["GET", "POST"])
def roles_list(request):
    """List all roles or create a new role"""
    if request.method == "GET":
        groups = Group.objects.all().order_by("name")
        return Response([serialize_role(g) for g in groups])

    elif request.method == "POST":
        name = request.data.get("name")

        if not name:
            return Response(
                {"error": "Name is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Group.objects.filter(name=name).exists():
            return Response(
                {"error": "Role with this name already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        group = Group.objects.create(name=name)
        return Response(serialize_role(group), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def role_detail(request, role_id):
    """Get, update, or delete a role"""
    try:
        group = Group.objects.get(id=role_id)
    except Group.DoesNotExist:
        return Response(
            {"error": "Role not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        return Response(serialize_role(group))

    elif request.method == "PUT":
        name = request.data.get("name")
        if name:
            if Group.objects.filter(name=name).exclude(id=role_id).exists():
                return Response(
                    {"error": "Role with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            group.name = name
            group.save()
        return Response(serialize_role(group))

    elif request.method == "DELETE":
        group.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== APPLICATION APIs ==============

def serialize_application(app):
    return {
        "id": str(app.id),
        "name": app.name,
        "description": app.description,
        "settings": app.settings,
        "createdAt": app.created_at.isoformat(),
        "updatedAt": app.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def applications_list(request):
    """List all applications or create new one"""
    if request.method == "GET":
        apps = Application.objects.all()
        return Response([serialize_application(app) for app in apps])

    elif request.method == "POST":
        app = Application.objects.create(
            name=request.data.get("name", ""),
            description=request.data.get("description", ""),
            settings=request.data.get("settings", {}),
        )
        return Response(serialize_application(app), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def application_detail(request, pk):
    """Get, update or delete an application"""
    try:
        app = Application.objects.get(pk=pk)
    except Application.DoesNotExist:
        return Response({"error": "Application not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_application(app))

    elif request.method == "PUT":
        app.name = request.data.get("name", app.name)
        app.description = request.data.get("description", app.description)
        app.settings = request.data.get("settings", app.settings)
        app.save()
        return Response(serialize_application(app))

    elif request.method == "DELETE":
        app.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== DOCUMENT TYPE APIs ==============

def serialize_document_type(dt):
    return {
        "id": str(dt.id),
        "applicationId": str(dt.application_id),
        "name": dt.name,
        "slug": dt.slug,
        "settings": dt.settings,
        "createdAt": dt.created_at.isoformat(),
        "updatedAt": dt.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def document_types_list(request):
    """List all document types or create new one"""
    if request.method == "GET":
        app_id = request.query_params.get("applicationId")
        dts = DocumentType.objects.all()
        if app_id:
            dts = dts.filter(application_id=app_id)
        return Response([serialize_document_type(dt) for dt in dts])

    elif request.method == "POST":
        try:
            app = Application.objects.get(pk=request.data.get("applicationId"))
        except Application.DoesNotExist:
            return Response({"error": "Application not found"}, status=status.HTTP_400_BAD_REQUEST)

        dt = DocumentType.objects.create(
            application=app,
            name=request.data.get("name", ""),
            slug=request.data.get("slug", ""),
            settings=request.data.get("settings", {}),
        )
        return Response(serialize_document_type(dt), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def document_type_detail(request, pk):
    """Get, update or delete a document type"""
    try:
        dt = DocumentType.objects.get(pk=pk)
    except DocumentType.DoesNotExist:
        return Response({"error": "Document type not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_document_type(dt))

    elif request.method == "PUT":
        dt.name = request.data.get("name", dt.name)
        dt.slug = request.data.get("slug", dt.slug)
        dt.settings = request.data.get("settings", dt.settings)
        dt.save()
        return Response(serialize_document_type(dt))

    elif request.method == "DELETE":
        dt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== FORM APIs ==============

def serialize_form(form):
    return {
        "id": str(form.id),
        "documentTypeId": str(form.document_type_id),
        "name": form.name,
        "stages": form.stages,
        "isActive": form.is_active,
        "createdAt": form.created_at.isoformat(),
        "updatedAt": form.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def forms_list(request):
    """List all forms or create new one"""
    if request.method == "GET":
        dt_id = request.query_params.get("documentTypeId")
        forms = Form.objects.all()
        if dt_id:
            forms = forms.filter(document_type_id=dt_id)
        return Response([serialize_form(f) for f in forms])

    elif request.method == "POST":
        try:
            dt = DocumentType.objects.get(pk=request.data.get("documentTypeId"))
        except DocumentType.DoesNotExist:
            return Response({"error": "Document type not found"}, status=status.HTTP_400_BAD_REQUEST)

        form = Form.objects.create(
            document_type=dt,
            name=request.data.get("name", ""),
            stages=request.data.get("stages", {
                "mode": "stepper",
                "allowPartialSave": True,
                "stages": []
            }),
            is_active=request.data.get("isActive", True),
        )
        return Response(serialize_form(form), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def form_detail(request, pk):
    """Get, update or delete a form"""
    try:
        form = Form.objects.get(pk=pk)
    except Form.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_form(form))

    elif request.method == "PUT":
        form.name = request.data.get("name", form.name)
        form.stages = request.data.get("stages", form.stages)
        form.is_active = request.data.get("isActive", form.is_active)
        form.save()
        return Response(serialize_form(form))

    elif request.method == "DELETE":
        form.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== FORM COMPONENT APIs ==============

def serialize_component(component, include_children=False):
    """Serialize a form component, optionally with nested children"""
    data = {
        "id": str(component.id),
        "formId": str(component.form_id),
        "parentId": str(component.parent_id) if component.parent_id else None,
        "componentType": component.component_type,
        "fieldKey": component.field_key,
        "config": component.config,
        "order": component.order,
        "isLayout": component.is_layout,
        "isField": component.is_field,
        "createdAt": component.created_at.isoformat(),
        "updatedAt": component.updated_at.isoformat(),
    }
    if include_children:
        children = component.children.all().order_by('order')
        data["children"] = [serialize_component(c, include_children=True) for c in children]
    return data


def build_component_tree(form_id):
    """Build a complete component tree for a form"""
    # Get all root components (no parent)
    root_components = FormComponent.objects.filter(
        form_id=form_id,
        parent__isnull=True
    ).order_by('order')
    return [serialize_component(c, include_children=True) for c in root_components]


@api_view(["GET", "POST"])
def form_components_list(request):
    """List all form components or create new one"""
    if request.method == "GET":
        form_id = request.query_params.get("formId")
        flat = request.query_params.get("flat", "false").lower() == "true"

        if form_id:
            if flat:
                # Return flat list of all components
                components = FormComponent.objects.filter(form_id=form_id).order_by('order')
                return Response([serialize_component(c) for c in components])
            else:
                # Return nested tree structure
                return Response(build_component_tree(form_id))
        else:
            components = FormComponent.objects.all().order_by('order')
            return Response([serialize_component(c) for c in components])

    elif request.method == "POST":
        try:
            form = Form.objects.get(pk=request.data.get("formId"))
        except Form.DoesNotExist:
            return Response({"error": "Form not found"}, status=status.HTTP_400_BAD_REQUEST)

        parent = None
        if request.data.get("parentId"):
            try:
                parent = FormComponent.objects.get(pk=request.data.get("parentId"))
            except FormComponent.DoesNotExist:
                return Response({"error": "Parent component not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate order for new component
        if parent:
            siblings = FormComponent.objects.filter(form=form, parent=parent)
        else:
            siblings = FormComponent.objects.filter(form=form, parent__isnull=True)

        order = request.data.get("order")
        if order is None:
            order = siblings.count()

        component = FormComponent.objects.create(
            form=form,
            parent=parent,
            component_type=request.data.get("componentType", "text"),
            field_key=request.data.get("fieldKey", ""),
            config=request.data.get("config", {}),
            order=order,
        )
        return Response(serialize_component(component, include_children=True), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def form_component_detail(request, pk):
    """Get, update or delete a form component"""
    try:
        component = FormComponent.objects.get(pk=pk)
    except FormComponent.DoesNotExist:
        return Response({"error": "Form component not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        include_children = request.query_params.get("includeChildren", "false").lower() == "true"
        return Response(serialize_component(component, include_children))

    elif request.method == "PUT":
        component.component_type = request.data.get("componentType", component.component_type)
        component.field_key = request.data.get("fieldKey", component.field_key)
        component.config = request.data.get("config", component.config)
        if "order" in request.data:
            component.order = request.data["order"]
        component.save()
        return Response(serialize_component(component, include_children=True))

    elif request.method == "DELETE":
        # Delete cascades to children automatically
        component.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def move_component(request, pk):
    """Move a component to a new parent or reorder within same parent"""
    try:
        component = FormComponent.objects.get(pk=pk)
    except FormComponent.DoesNotExist:
        return Response({"error": "Component not found"}, status=status.HTTP_404_NOT_FOUND)

    new_parent_id = request.data.get("parentId")
    new_order = request.data.get("order", 0)

    with transaction.atomic():
        # Set new parent
        if new_parent_id:
            try:
                new_parent = FormComponent.objects.get(pk=new_parent_id)
                component.parent = new_parent
            except FormComponent.DoesNotExist:
                return Response({"error": "Parent component not found"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            component.parent = None

        # Update orders of siblings
        if component.parent:
            siblings = FormComponent.objects.filter(
                form=component.form,
                parent=component.parent
            ).exclude(pk=pk)
        else:
            siblings = FormComponent.objects.filter(
                form=component.form,
                parent__isnull=True
            ).exclude(pk=pk)

        # Shift siblings to make room
        siblings.filter(order__gte=new_order).update(order=models.F('order') + 1)
        component.order = new_order
        component.save()

    return Response(serialize_component(component, include_children=True))


@api_view(["POST"])
def reorder_components(request, form_id):
    """Reorder components in a form - supports nested reordering"""
    try:
        form = Form.objects.get(pk=form_id)
    except Form.DoesNotExist:
        return Response({"error": "Form not found"}, status=status.HTTP_404_NOT_FOUND)

    component_orders = request.data.get("componentOrders", [])
    with transaction.atomic():
        for item in component_orders:
            updates = {"order": item["order"]}
            if "parentId" in item:
                updates["parent_id"] = item["parentId"] if item["parentId"] else None
            FormComponent.objects.filter(pk=item["id"], form=form).update(**updates)

    return Response(build_component_tree(form_id))


@api_view(["POST"])
def duplicate_component(request, pk):
    """Duplicate a component and all its children"""
    try:
        component = FormComponent.objects.get(pk=pk)
    except FormComponent.DoesNotExist:
        return Response({"error": "Component not found"}, status=status.HTTP_404_NOT_FOUND)

    def duplicate_recursive(comp, new_parent=None):
        """Recursively duplicate component and children"""
        # Create duplicate
        new_comp = FormComponent.objects.create(
            form=comp.form,
            parent=new_parent if new_parent else comp.parent,
            component_type=comp.component_type,
            field_key=f"{comp.field_key}_copy" if comp.field_key else "",
            config=comp.config.copy() if comp.config else {},
            order=comp.order + 1,
        )
        # Duplicate children
        for child in comp.children.all().order_by('order'):
            duplicate_recursive(child, new_comp)
        return new_comp

    with transaction.atomic():
        new_component = duplicate_recursive(component)

    return Response(serialize_component(new_component, include_children=True), status=status.HTTP_201_CREATED)


@api_view(["GET"])
def get_component_types(request):
    """Get all available component types"""
    return Response({
        "layout": [
            {"type": t[0], "label": t[1]}
            for t in FormComponent.LAYOUT_TYPES
        ],
        "fields": [
            {"type": t[0], "label": t[1]}
            for t in FormComponent.FIELD_TYPES
        ],
    })


# Legacy API support - alias for backwards compatibility
@api_view(["GET", "POST"])
def form_fields_list(request):
    """Legacy: List all form fields - redirects to components API"""
    return form_components_list(request)


@api_view(["GET", "PUT", "DELETE"])
def form_field_detail(request, pk):
    """Legacy: Form field detail - redirects to components API"""
    return form_component_detail(request, pk)


@api_view(["POST"])
def reorder_fields(request, form_id):
    """Legacy: Reorder fields - redirects to components API"""
    return reorder_components(request, form_id)


# ============== WORKFLOW APIs ==============

def serialize_workflow(workflow, include_details=False):
    data = {
        "id": str(workflow.id),
        "documentTypeId": str(workflow.document_type_id),
        "name": workflow.name,
        "isDefault": workflow.is_default,
        "createdAt": workflow.created_at.isoformat(),
        "updatedAt": workflow.updated_at.isoformat(),
    }
    if include_details:
        data["states"] = [serialize_state(s) for s in workflow.states.all()]
        data["transitions"] = [serialize_transition(t) for t in workflow.transitions.all()]
    return data


def serialize_state(state):
    return {
        "id": str(state.id),
        "workflowId": str(state.workflow_id),
        "name": state.name,
        "key": state.key,
        "isInitial": state.is_initial,
        "isFinal": state.is_final,
        "config": state.config,
        "createdAt": state.created_at.isoformat(),
        "updatedAt": state.updated_at.isoformat(),
    }


def serialize_transition(transition):
    return {
        "id": str(transition.id),
        "workflowId": str(transition.workflow_id),
        "fromStateId": str(transition.from_state_id),
        "toStateId": str(transition.to_state_id),
        "rules": transition.rules,
        "buttons": transition.buttons,
        "createdAt": transition.created_at.isoformat(),
        "updatedAt": transition.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def workflows_list(request):
    """List all workflows or create new one"""
    if request.method == "GET":
        dt_id = request.query_params.get("documentTypeId")
        workflows = Workflow.objects.all()
        if dt_id:
            workflows = workflows.filter(document_type_id=dt_id)
        include_details = request.query_params.get("includeDetails", "false").lower() == "true"
        return Response([serialize_workflow(w, include_details) for w in workflows])

    elif request.method == "POST":
        try:
            dt = DocumentType.objects.get(pk=request.data.get("documentTypeId"))
        except DocumentType.DoesNotExist:
            return Response({"error": "Document type not found"}, status=status.HTTP_400_BAD_REQUEST)

        workflow = Workflow.objects.create(
            document_type=dt,
            name=request.data.get("name", ""),
            is_default=request.data.get("isDefault", False),
        )
        return Response(serialize_workflow(workflow), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def workflow_detail(request, pk):
    """Get, update or delete a workflow"""
    try:
        workflow = Workflow.objects.get(pk=pk)
    except Workflow.DoesNotExist:
        return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_workflow(workflow, include_details=True))

    elif request.method == "PUT":
        workflow.name = request.data.get("name", workflow.name)
        workflow.is_default = request.data.get("isDefault", workflow.is_default)
        workflow.save()
        return Response(serialize_workflow(workflow))

    elif request.method == "DELETE":
        workflow.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== WORKFLOW STATE APIs ==============

@api_view(["GET", "POST"])
def workflow_states_list(request):
    """List all workflow states or create new one"""
    if request.method == "GET":
        workflow_id = request.query_params.get("workflowId")
        states = WorkflowState.objects.all()
        if workflow_id:
            states = states.filter(workflow_id=workflow_id)
        return Response([serialize_state(s) for s in states])

    elif request.method == "POST":
        try:
            workflow = Workflow.objects.get(pk=request.data.get("workflowId"))
        except Workflow.DoesNotExist:
            return Response({"error": "Workflow not found"}, status=status.HTTP_400_BAD_REQUEST)

        state = WorkflowState.objects.create(
            workflow=workflow,
            name=request.data.get("name", ""),
            key=request.data.get("key", ""),
            is_initial=request.data.get("isInitial", False),
            is_final=request.data.get("isFinal", False),
            config=request.data.get("config", {}),
        )
        return Response(serialize_state(state), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def workflow_state_detail(request, pk):
    """Get, update or delete a workflow state"""
    try:
        state = WorkflowState.objects.get(pk=pk)
    except WorkflowState.DoesNotExist:
        return Response({"error": "Workflow state not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_state(state))

    elif request.method == "PUT":
        state.name = request.data.get("name", state.name)
        state.key = request.data.get("key", state.key)
        state.is_initial = request.data.get("isInitial", state.is_initial)
        state.is_final = request.data.get("isFinal", state.is_final)
        state.config = request.data.get("config", state.config)
        state.save()
        return Response(serialize_state(state))

    elif request.method == "DELETE":
        state.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== WORKFLOW TRANSITION APIs ==============

@api_view(["GET", "POST"])
def workflow_transitions_list(request):
    """List all workflow transitions or create new one"""
    if request.method == "GET":
        workflow_id = request.query_params.get("workflowId")
        transitions = WorkflowTransition.objects.all()
        if workflow_id:
            transitions = transitions.filter(workflow_id=workflow_id)
        return Response([serialize_transition(t) for t in transitions])

    elif request.method == "POST":
        try:
            workflow = Workflow.objects.get(pk=request.data.get("workflowId"))
            from_state = WorkflowState.objects.get(pk=request.data.get("fromStateId"))
            to_state = WorkflowState.objects.get(pk=request.data.get("toStateId"))
        except (Workflow.DoesNotExist, WorkflowState.DoesNotExist):
            return Response({"error": "Workflow or states not found"}, status=status.HTTP_400_BAD_REQUEST)

        transition = WorkflowTransition.objects.create(
            workflow=workflow,
            from_state=from_state,
            to_state=to_state,
            rules=request.data.get("rules", {}),
            buttons=request.data.get("buttons", []),
        )
        return Response(serialize_transition(transition), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def workflow_transition_detail(request, pk):
    """Get, update or delete a workflow transition"""
    try:
        transition = WorkflowTransition.objects.get(pk=pk)
    except WorkflowTransition.DoesNotExist:
        return Response({"error": "Workflow transition not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_transition(transition))

    elif request.method == "PUT":
        if "fromStateId" in request.data:
            try:
                transition.from_state = WorkflowState.objects.get(pk=request.data["fromStateId"])
            except WorkflowState.DoesNotExist:
                return Response({"error": "From state not found"}, status=status.HTTP_400_BAD_REQUEST)
        if "toStateId" in request.data:
            try:
                transition.to_state = WorkflowState.objects.get(pk=request.data["toStateId"])
            except WorkflowState.DoesNotExist:
                return Response({"error": "To state not found"}, status=status.HTTP_400_BAD_REQUEST)
        transition.rules = request.data.get("rules", transition.rules)
        transition.buttons = request.data.get("buttons", transition.buttons)
        transition.save()
        return Response(serialize_transition(transition))

    elif request.method == "DELETE":
        transition.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== CHILD FORM APIs ==============

def serialize_child_form(cf):
    return {
        "id": str(cf.id),
        "parentDocumentTypeId": str(cf.parent_document_type_id),
        "childDocumentTypeId": str(cf.child_document_type_id),
        "relationType": cf.relation_type,
        "visibility": cf.visibility,
        "createdAt": cf.created_at.isoformat(),
        "updatedAt": cf.updated_at.isoformat(),
    }


@api_view(["GET", "POST"])
def child_forms_list(request):
    """List all child form relations or create new one"""
    if request.method == "GET":
        parent_id = request.query_params.get("parentDocumentTypeId")
        child_forms = ChildForm.objects.all()
        if parent_id:
            child_forms = child_forms.filter(parent_document_type_id=parent_id)
        return Response([serialize_child_form(cf) for cf in child_forms])

    elif request.method == "POST":
        try:
            parent_dt = DocumentType.objects.get(pk=request.data.get("parentDocumentTypeId"))
            child_dt = DocumentType.objects.get(pk=request.data.get("childDocumentTypeId"))
        except DocumentType.DoesNotExist:
            return Response({"error": "Document type not found"}, status=status.HTTP_400_BAD_REQUEST)

        cf = ChildForm.objects.create(
            parent_document_type=parent_dt,
            child_document_type=child_dt,
            relation_type=request.data.get("relationType", "one_to_many"),
            visibility=request.data.get("visibility", {}),
        )
        return Response(serialize_child_form(cf), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def child_form_detail(request, pk):
    """Get, update or delete a child form relation"""
    try:
        cf = ChildForm.objects.get(pk=pk)
    except ChildForm.DoesNotExist:
        return Response({"error": "Child form relation not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_child_form(cf))

    elif request.method == "PUT":
        cf.relation_type = request.data.get("relationType", cf.relation_type)
        cf.visibility = request.data.get("visibility", cf.visibility)
        cf.save()
        return Response(serialize_child_form(cf))

    elif request.method == "DELETE":
        cf.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============== DOCUMENT APIs ==============

def serialize_document(doc, include_history=False):
    data = {
        "id": str(doc.id),
        "documentTypeId": str(doc.document_type_id),
        "parentDocumentId": str(doc.parent_document_id) if doc.parent_document_id else None,
        "data": doc.data,
        "stageKey": doc.stage_key,
        "isSubmitted": doc.is_submitted,
        "workflowStateId": str(doc.workflow_state_id) if doc.workflow_state_id else None,
        "createdById": str(doc.created_by_id) if doc.created_by_id else None,
        "createdAt": doc.created_at.isoformat(),
        "updatedAt": doc.updated_at.isoformat(),
    }
    if doc.workflow_state:
        data["workflowState"] = serialize_state(doc.workflow_state)
    if include_history:
        data["history"] = [serialize_history(h) for h in doc.history.all()]
    return data


def serialize_history(h):
    return {
        "id": str(h.id),
        "documentId": str(h.document_id),
        "action": h.action,
        "fromStateId": str(h.from_state_id) if h.from_state_id else None,
        "toStateId": str(h.to_state_id) if h.to_state_id else None,
        "dataSnapshot": h.data_snapshot,
        "comment": h.comment,
        "performedById": str(h.performed_by_id) if h.performed_by_id else None,
        "createdAt": h.created_at.isoformat(),
    }


@api_view(["GET", "POST"])
def documents_list(request):
    """List all documents or create new one"""
    if request.method == "GET":
        dt_id = request.query_params.get("documentTypeId")
        parent_id = request.query_params.get("parentDocumentId")
        docs = Document.objects.all()
        if dt_id:
            docs = docs.filter(document_type_id=dt_id)
        if parent_id:
            docs = docs.filter(parent_document_id=parent_id)
        return Response([serialize_document(d) for d in docs])

    elif request.method == "POST":
        try:
            dt = DocumentType.objects.get(pk=request.data.get("documentTypeId"))
        except DocumentType.DoesNotExist:
            return Response({"error": "Document type not found"}, status=status.HTTP_400_BAD_REQUEST)

        parent_doc = None
        if request.data.get("parentDocumentId"):
            try:
                parent_doc = Document.objects.get(pk=request.data.get("parentDocumentId"))
            except Document.DoesNotExist:
                return Response({"error": "Parent document not found"}, status=status.HTTP_400_BAD_REQUEST)

        doc = Document.objects.create(
            document_type=dt,
            parent_document=parent_doc,
            data=request.data.get("data", {}),
            stage_key=request.data.get("stageKey", ""),
            is_submitted=False,
            created_by=request.user if request.user.is_authenticated else None,
        )

        DocumentHistory.objects.create(
            document=doc,
            action="created",
            data_snapshot=doc.data,
            performed_by=request.user if request.user.is_authenticated else None,
        )

        return Response(serialize_document(doc), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def document_detail(request, pk):
    """Get, update or delete a document"""
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        include_history = request.query_params.get("includeHistory", "false").lower() == "true"
        return Response(serialize_document(doc, include_history))

    elif request.method == "PUT":
        doc.data = request.data.get("data", doc.data)
        doc.stage_key = request.data.get("stageKey", doc.stage_key)
        doc.save()

        DocumentHistory.objects.create(
            document=doc,
            action="updated",
            data_snapshot=doc.data,
            performed_by=request.user if request.user.is_authenticated else None,
        )

        return Response(serialize_document(doc))

    elif request.method == "DELETE":
        doc.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
def save_draft(request, pk):
    """Save document as draft"""
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    doc.data = request.data.get("data", doc.data)
    doc.stage_key = request.data.get("stageKey", doc.stage_key)
    doc.is_submitted = False
    doc.save()

    DocumentHistory.objects.create(
        document=doc,
        action="draft_saved",
        data_snapshot=doc.data,
        comment=f"Draft saved at stage: {doc.stage_key}",
        performed_by=request.user if request.user.is_authenticated else None,
    )

    return Response(serialize_document(doc))


@api_view(["POST"])
def submit_document(request, pk):
    """Submit document and initialize workflow"""
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    doc.data = request.data.get("data", doc.data)
    doc.is_submitted = True

    # Find default workflow and initial state
    workflow = Workflow.objects.filter(
        document_type=doc.document_type,
        is_default=True
    ).first()

    if not workflow:
        workflow = Workflow.objects.filter(document_type=doc.document_type).first()

    if workflow:
        initial_state = WorkflowState.objects.filter(
            workflow=workflow,
            is_initial=True
        ).first()
        if initial_state:
            doc.workflow_state = initial_state

    doc.save()

    DocumentHistory.objects.create(
        document=doc,
        action="submitted",
        to_state=doc.workflow_state,
        data_snapshot=doc.data,
        performed_by=request.user if request.user.is_authenticated else None,
    )

    return Response(serialize_document(doc))


@api_view(["POST"])
def transition_document(request, pk):
    """Transition document to new workflow state"""
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    if not doc.workflow_state:
        return Response({"error": "Document has no workflow state"}, status=status.HTTP_400_BAD_REQUEST)

    to_state_id = request.data.get("toStateId")
    try:
        to_state = WorkflowState.objects.get(pk=to_state_id)
    except WorkflowState.DoesNotExist:
        return Response({"error": "Target state not found"}, status=status.HTTP_400_BAD_REQUEST)

    # Verify transition exists
    transition_exists = WorkflowTransition.objects.filter(
        from_state=doc.workflow_state,
        to_state=to_state
    ).exists()

    if not transition_exists:
        return Response({"error": "Invalid transition"}, status=status.HTTP_400_BAD_REQUEST)

    from_state = doc.workflow_state
    doc.workflow_state = to_state
    doc.save()

    DocumentHistory.objects.create(
        document=doc,
        action="transitioned",
        from_state=from_state,
        to_state=to_state,
        data_snapshot=doc.data,
        comment=request.data.get("comment", ""),
        performed_by=request.user if request.user.is_authenticated else None,
    )

    return Response(serialize_document(doc))


@api_view(["GET"])
def get_visible_child_forms(request, pk):
    """Get child forms visible for current document state"""
    try:
        doc = Document.objects.get(pk=pk)
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    child_forms = ChildForm.objects.filter(parent_document_type=doc.document_type)
    visible_forms = []

    for cf in child_forms:
        visibility = cf.visibility
        is_visible = True

        # Check state visibility
        if visibility.get("visibleInStates") and doc.workflow_state:
            if doc.workflow_state.key not in visibility["visibleInStates"]:
                is_visible = False

        # Check field conditions
        if is_visible and visibility.get("conditions"):
            for condition in visibility["conditions"]:
                field_value = doc.data.get(condition["field"])
                operator = condition.get("operator", "=")
                condition_value = condition.get("value")

                if operator == "=" and field_value != condition_value:
                    is_visible = False
                    break
                elif operator == "!=" and field_value == condition_value:
                    is_visible = False
                    break
                elif operator == "in" and field_value not in condition_value:
                    is_visible = False
                    break

        if is_visible:
            visible_forms.append(serialize_child_form(cf))

    return Response(visible_forms)


# ============== DASHBOARD APIs ==============

@api_view(["GET"])
def dashboard_stats(request):
    """Get dashboard statistics"""
    return Response({
        "applications": Application.objects.count(),
        "documentTypes": DocumentType.objects.count(),
        "forms": Form.objects.count(),
        "workflows": Workflow.objects.count(),
        "documents": Document.objects.count(),
        "submittedDocuments": Document.objects.filter(is_submitted=True).count(),
        "draftDocuments": Document.objects.filter(is_submitted=False).count(),
    })


# ============== CONDITION EVALUATION HELPERS ==============

def evaluate_comparison(left, operator, right):
    """Evaluate a comparison between two values"""
    try:
        if operator == "=":
            return left == right
        elif operator == "!=":
            return left != right
        elif operator == "<":
            return float(left) < float(right)
        elif operator == "<=":
            return float(left) <= float(right)
        elif operator == ">":
            return float(left) > float(right)
        elif operator == ">=":
            return float(left) >= float(right)
        elif operator == "in":
            return left in right
        elif operator == "not_in":
            return left not in right
        elif operator == "contains":
            return right in str(left)
        elif operator == "starts_with":
            return str(left).startswith(str(right))
        elif operator == "ends_with":
            return str(left).endswith(str(right))
        return False
    except (ValueError, TypeError):
        return False


def evaluate_condition(condition, data):
    """
    Evaluate a workflow condition against document data.
    Supports regular fields and repeatable section conditions.

    Condition format:
    {
        "field": "field_key" or "section_key.field_key",
        "operator": "=", "!=", "<", "<=", ">", ">=", "in", "not_in", "contains",
        "value": comparison_value,

        # For repeatable sections:
        "arrayMode": "any" | "all" | "count" | "sum" | "none",
        "sectionKey": "bollards",  # optional, can be derived from field
    }
    """
    field_path = condition.get("field", "")
    operator = condition.get("operator", "=")
    target_value = condition.get("value")
    array_mode = condition.get("arrayMode")

    # Check if this is a repeatable section field (contains dot notation)
    if "." in field_path:
        section_key, field_key = field_path.split(".", 1)
    elif condition.get("sectionKey"):
        section_key = condition.get("sectionKey")
        field_key = field_path
    else:
        section_key = None
        field_key = field_path

    # If it's a regular field (not a repeatable section)
    if not section_key or not array_mode:
        field_value = data.get(field_key)
        return evaluate_comparison(field_value, operator, target_value)

    # Handle repeatable section conditions
    rows = data.get(section_key, [])
    if not isinstance(rows, list):
        return False

    if array_mode == "any":
        # True if ANY row matches the condition
        for row in rows:
            field_value = row.get(field_key) if isinstance(row, dict) else None
            if evaluate_comparison(field_value, operator, target_value):
                return True
        return False

    elif array_mode == "all":
        # True if ALL rows match the condition
        if not rows:
            return False
        for row in rows:
            field_value = row.get(field_key) if isinstance(row, dict) else None
            if not evaluate_comparison(field_value, operator, target_value):
                return False
        return True

    elif array_mode == "none":
        # True if NO rows match the condition
        for row in rows:
            field_value = row.get(field_key) if isinstance(row, dict) else None
            if evaluate_comparison(field_value, operator, target_value):
                return False
        return True

    elif array_mode == "count":
        # Compare the count of rows against the target value
        count = len(rows)
        return evaluate_comparison(count, operator, target_value)

    elif array_mode == "sum":
        # Compare the sum of field values against the target value
        total = 0
        for row in rows:
            if isinstance(row, dict):
                val = row.get(field_key, 0)
                try:
                    total += float(val) if val else 0
                except (ValueError, TypeError):
                    pass
        return evaluate_comparison(total, operator, target_value)

    return False


def evaluate_conditions(conditions, data, logic="and"):
    """
    Evaluate multiple conditions with AND/OR logic.

    Args:
        conditions: List of condition objects
        data: Document data to evaluate against
        logic: "and" or "or"

    Returns:
        Boolean indicating if conditions are met
    """
    if not conditions:
        return True

    results = [evaluate_condition(c, data) for c in conditions]

    if logic == "or":
        return any(results)
    else:  # default to AND
        return all(results)


# ============== WORKFLOW GRAPH APIs (Visual Builder) ==============

def serialize_workflow_node(node):
    return {
        "id": str(node.id),
        "workflowId": str(node.workflow_id),
        "type": node.node_type,
        "label": node.label,
        "position": {"x": node.position_x, "y": node.position_y},
        "config": node.config,
        "linkedStateId": str(node.linked_state_id) if node.linked_state_id else None,
        "createdAt": node.created_at.isoformat(),
        "updatedAt": node.updated_at.isoformat(),
    }


def serialize_workflow_connection(conn):
    return {
        "id": str(conn.id),
        "workflowId": str(conn.workflow_id),
        "sourceNodeId": str(conn.source_node_id),
        "targetNodeId": str(conn.target_node_id),
        "sourceOutput": conn.source_output,
        "targetInput": conn.target_input,
        "label": conn.label,
        "conditionKey": conn.condition_key,
    }


@api_view(["GET"])
def workflow_graph(request, workflow_id):
    """Get complete workflow graph (nodes + connections)"""
    try:
        workflow = Workflow.objects.get(pk=workflow_id)
    except Workflow.DoesNotExist:
        return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

    nodes = WorkflowNode.objects.filter(workflow=workflow)
    connections = WorkflowConnection.objects.filter(workflow=workflow)

    return Response({
        "workflowId": str(workflow.id),
        "nodes": [serialize_workflow_node(n) for n in nodes],
        "connections": [serialize_workflow_connection(c) for c in connections],
    })


@api_view(["POST"])
def save_workflow_graph(request, workflow_id):
    """Save complete workflow graph (replace all nodes and connections)"""
    try:
        workflow = Workflow.objects.get(pk=workflow_id)
    except Workflow.DoesNotExist:
        return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

    with transaction.atomic():
        # Delete existing connections first (foreign key constraint)
        WorkflowConnection.objects.filter(workflow=workflow).delete()
        # Delete existing nodes
        WorkflowNode.objects.filter(workflow=workflow).delete()

        # Create node ID mapping (frontend ID -> database node)
        node_id_map = {}

        # Create nodes
        for node_data in request.data.get("nodes", []):
            frontend_id = node_data.get("id")

            # Handle linked state for approval/end nodes
            linked_state = None
            if node_data.get("linkedStateId"):
                try:
                    linked_state = WorkflowState.objects.get(pk=node_data["linkedStateId"])
                except WorkflowState.DoesNotExist:
                    pass

            node = WorkflowNode.objects.create(
                workflow=workflow,
                node_type=node_data.get("type", "approval"),
                label=node_data.get("label", ""),
                position_x=node_data.get("position", {}).get("x", 0),
                position_y=node_data.get("position", {}).get("y", 0),
                config=node_data.get("config", {}),
                linked_state=linked_state,
            )
            node_id_map[frontend_id] = node

        # Create connections
        for conn_data in request.data.get("connections", []):
            source_node = node_id_map.get(conn_data.get("sourceNodeId"))
            target_node = node_id_map.get(conn_data.get("targetNodeId"))

            if source_node and target_node:
                WorkflowConnection.objects.create(
                    workflow=workflow,
                    source_node=source_node,
                    target_node=target_node,
                    source_output=conn_data.get("sourceOutput", "output"),
                    target_input=conn_data.get("targetInput", "input"),
                    label=conn_data.get("label", ""),
                    condition_key=conn_data.get("conditionKey", ""),
                )

    # Return the saved graph
    nodes = WorkflowNode.objects.filter(workflow=workflow)
    connections = WorkflowConnection.objects.filter(workflow=workflow)

    return Response({
        "workflowId": str(workflow.id),
        "nodes": [serialize_workflow_node(n) for n in nodes],
        "connections": [serialize_workflow_connection(c) for c in connections],
    })


@api_view(["GET", "POST"])
def workflow_nodes_list(request, workflow_id):
    """List or create workflow nodes"""
    try:
        workflow = Workflow.objects.get(pk=workflow_id)
    except Workflow.DoesNotExist:
        return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        nodes = WorkflowNode.objects.filter(workflow=workflow)
        return Response([serialize_workflow_node(n) for n in nodes])

    elif request.method == "POST":
        node = WorkflowNode.objects.create(
            workflow=workflow,
            node_type=request.data.get("type", "approval"),
            label=request.data.get("label", ""),
            position_x=request.data.get("position", {}).get("x", 0),
            position_y=request.data.get("position", {}).get("y", 0),
            config=request.data.get("config", {}),
        )
        return Response(serialize_workflow_node(node), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def workflow_node_detail(request, pk):
    """Get, update, or delete a workflow node"""
    try:
        node = WorkflowNode.objects.get(pk=pk)
    except WorkflowNode.DoesNotExist:
        return Response({"error": "Node not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(serialize_workflow_node(node))

    elif request.method == "PUT":
        node.node_type = request.data.get("type", node.node_type)
        node.label = request.data.get("label", node.label)
        if "position" in request.data:
            node.position_x = request.data["position"].get("x", node.position_x)
            node.position_y = request.data["position"].get("y", node.position_y)
        node.config = request.data.get("config", node.config)
        node.save()
        return Response(serialize_workflow_node(node))

    elif request.method == "DELETE":
        node.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "POST"])
def workflow_connections_list(request, workflow_id):
    """List or create workflow connections"""
    try:
        workflow = Workflow.objects.get(pk=workflow_id)
    except Workflow.DoesNotExist:
        return Response({"error": "Workflow not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        connections = WorkflowConnection.objects.filter(workflow=workflow)
        return Response([serialize_workflow_connection(c) for c in connections])

    elif request.method == "POST":
        try:
            source_node = WorkflowNode.objects.get(pk=request.data.get("sourceNodeId"))
            target_node = WorkflowNode.objects.get(pk=request.data.get("targetNodeId"))
        except WorkflowNode.DoesNotExist:
            return Response({"error": "Node not found"}, status=status.HTTP_400_BAD_REQUEST)

        conn = WorkflowConnection.objects.create(
            workflow=workflow,
            source_node=source_node,
            target_node=target_node,
            source_output=request.data.get("sourceOutput", "output"),
            target_input=request.data.get("targetInput", "input"),
            label=request.data.get("label", ""),
            condition_key=request.data.get("conditionKey", ""),
        )
        return Response(serialize_workflow_connection(conn), status=status.HTTP_201_CREATED)


@api_view(["DELETE"])
def workflow_connection_detail(request, pk):
    """Delete a workflow connection"""
    try:
        conn = WorkflowConnection.objects.get(pk=pk)
    except WorkflowConnection.DoesNotExist:
        return Response({"error": "Connection not found"}, status=status.HTTP_404_NOT_FOUND)

    conn.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
