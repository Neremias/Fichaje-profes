from rest_framework import serializers
from .models import Configuracion


class ConfiguracionSerializer(serializers.ModelSerializer):
    metodo_validacion_display = serializers.CharField(
        source='get_metodo_validacion_ubicacion_display', read_only=True
    )

    class Meta:
        model = Configuracion
        fields = [
            'id', 'dia_corte_mensual', 'red_wifi_campus',
            'campus_latitud', 'campus_longitud', 'campus_radio_metros',
            'metodo_validacion_ubicacion', 'metodo_validacion_display',
            'actualizado_en', 'actualizado_por',
        ]
        read_only_fields = ['actualizado_en', 'actualizado_por']
