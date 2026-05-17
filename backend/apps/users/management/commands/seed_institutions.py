from django.core.management.base import BaseCommand
from apps.users.models import Institution


class Command(BaseCommand):
    help = 'Creates initial institutions: ICES and UCSE'

    def handle(self, *args, **options):
        institutions = [
            {'name': 'ICES', 'slug': 'ices', 'address': 'Santiago del Estero, Argentina'},
            {'name': 'UCSE', 'slug': 'ucse', 'address': 'Santiago del Estero, Argentina'},
        ]
        for data in institutions:
            inst, created = Institution.objects.get_or_create(
                slug=data['slug'],
                defaults={'name': data['name'], 'address': data['address']},
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Institución creada: {inst.name}'))
            else:
                self.stdout.write(f'Ya existe: {inst.name}')
