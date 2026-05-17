import os
import qrcode
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import Institution


class Command(BaseCommand):
    help = 'Generates QR code images for all institutions'

    def add_arguments(self, parser):
        parser.add_argument('--base-url', default='http://localhost:5173', help='Base URL for the check-in page')

    def handle(self, *args, **options):
        base_url = options['base_url'].rstrip('/')
        qr_dir = os.path.join(settings.MEDIA_ROOT, 'qr')
        os.makedirs(qr_dir, exist_ok=True)

        for institution in Institution.objects.all():
            url = f"{base_url}/check-in?institution={institution.slug}"
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(url)
            qr.make(fit=True)
            img = qr.make_image(fill_color='black', back_color='white')
            path = os.path.join(qr_dir, f"{institution.slug}.png")
            img.save(path)
            self.stdout.write(self.style.SUCCESS(f'QR generado para {institution.name}: {path}'))
