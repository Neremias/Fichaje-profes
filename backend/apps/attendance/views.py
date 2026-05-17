import ipaddress
import math
import io
from datetime import date

import qrcode
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.models import Institution
from apps.users.permissions import IsAdminUser, IsTeacher
from apps.schedules.models import Schedule, Classroom
from .models import AttendanceRecord, AllowedNetwork, AllowedZone
from .serializers import (
    AttendanceRecordSerializer,
    CheckInSerializer,
    ValidateLocationSerializer,
    AllowedNetworkSerializer,
    AllowedZoneSerializer,
)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlambda = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def validate_ip(ip_str, institution):
    try:
        ip = ipaddress.ip_address(ip_str)
        for network in institution.allowed_networks.all():
            if ip in ipaddress.ip_network(network.cidr, strict=False):
                return True
    except ValueError:
        pass
    return False


def validate_gps(lat, lon, institution):
    if lat is None or lon is None:
        return False
    for zone in institution.allowed_zones.all():
        dist = haversine_distance(lat, lon, float(zone.gps_latitude), float(zone.gps_longitude))
        if dist <= zone.radius_meters:
            return True
    return False


class CheckInView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        teacher = request.user

        try:
            institution = Institution.objects.get(slug=data['institution_slug'])
        except Institution.DoesNotExist:
            return Response({'detail': 'Institución no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        if teacher.institution and teacher.institution != institution:
            return Response(
                {'detail': 'No pertenece a esta institución.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.localdate()
        now_time = timezone.localtime().time()
        dow = today.weekday()

        schedule = Schedule.objects.filter(
            teacher=teacher,
            day_of_week=dow,
            is_active=True,
            valid_from__lte=today,
            valid_until__gte=today,
            start_time__lte=now_time,
            end_time__gte=now_time,
        ).first()

        classroom_name = ''
        if data.get('classroom_id'):
            try:
                classroom = Classroom.objects.get(pk=data['classroom_id'], institution=institution)
                classroom_name = classroom.name
            except Classroom.DoesNotExist:
                classroom_name = f'Aula #{data["classroom_id"]}'
        elif schedule:
            classroom_name = schedule.classroom.name

        if not classroom_name:
            classroom_name = 'Sin aula'

        if schedule:
            existing = AttendanceRecord.objects.filter(
                teacher=teacher,
                schedule=schedule,
                date=today,
            ).first()
            if existing:
                return Response(
                    {
                        'detail': 'Ya registró asistencia para este horario hoy.',
                        'record': AttendanceRecordSerializer(existing).data,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        ip_str = get_client_ip(request)
        gps_lat = data.get('gps_latitude')
        gps_lon = data.get('gps_longitude')

        gps_valid = validate_gps(gps_lat, gps_lon, institution)
        network_valid = validate_ip(ip_str, institution)

        record = AttendanceRecord.objects.create(
            teacher=teacher,
            schedule=schedule,
            classroom_name=classroom_name,
            date=today,
            gps_latitude=gps_lat,
            gps_longitude=gps_lon,
            ip_address=ip_str or None,
            gps_valid=gps_valid,
            network_valid=network_valid,
            institution=institution,
            notes=data.get('notes', ''),
        )

        return Response(
            {
                'detail': 'Asistencia registrada correctamente.',
                'record': AttendanceRecordSerializer(record).data,
                'warnings': {
                    'gps_invalid': not gps_valid,
                    'network_invalid': not network_valid,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ValidateLocationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ValidateLocationSerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            institution = Institution.objects.get(slug=data['institution_slug'])
        except Institution.DoesNotExist:
            return Response({'detail': 'Institución no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        ip_str = get_client_ip(request)
        gps_lat = data.get('gps_latitude')
        gps_lon = data.get('gps_longitude')

        gps_valid = validate_gps(gps_lat, gps_lon, institution)
        network_valid = validate_ip(ip_str, institution)

        return Response({
            'gps_valid': gps_valid,
            'network_valid': network_valid,
            'ip_address': ip_str,
            'can_check_in': gps_valid or network_valid,
        })


class AttendanceRecordListView(generics.ListAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date', 'teacher', 'institution', 'gps_valid', 'network_valid']
    ordering_fields = ['date', 'checked_in_at']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        qs = AttendanceRecord.objects.select_related('teacher', 'schedule', 'institution')
        if user.role == 'teacher':
            return qs.filter(teacher=user)
        return qs.all()


class TodaySummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        dow = today.weekday()

        institution_slug = request.query_params.get('institution')

        scheduled_qs = Schedule.objects.filter(
            day_of_week=dow,
            is_active=True,
            valid_from__lte=today,
            valid_until__gte=today,
        ).select_related('teacher', 'subject', 'classroom')

        if institution_slug:
            scheduled_qs = scheduled_qs.filter(subject__institution__slug=institution_slug)

        results = []
        for schedule in scheduled_qs:
            record = AttendanceRecord.objects.filter(
                teacher=schedule.teacher,
                schedule=schedule,
                date=today,
            ).first()
            results.append({
                'teacher': f"{schedule.teacher.get_full_name()}",
                'teacher_id': schedule.teacher.id,
                'subject': schedule.subject.name,
                'classroom': schedule.classroom.name,
                'start_time': schedule.start_time.strftime('%H:%M'),
                'end_time': schedule.end_time.strftime('%H:%M'),
                'present': record is not None,
                'checked_in_at': record.checked_in_at.isoformat() if record else None,
                'gps_valid': record.gps_valid if record else None,
                'network_valid': record.network_valid if record else None,
            })

        return Response({
            'date': today.isoformat(),
            'total_scheduled': len(results),
            'total_present': sum(1 for r in results if r['present']),
            'records': results,
        })


class QRCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, institution_slug):
        try:
            institution = Institution.objects.get(slug=institution_slug)
        except Institution.DoesNotExist:
            return Response({'detail': 'Institución no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        base_url = request.build_absolute_uri('/').rstrip('/')
        qr_data = f"{base_url}/check-in?institution={institution_slug}"

        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type='image/png')


class AllowedNetworkListCreateView(generics.ListCreateAPIView):
    serializer_class = AllowedNetworkSerializer

    def get_queryset(self):
        return AllowedNetwork.objects.select_related('institution').all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class AllowedNetworkDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AllowedNetwork.objects.all()
    serializer_class = AllowedNetworkSerializer
    permission_classes = [IsAdminUser]


class AllowedZoneListCreateView(generics.ListCreateAPIView):
    serializer_class = AllowedZoneSerializer

    def get_queryset(self):
        return AllowedZone.objects.select_related('institution').all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]


class AllowedZoneDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AllowedZone.objects.all()
    serializer_class = AllowedZoneSerializer
    permission_classes = [IsAdminUser]
