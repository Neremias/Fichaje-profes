from django.db import models


class Carrera(models.Model):
    class InstitucionChoices(models.TextChoices):
        ICES = 'ices', 'ICES'
        UCSE = 'ucse', 'UCSE'
        OTRO_CONVENIO = 'otro_convenio', 'Otro Convenio'

    institucion = models.CharField(max_length=20, choices=InstitucionChoices.choices)
    codigo = models.CharField(max_length=10)
    nombre = models.CharField(max_length=200)
    duracion_anios = models.SmallIntegerField()

    class Meta:
        verbose_name = 'Carrera'
        verbose_name_plural = 'Carreras'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.get_institucion_display()})"


class Materia(models.Model):
    codigo_siu = models.CharField(max_length=20)
    nombre = models.CharField(max_length=200)
    anio = models.SmallIntegerField()
    activa = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} (SIU: {self.codigo_siu})"


class MateriaCarrera(models.Model):
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='materia_carreras')
    carrera = models.ForeignKey(Carrera, on_delete=models.CASCADE, related_name='materia_carreras')
    anio_plan = models.SmallIntegerField()

    class Meta:
        verbose_name = 'Materia en Carrera'
        verbose_name_plural = 'Materias en Carreras'
        unique_together = [('materia', 'carrera')]

    def __str__(self):
        return f"{self.materia} → {self.carrera} (año {self.anio_plan})"


class SlotHorario(models.Model):
    class DiaSemanaChoices(models.TextChoices):
        LUNES = 'lunes', 'Lunes'
        MARTES = 'martes', 'Martes'
        MIERCOLES = 'miercoles', 'Miércoles'
        JUEVES = 'jueves', 'Jueves'
        VIERNES = 'viernes', 'Viernes'
        SABADO = 'sabado', 'Sábado'

    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='slots_horario')
    dia_semana = models.CharField(max_length=10, choices=DiaSemanaChoices.choices)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        verbose_name = 'Slot Horario'
        verbose_name_plural = 'Slots Horarios'
        ordering = ['dia_semana', 'hora_inicio']

    def __str__(self):
        return f"{self.materia} — {self.get_dia_semana_display()} {self.hora_inicio:%H:%M}–{self.hora_fin:%H:%M}"


class AsignacionDocente(models.Model):
    class RolChoices(models.TextChoices):
        TITULAR = 'titular', 'Titular'
        ADJUNTO = 'adjunto', 'Adjunto'

    docente = models.ForeignKey('users.Docente', on_delete=models.CASCADE, related_name='asignaciones')
    materia = models.ForeignKey(Materia, on_delete=models.CASCADE, related_name='asignaciones')
    rol = models.CharField(max_length=10, choices=RolChoices.choices)
    activa = models.BooleanField(default=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = 'Asignación Docente'
        verbose_name_plural = 'Asignaciones Docentes'

    def __str__(self):
        return f"{self.docente} → {self.materia} ({self.get_rol_display()})"
