from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    LogoutView,
    MeView,
    DocenteListCreateView,
    DocenteDetailView,
    UsuarioListCreateView,
    UsuarioDetailView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('docentes/', DocenteListCreateView.as_view(), name='docente-list'),
    path('docentes/<int:pk>/', DocenteDetailView.as_view(), name='docente-detail'),
    path('usuarios/', UsuarioListCreateView.as_view(), name='usuario-list'),
    path('usuarios/<int:pk>/', UsuarioDetailView.as_view(), name='usuario-detail'),
]
