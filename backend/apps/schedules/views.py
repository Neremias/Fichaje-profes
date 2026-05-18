from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Carrera, Materia, MateriaCarrera, SlotHorario, AsignacionDocente
from .serializers import (
    CarreraSerializer,
    MateriaSerializer,
    MateriaCarreraSerializer,
    SlotHorarioSerializer,
    AsignacionDocenteSerializer,
)
from apps.users.permissions import IsAdminUser


class CarreraListCreateView(generics.ListCreateAPIView):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['institucion']
    search_fields = ['nombre', 'codigo']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class CarreraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Carrera.objects.all()
    serializer_class = CarreraSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class MateriaListCreateView(generics.ListCreateAPIView):
    serializer_class = MateriaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activa', 'anio']
    search_fields = ['nombre', 'codigo_siu']

    def get_queryset(self):
        return Materia.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class MateriaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Materia.objects.all()
    serializer_class = MateriaSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class MateriaCarreraListCreateView(generics.ListCreateAPIView):
    queryset = MateriaCarrera.objects.select_related('materia', 'carrera').all()
    serializer_class = MateriaCarreraSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['materia', 'carrera']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class MateriaCarreraDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MateriaCarrera.objects.select_related('materia', 'carrera').all()
    serializer_class = MateriaCarreraSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class SlotHorarioListCreateView(generics.ListCreateAPIView):
    queryset = SlotHorario.objects.select_related('materia').all()
    serializer_class = SlotHorarioSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['materia', 'dia_semana']
    search_fields = ['materia__nombre']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class SlotHorarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SlotHorario.objects.select_related('materia').all()
    serializer_class = SlotHorarioSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class AsignacionDocenteListCreateView(generics.ListCreateAPIView):
    serializer_class = AsignacionDocenteSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['docente', 'materia', 'rol', 'activa']
    search_fields = ['docente__user__first_name', 'docente__user__last_name', 'materia__nombre']

    def get_queryset(self):
        user = self.request.user
        qs = AsignacionDocente.objects.select_related('docente__user', 'materia')
        if hasattr(user, 'docente'):
            return qs.filter(docente=user.docente)
        return qs.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class AsignacionDocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AsignacionDocente.objects.select_related('docente__user', 'materia').all()
    serializer_class = AsignacionDocenteSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]
