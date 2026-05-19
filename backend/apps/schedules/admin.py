from django.contrib import admin
from .models import Carrera, Materia, MateriaCarrera, SlotHorario, AsignacionDocente


@admin.register(Carrera)
class CarreraAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo', 'institucion', 'duracion_anios', 'activo']
    list_filter = ['institucion', 'activo']
    search_fields = ['nombre', 'codigo']


@admin.register(Materia)
class MateriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'codigo_siu', 'anio', 'activa']
    list_filter = ['activa', 'anio']
    search_fields = ['nombre', 'codigo_siu']


@admin.register(MateriaCarrera)
class MateriaCarreraAdmin(admin.ModelAdmin):
    list_display = ['materia', 'carrera', 'anio_plan']
    list_filter = ['carrera']
    raw_id_fields = ['materia', 'carrera']


@admin.register(SlotHorario)
class SlotHorarioAdmin(admin.ModelAdmin):
    list_display = ['materia', 'dia_semana', 'hora_inicio', 'hora_fin', 'activo']
    list_filter = ['dia_semana', 'materia', 'activo']
    search_fields = ['materia__nombre']


@admin.register(AsignacionDocente)
class AsignacionDocenteAdmin(admin.ModelAdmin):
    list_display = ['docente', 'materia', 'rol', 'activa', 'fecha_inicio', 'fecha_fin']
    list_filter = ['rol', 'activa']
    search_fields = ['docente__user__first_name', 'docente__user__last_name', 'materia__nombre']
    raw_id_fields = ['docente', 'materia']
