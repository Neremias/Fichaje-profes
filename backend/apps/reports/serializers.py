from rest_framework import serializers


class AbsenceReportRowSerializer(serializers.Serializer):
    date = serializers.DateField()
    subject = serializers.CharField()
    classroom = serializers.CharField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    present = serializers.BooleanField()
    checked_in_at = serializers.DateTimeField(allow_null=True)
    gps_valid = serializers.BooleanField(allow_null=True)
    network_valid = serializers.BooleanField(allow_null=True)


class AttendanceSummarySerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField()
    teacher_name = serializers.CharField()
    total_scheduled = serializers.IntegerField()
    total_present = serializers.IntegerField()
    total_absent = serializers.IntegerField()
    attendance_rate = serializers.FloatField()
