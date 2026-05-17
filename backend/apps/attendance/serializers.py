from rest_framework import serializers
from .models import AttendanceRecord, AllowedNetwork, AllowedZone
from apps.users.serializers import UserSerializer


class AllowedNetworkSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedNetwork
        fields = ['id', 'institution', 'cidr', 'description']


class AllowedZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedZone
        fields = ['id', 'institution', 'name', 'gps_latitude', 'gps_longitude', 'radius_meters']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    institution_name = serializers.CharField(source='institution.name', read_only=True)
    subject_name = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'teacher', 'teacher_name', 'schedule', 'classroom_name',
            'date', 'checked_in_at', 'gps_latitude', 'gps_longitude',
            'ip_address', 'gps_valid', 'network_valid', 'institution',
            'institution_name', 'subject_name', 'notes',
        ]
        read_only_fields = ['checked_in_at', 'gps_valid', 'network_valid', 'ip_address']

    def get_subject_name(self, obj):
        if obj.schedule:
            return obj.schedule.subject.name
        return None


class CheckInSerializer(serializers.Serializer):
    institution_slug = serializers.SlugField()
    classroom_id = serializers.IntegerField(required=False, allow_null=True)
    gps_latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    gps_longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class ValidateLocationSerializer(serializers.Serializer):
    institution_slug = serializers.SlugField()
    gps_latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    gps_longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
