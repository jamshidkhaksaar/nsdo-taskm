from django.apps import AppConfig

class ActivityLogsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'activity_logs'

    def ready(self):
        try:
            import activity_logs.signals  # noqa
        except ImportError:
            pass 