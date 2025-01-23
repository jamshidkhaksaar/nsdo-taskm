from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import ActivityLog
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

User = get_user_model()
channel_layer = get_channel_layer()

@receiver([post_save, post_delete])
def log_activity(sender, instance, **kwargs):
    """
    Signal handler to log model changes automatically and broadcast via WebSocket.
    """
    # Skip logging for ActivityLog model itself to avoid recursion
    if sender == ActivityLog:
        return
        
    # Get the action type
    if kwargs.get('created', False):
        action = 'created'
    elif 'created' not in kwargs:
        action = 'deleted'
    else:
        action = 'updated'

    # Create the activity log
    log = ActivityLog.objects.create(
        action=action,
        model_name=sender.__name__,
        object_id=str(instance.id),
        timestamp=timezone.now(),
        details=f"{sender.__name__} {instance} was {action}"
    )

    # Broadcast the activity via WebSocket
    try:
        async_to_sync(channel_layer.group_send)(
            "activity_logs",
            {
                "type": "activity_message",
                "message": {
                    "id": str(log.id),
                    "action": log.action,
                    "model_name": log.model_name,
                    "details": log.details,
                    "timestamp": log.timestamp.isoformat()
                }
            }
        )
    except Exception as e:
        print(f"WebSocket broadcast failed: {e}") 