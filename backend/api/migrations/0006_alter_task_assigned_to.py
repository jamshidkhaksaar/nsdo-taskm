from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0005_task_priority_alter_task_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='task',
            name='assigned_to',
            field=models.TextField(blank=True, null=True),
        ),
    ] 