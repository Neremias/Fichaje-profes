from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from .models import Subject, Classroom, Schedule
from .serializers import SubjectSerializer, ClassroomSerializer, ScheduleSerializer
from apps.users.permissions import IsAdminUser, IsAdminOrReadOwn


class SubjectListCreateView(generics.ListCreateAPIView):
    serializer_class = SubjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['institution']
    search_fields = ['name', 'code', 'career']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Subject.objects.select_related('institution').all()
        if user.institution:
            return Subject.objects.filter(institution=user.institution)
        return Subject.objects.none()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.select_related('institution').all()
    serializer_class = SubjectSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class ClassroomListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassroomSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['institution']
    search_fields = ['name', 'building']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Classroom.objects.select_related('institution').all()
        if user.institution:
            return Classroom.objects.filter(institution=user.institution)
        return Classroom.objects.none()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Classroom.objects.select_related('institution').all()
    serializer_class = ClassroomSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class ScheduleListCreateView(generics.ListCreateAPIView):
    serializer_class = ScheduleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['teacher', 'subject', 'classroom', 'day_of_week', 'is_active']
    search_fields = ['teacher__first_name', 'teacher__last_name', 'subject__name']

    def get_queryset(self):
        user = self.request.user
        qs = Schedule.objects.select_related('teacher', 'subject', 'classroom')
        if user.role == 'teacher':
            return qs.filter(teacher=user)
        return qs.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class ScheduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Schedule.objects.select_related('teacher', 'subject', 'classroom').all()
    serializer_class = ScheduleSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]
