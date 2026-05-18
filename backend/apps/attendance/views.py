import ipaddress
import math
from datetime import date

from django.utils import timezone
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.users.permissions import IsAdminUser, IsTeacher
from apps.schedules.models import SlotHorario
from apps.reports.models import Configuracion
from .models import RegistroAsistencia, SolicitudEmergencia, EventoCalendario
from .serializers import (
    RegistroAsistenciaSerializer,
    SolicitudEmergenciaSerializer,
    SolicitudRevisionSerializer,
    EventoCalendarioSerializer,
    FicharSerializer,
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


def validate_gps(lat, lon, config):
    if lat is None or lon is None:
        return False
    if config.campus_latitud is None or config.campus_longitud is None:
        return False
    dist = haversine_distance(lat, lon, float(config.campus_latitud), float(config.campus_longitud))
    return dist <= (config.campus_radio_metros or 200)


def validate_wifi(ip_str, config):
    if not ip_str or not config.red_wifi_campus:
        return False
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip in ipaddress.ip_network(config.red_wifi_campus, strict=False)
    except ValueError:
        return False


def compute_ubicacion_validada(lat, lon, ip_str, config):
    method = config.metodo_validacion_ubicacion
    gps_ok = validate_gps(lat, lon, config)
    wifi_ok = validate_wifi(ip_str, config)
    if method == Configuracion.MetodoValidacionChoices.SOLO_GPS:
        return gps_ok
    if method == Configuracion.MetodoValidacionChoices.SOLO_WIFI:
        return wifi_ok
    return gps_ok or wifi_ok


def get_dia_semana_str(weekday_int):
    mapping = {0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves', 4: 'viernes', 5: 'sabado'}
    return mapping.get(weekday_int)


class FicharView(APIView):
    permission_classes = [IsTeacher]

    def post(self, request):
        serializer = FicharSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        docente = request.user.docente
        today = timezone.localdate()
        now_time = timezone.localtime().time()
        dia_str = get_dia_semana_str(today.weekday())

        slot = SlotHorario.objects.filter(
            materia__asignaciones__docente=docente,
            materia__asignaciones__activa=True,
            dia_semana=dia_str,
            hora_inicio__lte=now_time,
            hora_fin__gte=now_time,
        ).first()

        if not slot:
            return Response(
                {'detail': 'No tiene ningún slot horario activo en este momento.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        existing = RegistroAsistencia.objects.filter(
            docente=docente, slot_horario=slot, fecha=today
        ).first()
        if existing:
            return Response(
                {
                    'detail': 'Ya registró asistencia para este slot hoy.',
                    'registro': RegistroAsistenciaSerializer(existing).data,
                },
                status=status.HTTP_409_CONFLICT,
            )

        ip_str = get_client_ip(request)
        lat = data.get('latitud')
        lon = data.get('longitud')
        config = Configuracion.get_solo()
        ubicacion_validada = compute_ubicacion_validada(lat, lon, ip_str, config)

        solicitud = None
        sol_id = data.get('solicitud_emergencia_id')
        if sol_id:
            try:
                solicitud = SolicitudEmergencia.objects.get(
                    pk=sol_id, docente=docente, estado='aprobada'
                )
            except SolicitudEmergencia.DoesNotExist:
                pass

        registro = RegistroAsistencia.objects.create(
            docente=docente,
            slot_horario=slot,
            fecha=today,
            anio=today.year,
            tipo_clase=data['tipo_clase'],
            hora_entrada=timezone.now(),
            ubicacion_validada=ubicacion_validada,
            latitud_registrada=lat,
            longitud_registrada=lon,
            ip_registrada=ip_str or None,
            solicitud_emergencia=solicitud,
            nota=data.get('nota', ''),
        )

        return Response(
            {
                'detail': 'Asistencia registrada correctamente.',
                'registro': RegistroAsistenciaSerializer(registro).data,
                'ubicacion_validada': ubicacion_validada,
            },
            status=status.HTTP_201_CREATED,
        )


class DashboardHoyView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        dia_str = get_dia_semana_str(today.weekday())

        slots = SlotHorario.objects.filter(dia_semana=dia_str).select_related('materia')
        results = []
        for slot in slots:
            asignaciones = slot.materia.asignaciones.filter(activa=True).select_related('docente__user')
            for asig in asignaciones:
                registro = RegistroAsistencia.objects.filter(
                    docente=asig.docente, slot_horario=slot, fecha=today
                ).first()
                results.append({
                    'docente': str(asig.docente),
                    'docente_id': asig.docente.id,
                    'materia': slot.materia.nombre,
                    'slot_id': slot.id,
                    'hora_inicio': slot.hora_inicio.strftime('%H:%M'),
                    'hora_fin': slot.hora_fin.strftime('%H:%M'),
                    'presente': registro is not None,
                    'hora_entrada': registro.hora_entrada.isoformat() if registro and registro.hora_entrada else None,
                    'ubicacion_validada': registro.ubicacion_validada if registro else None,
                })

        return Response({
            'fecha': today.isoformat(),
            'total_slots': len(results),
            'total_presentes': sum(1 for r in results if r['presente']),
            'registros': results,
        })


class RegistroAsistenciaListView(generics.ListAPIView):
    serializer_class = RegistroAsistenciaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['fecha', 'tipo_clase', 'ubicacion_validada']
    ordering_fields = ['fecha', 'hora_entrada']
    ordering = ['-fecha']

    def get_queryset(self):
        user = self.request.user
        qs = RegistroAsistencia.objects.select_related('docente__user', 'slot_horario__materia')
        if hasattr(user, 'docente'):
            return qs.filter(docente=user.docente)
        return qs.all()


class SolicitudEmergenciaListCreateView(generics.ListCreateAPIView):
    serializer_class = SolicitudEmergenciaSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SolicitudEmergencia.objects.select_related('docente__user', 'slot_horario')
        if hasattr(user, 'docente'):
            return qs.filter(docente=user.docente)
        return qs.all()

    def perform_create(self, serializer):
        docente = self.request.user.docente
        serializer.save(docente=docente)


class SolicitudEmergenciaRevisarView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            solicitud = SolicitudEmergencia.objects.get(pk=pk)
        except SolicitudEmergencia.DoesNotExist:
            return Response({'detail': 'No encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SolicitudRevisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        solicitud.estado = data['estado']
        solicitud.nota_secretaria = data.get('nota_secretaria', '')
        solicitud.revisado_por = request.user
        solicitud.revisado_en = timezone.now()
        solicitud.save()

        return Response(SolicitudEmergenciaSerializer(solicitud).data)


class EventoCalendarioListCreateView(generics.ListCreateAPIView):
    queryset = EventoCalendario.objects.all()
    serializer_class = EventoCalendarioSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['fecha']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
