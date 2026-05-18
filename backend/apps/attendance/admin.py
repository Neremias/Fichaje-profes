from django.contrib import admin
from .models import RegistroAsistencia, SolicitudEmergencia, EventoCalendario


@admin.register(RegistroAsistencia)
class RegistroAsistenciaAdmin(admin.ModelAdmin):
    list_display = [
        'docente', 'slot_horario', 'fecha', 'tipo_clase',
        'hora_entrada', 'hora_salida', 'ubicacion_validada',
    ]
    list_filter = ['fecha', 'tipo_clase', 'ubicacion_validada']
    search_fields = [
        'docente__user__first_name', 'docente__user__last_name',
        'slot_horario__materia__nombre',
    ]
    date_hierarchy = 'fecha'
    raw_id_fields = ['docente', 'slot_horario', 'solicitud_emergencia']


@admin.register(SolicitudEmergencia)
class SolicitudEmergenciaAdmin(admin.ModelAdmin):
    list_display = ['docente', 'fecha', 'estado', 'revisado_por', 'revisado_en', 'creado_en']
    list_filter = ['estado', 'fecha']
    search_fields = ['docente__user__first_name', 'docente__user__last_name']
    raw_id_fields = ['docente', 'slot_horario', 'revisado_por']


@admin.register(EventoCalendario)
class EventoCalendarioAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'descripcion', 'creado_por']
    list_filter = ['fecha']
    search_fields = ['descripcion']
    date_hierarchy = 'fecha'
