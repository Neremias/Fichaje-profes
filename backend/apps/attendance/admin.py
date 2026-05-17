from django.contrib import admin
from .models import AttendanceRecord, AllowedNetwork, AllowedZone


@admin.register(AllowedNetwork)
class AllowedNetworkAdmin(admin.ModelAdmin):
    list_display = ['institution', 'cidr', 'description']
    list_filter = ['institution']


@admin.register(AllowedZone)
class AllowedZoneAdmin(admin.ModelAdmin):
    list_display = ['institution', 'name', 'gps_latitude', 'gps_longitude', 'radius_meters']
    list_filter = ['institution']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = [
        'teacher', 'date', 'classroom_name', 'checked_in_at',
        'gps_valid', 'network_valid', 'institution',
    ]
    list_filter = ['date', 'gps_valid', 'network_valid', 'institution']
    search_fields = ['teacher__username', 'teacher__first_name', 'teacher__last_name', 'classroom_name']
    date_hierarchy = 'date'
    raw_id_fields = ['teacher', 'schedule']
