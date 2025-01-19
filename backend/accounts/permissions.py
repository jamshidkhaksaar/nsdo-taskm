from rest_framework import permissions

class IsAdminOrOwner(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.is_staff or 
                request.user.department is not None
            )
        )

    def has_object_permission(self, request, view, obj):
        # Allow access if user is admin or owner of the task
        return (
            request.user.is_staff or
            obj.created_by == request.user or
            (obj.assigned_to and request.user.id in obj.assigned_to)
        )

class TaskPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow authenticated users to access tasks
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user_id = str(request.user.id)
        # Allow access if user is:
        # 1. The creator of the task
        # 2. Assigned to the task
        # 3. A staff member
        return (
            request.user.is_staff or
            obj.created_by == request.user or
            (obj.assigned_to and user_id in obj.assigned_to)
        )
