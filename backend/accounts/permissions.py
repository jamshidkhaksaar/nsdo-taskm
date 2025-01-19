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
