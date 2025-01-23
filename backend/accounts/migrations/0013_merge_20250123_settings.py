from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0011_ensure_default_settings'),
        ('accounts', '0012_systemsettings_weather_api_enabled_and_more'),
    ]

    operations = [
        # No operations needed for merge
    ] 