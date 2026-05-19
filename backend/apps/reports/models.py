from django.db import models
from django.conf import settings


class Configuracion(models.Model):
    class MetodoValidacionChoices(models.TextChoices):
        GPS_O_WIFI = 'gps_o_wifi', 'GPS o WiFi'
        SOLO_WIFI = 'solo_wifi', 'Solo WiFi'
        SOLO_GPS = 'solo_gps', 'Solo GPS'

    dia_corte_mensual = models.SmallIntegerField(default=25)
    margen_minutos_horario = models.SmallIntegerField(default=30, help_text='Minutos antes/después del horario en que se acepta el escaneo')
    red_wifi_campus = models.CharField(max_length=100, null=True, blank=True)
    campus_latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    campus_longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    campus_radio_metros = models.SmallIntegerField(default=200)
    metodo_validacion_ubicacion = models.CharField(
        max_length=15,
        choices=MetodoValidacionChoices.choices,
        default=MetodoValidacionChoices.GPS_O_WIFI,
    )
    actualizado_en = models.DateTimeField(auto_now=True)
    actualizado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='configuraciones_actualizadas',
    )

    class Meta:
        verbose_name = 'Configuración'
        verbose_name_plural = 'Configuraciones'

    def __str__(self):
        return f"Configuración del sistema (actualizada: {self.actualizado_en:%Y-%m-%d %H:%M})"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
