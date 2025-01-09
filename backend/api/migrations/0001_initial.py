# Generated by Django 5.1.4 on 2025-01-09 07:55

import django.db.models.deletion
import django.utils.timezone
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Backup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('file', models.FileField(upload_to='backups/')),
                ('description', models.TextField(blank=True)),
                ('size', models.BigIntegerField(default=0)),
                ('is_restored', models.BooleanField(default=False)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='api_backups', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Backup',
                'verbose_name_plural': 'Backups',
                'ordering': ['-created_at'],
            },
        ),
    ]
