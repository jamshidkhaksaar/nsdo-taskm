from .models import ActivityLog

def log_activity(user, action, target, details='', status='success', ip_address='0.0.0.0'):
    """
    Utility function to create activity log entries.
    """
    return ActivityLog.objects.create(
        user=user,
        action=action,
        target=target,
        details=details,
        status=status,
        ip_address=ip_address
    ) 