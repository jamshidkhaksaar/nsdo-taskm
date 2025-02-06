from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import BackupViewSet, TaskViewSet, NoteViewSet, BackupSettingsViewSet

router = DefaultRouter()
router.register(r'backups', BackupViewSet, basename='backup')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'backup-settings', BackupSettingsViewSet, basename='backup-settings')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include([
        path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ])),
]
