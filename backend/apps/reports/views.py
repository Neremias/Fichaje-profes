import csv
import io
from datetime import date, timedelta, datetime

from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from apps.users.models import User
from apps.users.permissions import IsAdminUser
from apps.schedules.models import Schedule
from apps.attendance.models import AttendanceRecord


def get_absence_report(teacher, start_date, end_date):
    results = []
    current = start_date
    while current <= end_date:
        dow = current.weekday()
        schedules = Schedule.objects.filter(
            teacher=teacher,
            day_of_week=dow,
            is_active=True,
            valid_from__lte=current,
            valid_until__gte=current,
        ).select_related('subject', 'classroom')
        for schedule in schedules:
            record = AttendanceRecord.objects.filter(
                teacher=teacher,
                schedule=schedule,
                date=current,
            ).first()
            results.append({
                'date': current,
                'subject': schedule.subject.name,
                'classroom': schedule.classroom.name,
                'start_time': schedule.start_time,
                'end_time': schedule.end_time,
                'present': record is not None,
                'checked_in_at': record.checked_in_at if record else None,
                'gps_valid': record.gps_valid if record else None,
                'network_valid': record.network_valid if record else None,
            })
        current += timedelta(days=1)
    return results


def parse_date(value, fallback):
    if value:
        try:
            return datetime.strptime(value, '%Y-%m-%d').date()
        except ValueError:
            pass
    return fallback


class AttendanceSummaryView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()
        start = parse_date(request.query_params.get('start'), today.replace(day=1))
        end = parse_date(request.query_params.get('end'), today)

        if start > end:
            return Response({'detail': 'La fecha de inicio debe ser anterior a la fecha de fin.'}, status=status.HTTP_400_BAD_REQUEST)

        institution_slug = request.query_params.get('institution')
        teachers_qs = User.objects.filter(role='teacher', is_active=True)
        if institution_slug:
            teachers_qs = teachers_qs.filter(institution__slug=institution_slug)

        summary = []
        for teacher in teachers_qs:
            rows = get_absence_report(teacher, start, end)
            total = len(rows)
            present = sum(1 for r in rows if r['present'])
            summary.append({
                'teacher_id': teacher.id,
                'teacher_name': teacher.get_full_name() or teacher.username,
                'total_scheduled': total,
                'total_present': present,
                'total_absent': total - present,
                'attendance_rate': round(present / total * 100, 2) if total else 0.0,
            })

        return Response({
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'results': summary,
        })


class AbsenceReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()
        start = parse_date(request.query_params.get('start'), today.replace(day=1))
        end = parse_date(request.query_params.get('end'), today)

        if start > end:
            return Response({'detail': 'La fecha de inicio debe ser anterior a la fecha de fin.'}, status=status.HTTP_400_BAD_REQUEST)

        teacher_id = request.query_params.get('teacher_id')
        institution_slug = request.query_params.get('institution')

        teachers_qs = User.objects.filter(role='teacher', is_active=True)
        if teacher_id:
            teachers_qs = teachers_qs.filter(pk=teacher_id)
        if institution_slug:
            teachers_qs = teachers_qs.filter(institution__slug=institution_slug)

        report = []
        for teacher in teachers_qs:
            rows = get_absence_report(teacher, start, end)
            for row in rows:
                report.append({
                    'teacher_id': teacher.id,
                    'teacher_name': teacher.get_full_name() or teacher.username,
                    **{k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in row.items()},
                })

        return Response({
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'results': report,
        })


class ExportReportView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = date.today()
        start = parse_date(request.query_params.get('start'), today.replace(day=1))
        end = parse_date(request.query_params.get('end'), today)
        fmt = request.query_params.get('format', 'csv').lower()
        institution_slug = request.query_params.get('institution')

        teachers_qs = User.objects.filter(role='teacher', is_active=True)
        if institution_slug:
            teachers_qs = teachers_qs.filter(institution__slug=institution_slug)

        rows = []
        for teacher in teachers_qs:
            for row in get_absence_report(teacher, start, end):
                rows.append({
                    'Docente': teacher.get_full_name() or teacher.username,
                    'Fecha': row['date'].isoformat(),
                    'Materia': row['subject'],
                    'Aula': row['classroom'],
                    'Hora inicio': str(row['start_time']),
                    'Hora fin': str(row['end_time']),
                    'Presente': 'Sí' if row['present'] else 'No',
                    'Hora fichaje': row['checked_in_at'].isoformat() if row['checked_in_at'] else '',
                    'GPS válido': str(row['gps_valid']) if row['gps_valid'] is not None else '',
                    'Red válida': str(row['network_valid']) if row['network_valid'] is not None else '',
                })

        filename = f"asistencia_{start}_{end}"

        if fmt == 'xlsx':
            wb = Workbook()
            ws = wb.active
            ws.title = 'Asistencia'
            if rows:
                headers = list(rows[0].keys())
                ws.append(headers)
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
