from django.contrib import admin
from .models import Configuracion


@admin.register(Configuracion)
class ConfiguracionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'dia_corte_mensual', 'metodo_validacion_ubicacion',
        'red_wifi_campus', 'campus_radio_metros', 'actualizado_en', 'actualizado_por',
    ]
    readonly_fields = ['actualizado_en']

    def has_add_permission(self, request):
        return not Configuracion.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
