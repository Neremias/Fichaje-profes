from django.contrib import admin
from .models import Subject, Classroom, Schedule


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'career', 'institution']
    list_filter = ['institution']
    search_fields = ['name', 'code', 'career']


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ['name', 'building', 'institution', 'gps_latitude', 'gps_longitude', 'gps_radius_meters']
    list_filter = ['institution']
    search_fields = ['name', 'building']


@admin.register(Schedule)
class ScheduleAdmin(admin.ModelAdmin):
    list_display = ['teacher', 'subject', 'classroom', 'day_of_week', 'start_time', 'end_time', 'is_active', 'valid_from', 'valid_until']
    list_filter = ['day_of_week', 'is_active', 'subject__institution']
    search_fields = ['teacher__username', 'teacher__first_name', 'teacher__last_name', 'subject__name']
    raw_id_fields = ['teacher', 'subject', 'classroom']
