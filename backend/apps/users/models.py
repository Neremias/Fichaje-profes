from django.db import models
from django.contrib.auth.models import User


class Docente(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='docente')
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Docente'
        verbose_name_plural = 'Docentes'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"


class Usuario(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='usuario')
    activo = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Usuario (Secretaría)'
        verbose_name_plural = 'Usuarios (Secretaría)'

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username}"
