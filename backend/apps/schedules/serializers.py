from rest_framework import serializers
from .models import Subject, Classroom, Schedule
from apps.users.serializers import UserSerializer, InstitutionSerializer


class SubjectSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'career', 'institution', 'institution_name']


class ClassroomSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True)

    class Meta:
        model = Classroom
        fields = [
            'id', 'name', 'building', 'institution', 'institution_name',
            'gps_latitude', 'gps_longitude', 'gps_radius_meters',
        ]


class ScheduleSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = Schedule
        fields = [
            'id', 'teacher', 'teacher_name', 'subject', 'subject_name',
            'classroom', 'classroom_name', 'day_of_week', 'day_of_week_display',
            'start_time', 'end_time', 'is_active', 'valid_from', 'valid_until',
        ]

    def validate(self, data):
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError('La hora de inicio debe ser anterior a la hora de fin.')
        if data.get('valid_from') and data.get('valid_until'):
            if data['valid_from'] > data['valid_until']:
                raise serializers.ValidationError('La fecha de inicio debe ser anterior a la fecha de fin.')
        return data
