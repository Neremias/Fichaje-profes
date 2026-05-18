from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.models import Docente, Usuario
from apps.schedules.models import Carrera


class Command(BaseCommand):
    help = 'Crea datos iniciales: carreras de muestra, superusuario admin y perfiles de prueba'

    def handle(self, *args, **options):
        # Create sample carreras
        carreras = [
            {
                'institucion': 'ices',
                'codigo': 'ISI',
                'nombre': 'Ingeniería en Sistemas de Información',
                'duracion_anios': 5,
            },
            {
                'institucion': 'ucse',
                'codigo': 'IND',
                'nombre': 'Ingeniería Industrial',
                'duracion_anios': 5,
            },
        ]
        for data in carreras:
            carrera, created = Carrera.objects.get_or_create(
                codigo=data['codigo'],
                institucion=data['institucion'],
                defaults={
                    'nombre': data['nombre'],
                    'duracion_anios': data['duracion_anios'],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Carrera creada: {carrera.nombre}'))
            else:
                self.stdout.write(f'Ya existe: {carrera.nombre}')

        # Create superuser admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@fichajeprofes.edu.ar',
                'first_name': 'Admin',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Superusuario creado: admin / admin123'))
        else:
            self.stdout.write('Ya existe el superusuario: admin')

        # Create Usuario profile for admin
        usuario, created = Usuario.objects.get_or_create(user=admin_user)
        if created:
            self.stdout.write(self.style.SUCCESS('Perfil Usuario creado para admin'))

        # Create a sample docente user
        docente_user, created = User.objects.get_or_create(
            username='docente1',
            defaults={
                'email': 'docente1@fichajeprofes.edu.ar',
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'is_staff': False,
                'is_superuser': False,
            },
        )
        if created:
            docente_user.set_password('docente123')
            docente_user.save()
            self.stdout.write(self.style.SUCCESS('Usuario docente creado: docente1 / docente123'))
        else:
            self.stdout.write('Ya existe el usuario: docente1')

        docente, created = Docente.objects.get_or_create(user=docente_user)
        if created:
            self.stdout.write(self.style.SUCCESS('Perfil Docente creado para docente1'))
