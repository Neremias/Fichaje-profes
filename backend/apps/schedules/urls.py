from django.urls import path
from .views import (
    CarreraListCreateView,
    CarreraDetailView,
    MateriaListCreateView,
    MateriaDetailView,
    MateriaCarreraListCreateView,
    MateriaCarreraDetailView,
    SlotHorarioListCreateView,
    SlotHorarioDetailView,
    AsignacionDocenteListCreateView,
    AsignacionDocenteDetailView,
)

urlpatterns = [
    path('carreras/', CarreraListCreateView.as_view(), name='carrera-list'),
    path('carreras/<int:pk>/', CarreraDetailView.as_view(), name='carrera-detail'),
    path('materias/', MateriaListCreateView.as_view(), name='materia-list'),
    path('materias/<int:pk>/', MateriaDetailView.as_view(), name='materia-detail'),
    path('materia-carrera/', MateriaCarreraListCreateView.as_view(), name='materiacarrera-list'),
    path('materia-carrera/<int:pk>/', MateriaCarreraDetailView.as_view(), name='materiacarrera-detail'),
    path('slots/', SlotHorarioListCreateView.as_view(), name='slot-list'),
    path('slots/<int:pk>/', SlotHorarioDetailView.as_view(), name='slot-detail'),
    path('asignaciones/', AsignacionDocenteListCreateView.as_view(), name='asignacion-list'),
    path('asignaciones/<int:pk>/', AsignacionDocenteDetailView.as_view(), name='asignacion-detail'),
]
