from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and (request.user.is_staff or getattr(request.user, 'profile', None) and request.user.profile.is_admin)

class IsOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Admin override
        if request.user.is_staff or (getattr(request.user, 'profile', None) and request.user.profile.is_admin):
            return True
        
        # Check if object has user or creator attribute
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'creator'):
            return obj.creator == request.user
        return False
