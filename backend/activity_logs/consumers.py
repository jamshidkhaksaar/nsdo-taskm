import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import ActivityLog

class ActivityLogConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("activity_logs", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("activity_logs", self.channel_name)

    async def receive(self, text_data):
        pass  # We don't expect to receive messages

    async def activity_message(self, event):
        message = event["message"]
        await self.send(text_data=json.dumps(message))

    @database_sync_to_async
    def get_recent_logs(self, limit=50):
        return list(ActivityLog.objects.all()[:limit].values()) 