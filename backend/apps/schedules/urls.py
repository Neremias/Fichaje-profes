from django.urls import path
from .views import (
    SubjectListCreateView,
    SubjectDetailView,
    ClassroomListCreateView,
    ClassroomDetailView,
    ScheduleListCreateView,
    ScheduleDetailView,
)

urlpatterns = [
    path('schedules/', ScheduleListCreateView.as_view(), name='schedule-list'),
    path('schedules/<int:pk>/', ScheduleDetailView.as_view(), name='schedule-detail'),
    path('subjects/', SubjectListCreateView.as_view(), name='subject-list'),
    path('subjects/<int:pk>/', SubjectDetailView.as_view(), name='subject-detail'),
    path('classrooms/', ClassroomListCreateView.as_view(), name='classroom-list'),
    path('classrooms/<int:pk>/', ClassroomDetailView.as_view(), name='classroom-detail'),
]
