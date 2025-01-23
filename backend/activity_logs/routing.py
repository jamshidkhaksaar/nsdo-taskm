from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/activity_logs/$', consumers.ActivityLogConsumer.as_asgi()),
] 