from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, UserViewSet, DepartmentViewSet, ActivityLogViewSet, UserManagementViewSet, DepartmentManagementViewSet, DashboardViewSet, SecuritySettingsViewSet, BackupSettingsViewSet, NotificationSettingsViewSet, APISettingsViewSet, BackupViewSet, UserProfileViewSet, UserSettingsViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet)
router.register(r'departments', DepartmentManagementViewSet)
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-logs')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'security-settings', SecuritySettingsViewSet, basename='security-settings')
router.register(r'backup-settings', BackupSettingsViewSet, basename='backup-settings')
router.register(r'notification-settings', NotificationSettingsViewSet, basename='notification-settings')
router.register(r'api-settings', APISettingsViewSet, basename='api-settings')
router.register(r'backups', BackupViewSet, basename='backups')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'settings', UserSettingsViewSet, basename='user-settings')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('activity-logs/debug/', ActivityLogViewSet.as_view({'get': 'debug'}), name='activity-logs-debug'),
    path('settings/download-tasks/', UserSettingsViewSet.as_view({'get': 'download_tasks'}), name='settings-download-tasks'),
    path('settings/2fa-status/', UserSettingsViewSet.as_view({'get': 'two_factor_status'}), name='settings-2fa-status'),
] 