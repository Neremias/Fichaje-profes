from django.db import models
from apps.users.models import User, Institution
from apps.schedules.models import Schedule


class AllowedNetwork(models.Model):
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='allowed_networks')
    cidr = models.CharField(max_length=50)
    description = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name = 'Red Permitida'
        verbose_name_plural = 'Redes Permitidas'

    def __str__(self):
        return f"{self.institution.slug}: {self.cidr}"


class AllowedZone(models.Model):
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='allowed_zones')
    name = models.CharField(max_length=100)
    gps_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    gps_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    radius_meters = models.IntegerField(default=200)

    class Meta:
        verbose_name = 'Zona Permitida'
        verbose_name_plural = 'Zonas Permitidas'

    def __str__(self):
        return f"{self.institution.slug}: {self.name}"


class AttendanceRecord(models.Model):
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        limit_choices_to={'role': 'teacher'},
    )
    schedule = models.ForeignKey(
        Schedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='records',
    )
    classroom_name = models.CharField(max_length=100)
    date = models.DateField()
    checked_in_at = models.DateTimeField(auto_now_add=True)
    gps_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    gps_valid = models.BooleanField(default=False)
    network_valid = models.BooleanField(default=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='attendance_records')
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Registro de Asistencia'
        verbose_name_plural = 'Registros de Asistencia'
        ordering = ['-date', '-checked_in_at']
        unique_together = [('teacher', 'schedule', 'date')]

    def __str__(self):
        return f"{self.teacher} — {self.date} {self.classroom_name}"
