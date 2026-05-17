from django.db import models
from apps.users.models import User, Institution

DAY_CHOICES = [
    (0, 'Lunes'), (1, 'Martes'), (2, 'Miércoles'),
    (3, 'Jueves'), (4, 'Viernes'), (5, 'Sábado'), (6, 'Domingo'),
]


class Subject(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, blank=True)
    career = models.CharField(max_length=200, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='subjects')

    class Meta:
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.institution.slug})"


class Classroom(models.Model):
    name = models.CharField(max_length=100)
    building = models.CharField(max_length=100, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='classrooms')
    gps_latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    gps_longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    gps_radius_meters = models.IntegerField(default=100)

    class Meta:
        verbose_name = 'Aula'
        verbose_name_plural = 'Aulas'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} — {self.institution.slug}"


class Schedule(models.Model):
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='schedules',
        limit_choices_to={'role': 'teacher'},
    )
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='schedules')
    classroom = models.ForeignKey(Classroom, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField()
    valid_until = models.DateField()

    class Meta:
        verbose_name = 'Horario'
        verbose_name_plural = 'Horarios'
        ordering = ['day_of_week', 'start_time']

    def __str__(self):
        return f"{self.teacher} — {self.subject} ({self.get_day_of_week_display()} {self.start_time})"
