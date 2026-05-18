from rest_framework import serializers
from .models import RegistroAsistencia, SolicitudEmergencia, EventoCalendario
from apps.schedules.serializers import SlotHorarioSerializer
from apps.users.serializers import DocenteSerializer


class EventoCalendarioSerializer(serializers.ModelSerializer):
    creado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = EventoCalendario
        fields = ['id', 'fecha', 'descripcion', 'creado_por', 'creado_por_nombre']
        read_only_fields = ['creado_por']

    def get_creado_por_nombre(self, obj):
        if obj.creado_por:
            return obj.creado_por.get_full_name() or obj.creado_por.username
        return None


class SolicitudEmergenciaSerializer(serializers.ModelSerializer):
    docente_nombre = serializers.CharField(source='docente.__str__', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)

    class Meta:
        model = SolicitudEmergencia
        fields = [
            'id', 'docente', 'docente_nombre', 'slot_horario', 'fecha',
            'nota_docente', 'estado', 'estado_display', 'nota_secretaria',
            'revisado_por', 'revisado_en', 'creado_en',
        ]
        read_only_fields = ['estado', 'nota_secretaria', 'revisado_por', 'revisado_en', 'creado_en']


class SolicitudRevisionSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=['aprobada', 'rechazada'])
    nota_secretaria = serializers.CharField(required=False, allow_blank=True)


class RegistroAsistenciaSerializer(serializers.ModelSerializer):
    slot_horario_detalle = SlotHorarioSerializer(source='slot_horario', read_only=True)
    docente_nombre = serializers.CharField(source='docente.__str__', read_only=True)
    tipo_clase_display = serializers.CharField(source='get_tipo_clase_display', read_only=True)

    class Meta:
        model = RegistroAsistencia
        fields = [
            'id', 'docente', 'docente_nombre', 'slot_horario', 'slot_horario_detalle',
            'fecha', 'anio', 'tipo_clase', 'tipo_clase_display',
            'hora_entrada', 'hora_salida', 'ubicacion_validada',
            'latitud_registrada', 'longitud_registrada', 'ip_registrada',
            'solicitud_emergencia', 'nota',
        ]
        read_only_fields = ['hora_entrada', 'ubicacion_validada', 'ip_registrada', 'anio']


class FicharSerializer(serializers.Serializer):
    tipo_clase = serializers.ChoiceField(choices=RegistroAsistencia.TipoClaseChoices.choices)
    latitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitud = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    nota = serializers.CharField(required=False, allow_blank=True, default='')
    solicitud_emergencia_id = serializers.IntegerField(required=False, allow_null=True)
