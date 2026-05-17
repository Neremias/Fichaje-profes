from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Allow access only to users with role='admin'."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsTeacher(BasePermission):
    """Allow access only to users with role='teacher'."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == 'teacher'
        )


class IsAdminOrReadOwn(BasePermission):
    """
    Admins can do anything.
    Teachers can only read/write their own data.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'teacher'):
            return obj.teacher == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return obj == request.user
