from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'backups', views.BackupViewSet, basename='backup')

urlpatterns = [
    path('', include(router.urls)),
]
