from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, UserViewSet, DepartmentViewSet, ActivityLogViewSet, UserManagementViewSet, DepartmentManagementViewSet

router = DefaultRouter()
router.register(r'users', UserManagementViewSet)
router.register(r'departments', DepartmentManagementViewSet)
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('activity-logs/debug/', ActivityLogViewSet.as_view({'get': 'debug'}), name='activity-logs-debug'),
] 