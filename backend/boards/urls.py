from django.urls import path, include
from rest_framework.routers import DefaultRouter
from boards import views

router = DefaultRouter()
router.register(r'boards', views.BoardViewSet, basename='board')
router.register(r'lists', views.ListViewSet, basename='list')
router.register(r'cards', views.CardViewSet, basename='card')
router.register(r'comments', views.CommentViewSet, basename='comment')

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('', include(router.urls)),
] 