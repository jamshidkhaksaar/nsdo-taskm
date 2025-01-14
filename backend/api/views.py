from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db.models import Q as models
from accounts.models import User
from .serializers import UserSerializer
from accounts.permissions import IsDepartmentAdmin
from django.core.files.base import ContentFile
from django.utils import timezone
import os
import zipfile
import io
from .models import Backup, Task, Note
from .serializers import BackupSerializer, TaskSerializer, NoteSerializer
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['email', 'role', 'departments']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined']
    ordering = ['-date_joined']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admin users can see all users in their department
        if user.is_staff:
            queryset = queryset.filter(departments__in=user.departments.all())
        else:
            # Regular users can only see themselves
            queryset = queryset.filter(id=user.id)
            
        return queryset

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'assigned_to', 'is_private']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date']
    ordering = ['-created_at']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsDepartmentAdmin]
        return super().get_permissions()

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Admin users can see all tasks in their department
        if user.is_staff:
            queryset = queryset.filter(department=user.department)
        else:
            # Regular users can only see their own tasks
            queryset = queryset.filter(
                models.Q(created_by=user) | 
                models.Q(assigned_to=user)
            )
        
        # Filter by department if specified
        department_id = self.request.query_params.get('department')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        return queryset

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            user = User.objects.get(id=user_id)
            task.assigned_to = user
            task.save()
            return Response({'status': 'user assigned'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        task = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            task.status = new_status
            task.save()
            return Response({'status': 'status updated'})
        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class BackupViewSet(viewsets.ModelViewSet):
    queryset = Backup.objects.all()
    serializer_class = BackupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def create_backup(self, request):
        try:
            # Create a zip file in memory
            buffer = io.BytesIO()
            with zipfile.ZipFile(buffer, 'w') as zip_file:
                # Add database file
                db_path = os.path.join('backend', 'db.sqlite3')
                if os.path.exists(db_path):
                    zip_file.write(db_path, 'db.sqlite3')
                
                # Add media files
                media_path = os.path.join('backend', 'media')
                if os.path.exists(media_path):
                    for root, dirs, files in os.walk(media_path):
                        for file in files:
                            file_path = os.path.join(root, file)
                            arcname = os.path.relpath(file_path, media_path)
                            zip_file.write(file_path, f'media/{arcname}')

            # Create backup record
            backup = Backup(
                created_by=request.user,
                description=request.data.get('description', '')
            )
            
            # Save zip file to backup
            buffer.seek(0)
            backup.file.save(
                f'backup_{timezone.now().strftime("%Y%m%d_%H%M%S")}.zip',
                ContentFile(buffer.read())
            )
            backup.save()

            serializer = self.get_serializer(backup)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def restore_backup(self, request, pk=None):
        backup = self.get_object()
        
        try:
            # Extract zip file
            with zipfile.ZipFile(backup.file.path, 'r') as zip_file:
                # Restore database
                if 'db.sqlite3' in zip_file.namelist():
                    db_path = os.path.join('backend', 'db.sqlite3')
                    with open(db_path, 'wb') as f:
                        f.write(zip_file.read('db.sqlite3'))
                
                # Restore media files
                for name in zip_file.namelist():
                    if name.startswith('media/'):
                        file_path = os.path.join('backend', name)
                        os.makedirs(os.path.dirname(file_path), exist_ok=True)
                        with open(file_path, 'wb') as f:
                            f.write(zip_file.read(name))

            backup.is_restored = True
            backup.save()
            return Response({'status': 'restore successful'})

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Note.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
