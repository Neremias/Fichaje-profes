from django.urls import path
from .views import (
    FicharView,
    SlotActualView,
    DashboardHoyView,
    RegistroAsistenciaListView,
    SolicitudEmergenciaListCreateView,
    SolicitudEmergenciaRevisarView,
    EventoCalendarioListCreateView,
    EventoCalendarioDetailView,
)

urlpatterns = [
    path('asistencia/fichar/', FicharView.as_view(), name='fichar'),
    path('asistencia/slot-actual/', SlotActualView.as_view(), name='slot-actual'),
    path('asistencia/dashboard/', DashboardHoyView.as_view(), name='dashboard-hoy'),
    path('asistencia/registros/', RegistroAsistenciaListView.as_view(), name='registro-list'),
    path('asistencia/solicitudes/', SolicitudEmergenciaListCreateView.as_view(), name='solicitud-list'),
    path('asistencia/solicitudes/<int:pk>/revisar/', SolicitudEmergenciaRevisarView.as_view(), name='solicitud-revisar'),
    path('calendario/', EventoCalendarioListCreateView.as_view(), name='calendario-list'),
    path('calendario/<int:pk>/', EventoCalendarioDetailView.as_view(), name='calendario-detail'),
]
