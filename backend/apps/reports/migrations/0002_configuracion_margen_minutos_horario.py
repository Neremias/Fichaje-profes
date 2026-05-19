from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('reports', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='configuracion',
            name='margen_minutos_horario',
            field=models.SmallIntegerField(
                default=30,
                help_text='Minutos antes/después del horario en que se acepta el escaneo',
            ),
        ),
    ]
