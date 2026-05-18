from rest_framework import serializers
from .models import Carrera, Materia, MateriaCarrera, SlotHorario, AsignacionDocente
from apps.users.serializers import DocenteSerializer


class CarreraSerializer(serializers.ModelSerializer):
    institucion_display = serializers.CharField(source='get_institucion_display', read_only=True)

    class Meta:
        model = Carrera
        fields = ['id', 'institucion', 'institucion_display', 'codigo', 'nombre', 'duracion_anios']


class MateriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Materia
        fields = ['id', 'codigo_siu', 'nombre', 'anio', 'activa']


class MateriaCarreraSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    carrera_nombre = serializers.CharField(source='carrera.nombre', read_only=True)

    class Meta:
        model = MateriaCarrera
        fields = ['id', 'materia', 'materia_nombre', 'carrera', 'carrera_nombre', 'anio_plan']


class SlotHorarioSerializer(serializers.ModelSerializer):
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    dia_semana_display = serializers.CharField(source='get_dia_semana_display', read_only=True)

    class Meta:
        model = SlotHorario
        fields = ['id', 'materia', 'materia_nombre', 'dia_semana', 'dia_semana_display', 'hora_inicio', 'hora_fin']

    def validate(self, data):
        if data.get('hora_inicio') and data.get('hora_fin'):
            if data['hora_inicio'] >= data['hora_fin']:
                raise serializers.ValidationError('La hora de inicio debe ser anterior a la hora de fin.')
        return data


class AsignacionDocenteSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.CharField(source='docente.__str__', read_only=True)
    materia_nombre = serializers.CharField(source='materia.nombre', read_only=True)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = AsignacionDocente
        fields = [
            'id', 'docente', 'docente_nombre', 'materia', 'materia_nombre',
            'rol', 'rol_display', 'activa', 'fecha_inicio', 'fecha_fin',
        ]
