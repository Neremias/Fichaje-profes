from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
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
    serializer_class = CarreraSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['institucion', 'activo']
    search_fields = ['nombre', 'codigo']

    def get_queryset(self):
        mostrar_inactivos = self.request.query_params.get('activo', 'true').lower() == 'false'
        if mostrar_inactivos:
            return Carrera.objects.all()
        return Carrera.objects.filter(activo=True)

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

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save(update_fields=['activo'])

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=204)


class MateriaListCreateView(generics.ListCreateAPIView):
    serializer_class = MateriaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['activa', 'anio']
    search_fields = ['nombre', 'codigo_siu']

    def get_queryset(self):
        mostrar_inactivos = self.request.query_params.get('activa', 'true').lower() == 'false'
        if mostrar_inactivos:
            return Materia.objects.all()
        return Materia.objects.filter(activa=True)

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

    def perform_destroy(self, instance):
        instance.activa = False
        instance.save(update_fields=['activa'])

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=204)


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
    serializer_class = SlotHorarioSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['materia', 'dia_semana', 'activo']
    search_fields = ['materia__nombre']

    def get_queryset(self):
        mostrar_inactivos = self.request.query_params.get('activo', 'true').lower() == 'false'
        qs = SlotHorario.objects.select_related('materia')
        if mostrar_inactivos:
            return qs.all()
        return qs.filter(activo=True)

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

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save(update_fields=['activo'])

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=204)


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
