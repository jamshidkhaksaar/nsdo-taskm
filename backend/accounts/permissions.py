from rest_framework import permissions

class IsDepartmentAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
            
        # Check if user is admin of any department
        return request.user.departments.filter(is_admin=True).exists()
