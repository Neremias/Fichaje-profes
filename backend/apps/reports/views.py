import csv
import io
from datetime import date, timedelta, datetime

from django.http import HttpResponse
from django.utils import timezone
from openpyxl import Workbook
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.permissions import IsAdminUser
from apps.schedules.models import SlotHorario
from apps.attendance.models import RegistroAsistencia
from .models import Configuracion
from .serializers import ConfiguracionSerializer


def parse_date(value, fallback):
    if value:
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            pass
    return fallback


def get_dia_semana_str(weekday_int):
    mapping = {0: 'lunes', 1: 'martes', 2: 'miercoles', 3: 'jueves', 4: 'viernes', 5: 'sabado'}
    return mapping.get(weekday_int)


def get_absence_report(docente, start_date, end_date):
    results = []
    current = start_date
    while current <= end_date:
        dia_str = get_dia_semana_str(current.weekday())
        if dia_str is None:
            current += timedelta(days=1)
            continue
        slots = SlotHorario.objects.filter(
            dia_semana=dia_str,
            materia__asignaciones__docente=docente,
            materia__asignaciones__activa=True,
        ).select_related('materia')
        for slot in slots:
            registro = RegistroAsistencia.objects.filter(
                docente=docente, slot_horario=slot, fecha=current
            ).first()
            results.append({
                'fecha': current,
                'materia': slot.materia.nombre,
                'hora_inicio': slot.hora_inicio,
                'hora_fin': slot.hora_fin,
                'presente': registro is not None,
                'hora_entrada': registro.hora_entrada if registro else None,
                'ubicacion_validada': registro.ubicacion_validada if registro else None,
                'tipo_clase': registro.get_tipo_clase_display() if registro else None,
            })
        current += timedelta(days=1)
    return results


class ConfiguracionView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        config = Configuracion.get_solo()
        return Response(ConfiguracionSerializer(config).data)

    def patch(self, request):
        config = Configuracion.get_solo()
        serializer = ConfiguracionSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(actualizado_por=request.user)
        return Response(serializer.data)


class ResumenReporteView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()
        start = parse_date(request.query_params.get('desde'), today.replace(day=1))
        end = parse_date(request.query_params.get('hasta'), today)

        if start > end:
            return Response(
                {'detail': 'La fecha de inicio debe ser anterior a la fecha de fin.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from apps.users.models import Docente
        docentes = Docente.objects.filter(activo=True).select_related('user')

        summary = []
        for docente in docentes:
            rows = get_absence_report(docente, start, end)
            total = len(rows)
            present = sum(1 for r in rows if r['presente'])
            summary.append({
                'docente_id': docente.id,
                'docente_nombre': str(docente),
                'total_programado': total,
                'total_presente': present,
                'total_ausente': total - present,
                'tasa_asistencia': round(present / total * 100, 2) if total else 0.0,
            })

        return Response({
            'desde': start.isoformat(),
            'hasta': end.isoformat(),
            'resultados': summary,
        })


class ExportarReporteView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()
        start = parse_date(request.query_params.get('desde'), today.replace(day=1))
        end = parse_date(request.query_params.get('hasta'), today)
        fmt = request.query_params.get('formato', 'csv').lower()

        from apps.users.models import Docente
        docentes = Docente.objects.filter(activo=True).select_related('user')

        rows = []
        for docente in docentes:
            for row in get_absence_report(docente, start, end):
                rows.append({
                    'Docente': str(docente),
                    'Fecha': row['fecha'].isoformat(),
                    'Materia': row['materia'],
                    'Hora inicio': str(row['hora_inicio']),
                    'Hora fin': str(row['hora_fin']),
                    'Presente': 'Sí' if row['presente'] else 'No',
                    'Hora entrada': row['hora_entrada'].isoformat() if row['hora_entrada'] else '',
                    'Ubicación validada': str(row['ubicacion_validada']) if row['ubicacion_validada'] is not None else '',
                    'Tipo clase': row['tipo_clase'] or '',
                })

        filename = f"asistencia_{start}_{end}"

        if fmt == 'xlsx':
            wb = Workbook()
            ws = wb.active
            ws.title = 'Asistencia'
            if rows:
                ws.append(list(rows[0].keys()))
                for row in rows:
                    ws.append(list(row.values()))
            buffer = io.BytesIO()
            wb.save(buffer)
            buffer.seek(0)
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
            return response

        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
        return response
