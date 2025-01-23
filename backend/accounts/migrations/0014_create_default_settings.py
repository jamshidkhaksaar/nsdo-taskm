from django.db import migrations

def create_default_settings(apps, schema_editor):
    SystemSettings = apps.get_model('accounts', 'SystemSettings')
    if not SystemSettings.objects.exists():
        SystemSettings.objects.create(
            weather_api_enabled=False,
            weather_api_key='',
            api_enabled=True,
            api_rate_limit=100
        )

def reverse_default_settings(apps, schema_editor):
    SystemSettings = apps.get_model('accounts', 'SystemSettings')
    SystemSettings.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0013_merge_20250123_settings'),
    ]

    operations = [
        migrations.RunPython(create_default_settings, reverse_default_settings),
    ] 