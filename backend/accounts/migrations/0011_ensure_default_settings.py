from django.db import migrations

def create_default_settings(apps, schema_editor):
    SystemSettings = apps.get_model('accounts', 'SystemSettings')
    if not SystemSettings.objects.exists():
        SystemSettings.objects.create()

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0010_alter_department_options_and_more'),
    ]

    operations = [
        migrations.RunPython(create_default_settings),
    ] 