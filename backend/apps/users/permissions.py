from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access to users with a Usuario profile or is_staff."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_staff or hasattr(request.user, 'usuario')


class IsTeacher(BasePermission):
    """Allow access only to users with a Docente profile."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return hasattr(request.user, 'docente')


class IsAdminOrReadOwn(BasePermission):
    """Admins can do anything. Teachers can only read/write their own data."""

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or hasattr(request.user, 'usuario'):
            return True
        if hasattr(obj, 'docente') and hasattr(request.user, 'docente'):
            return obj.docente == request.user.docente
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
