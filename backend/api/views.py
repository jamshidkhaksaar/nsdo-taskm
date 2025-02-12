from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from accounts.models import User, SystemSettings
from .serializers import UserSerializer, UserLimitedSerializer, BackupSettingsSerializer
from accounts.permissions import TaskPermission
from django.core.files.base import ContentFile
from django.utils import timezone
import os
import zipfile
import io
from .models import Backup, Task, Note
from .serializers import BackupSerializer, TaskSerializer, NoteSerializer
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from django.http import FileResponse

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['email', 'role', 'department']
    search_fields = ['email', 'first_name', 'last_name']
    ordering_fields = ['date_joined']
    ordering = ['-date_joined']

    def get_queryset(self):
        user = self.request.user
        
        # For GET requests (list and retrieve), allow users to see other users in their department
        if self.request.method == 'GET':
            if user.is_staff:
                return User.objects.filter(is_active=True).exclude(is_superuser=True)
            else:
                return User.objects.filter(
                    is_active=True,
                    department=user.department
                ).exclude(is_superuser=True)
            
        # For other methods (create, update, delete)
        if user.is_staff:
            # Admin users can see all users
            return User.objects.all()
        else:
            # Regular users can only modify themselves
            return User.objects.filter(id=user.id)
            
    def get_serializer_class(self):
        # For GET requests, use the limited serializer
        if self.request.method == 'GET':
            return UserLimitedSerializer
        return self.serializer_class

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, TaskPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'department', 'is_private']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']

    def handle_exception(self, exc):
        if isinstance(exc, ValidationError):
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().handle_exception(exc)

    def get_queryset(self):
        user = self.request.user
        task_type = self.request.query_params.get('task_type', 'my_tasks')
        user_id_str = str(user.id)

        base_queryset = Task.objects.all()

        if task_type == 'my_tasks':
            # Return tasks created by the user (personal tasks)
            return base_queryset.filter(
                created_by=user
            ).distinct()
        elif task_type == 'assigned':
            # Return only tasks assigned to the current user by others
            return base_queryset.filter(
                assigned_to__regex=f'(^|,\\s*){user_id_str}(,|$)'
            ).exclude(created_by=user).distinct()
        elif task_type == 'created':
            # Return tasks created by the user and assigned to others
            return base_queryset.filter(
                created_by=user,
                assigned_to__isnull=False
            ).exclude(
                Q(assigned_to='') | 
                Q(assigned_to__regex=f'^{user_id_str}$')
            ).distinct()
        else:
            # For admin users, show all tasks
            if user.is_staff:
                return base_queryset
            # For regular users, show all their tasks (created or assigned)
            return base_queryset.filter(
                Q(created_by=user) | 
                Q(assigned_to__regex=f'(^|,\\s*){user_id_str}(,|$)')
            ).distinct()

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
            assigned_users = task.get_assigned_users()
            if str(user.id) not in assigned_users:
                assigned_users.append(str(user.id))
                task.set_assigned_users(assigned_users)
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

    def perform_update(self, serializer):
        # Ensure priority is lowercase
        if 'priority' in serializer.validated_data:
            serializer.validated_data['priority'] = serializer.validated_data['priority'].lower()
        serializer.save(updated_at=timezone.now())

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
                # Add database file if requested
                if request.data.get('includeDatabases', True):
                    db_path = os.path.join('backend', 'db.sqlite3')
                    if os.path.exists(db_path):
                        zip_file.write(db_path, 'db.sqlite3')
                
                # Add media files if requested
                if request.data.get('includeMedia', True):
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
                description=request.data.get('description', ''),
                type=request.data.get('type', 'full'),
                status='completed',
                name=f"Backup_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
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
    def restore(self, request, pk=None):
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

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        backup = self.get_object()
        try:
            return FileResponse(
                open(backup.file.path, 'rb'),
                as_attachment=True,
                filename=os.path.basename(backup.file.path)
            )
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
        serializer.save(
            created_by=self.request.user,
            updated_at=timezone.now()
        )

class BackupSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = BackupSettingsSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        settings, _ = SystemSettings.objects.get_or_create(pk=1)
        return settings

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
