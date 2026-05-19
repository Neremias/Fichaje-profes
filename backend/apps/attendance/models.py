from django.db import models
from django.conf import settings


class EventoCalendario(models.Model):
    fecha = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    descripcion = models.CharField(max_length=200)
    creado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='eventos_creados',
    )

    class Meta:
        verbose_name = 'Evento de Calendario'
        verbose_name_plural = 'Eventos de Calendario'
        ordering = ['fecha']

    def __str__(self):
        return f"{self.fecha} — {self.descripcion}"


class SolicitudEmergencia(models.Model):
    class EstadoChoices(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        APROBADA = 'aprobada', 'Aprobada'
        RECHAZADA = 'rechazada', 'Rechazada'

    docente = models.ForeignKey(
        'users.Docente', on_delete=models.CASCADE, related_name='solicitudes_emergencia'
    )
    slot_horario = models.ForeignKey(
        'schedules.SlotHorario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_emergencia',
    )
    fecha = models.DateField()
    nota_docente = models.TextField(null=True, blank=True)
    estado = models.CharField(
        max_length=10, choices=EstadoChoices.choices, default=EstadoChoices.PENDIENTE
    )
    nota_secretaria = models.TextField(null=True, blank=True)
    revisado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revisiones',
    )
    revisado_en = models.DateTimeField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Solicitud de Emergencia'
        verbose_name_plural = 'Solicitudes de Emergencia'
        ordering = ['-creado_en']

    def __str__(self):
        return f"{self.docente} — {self.fecha} ({self.get_estado_display()})"


class RegistroAsistencia(models.Model):
    class TipoClaseChoices(models.TextChoices):
        PRESENCIAL = 'presencial', 'Presencial'
        VIRTUAL_SINCRONICA = 'virtual_sincronica', 'Virtual Sincrónica'
        ASINCRONICA = 'asincronica', 'Asincrónica'

    docente = models.ForeignKey(
        'users.Docente', on_delete=models.CASCADE, related_name='registros_asistencia'
    )
    slot_horario = models.ForeignKey(
        'schedules.SlotHorario', on_delete=models.PROTECT, related_name='registros'
    )
    fecha = models.DateField()
    anio = models.SmallIntegerField()
    tipo_clase = models.CharField(max_length=20, choices=TipoClaseChoices.choices)
    hora_entrada = models.DateTimeField(null=True, blank=True)
    hora_salida = models.DateTimeField(null=True, blank=True)
    ubicacion_validada = models.BooleanField(null=True, blank=True)
    latitud_registrada = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud_registrada = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    ip_registrada = models.CharField(max_length=45, null=True, blank=True)
    solicitud_emergencia = models.ForeignKey(
        SolicitudEmergencia,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registros',
    )
    nota = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-fecha', '-hora_entrada']
        unique_together = [('docente', 'slot_horario', 'fecha')]

    def __str__(self):
        return f"{self.docente} — {self.fecha} ({self.get_tipo_clase_display()})"
