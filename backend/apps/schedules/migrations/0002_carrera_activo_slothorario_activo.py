from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('schedules', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='carrera',
            name='activo',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='slothorario',
            name='activo',
            field=models.BooleanField(default=True),
        ),
    ]
