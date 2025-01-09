from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.files.base import ContentFile
from django.utils import timezone
import os
import zipfile
import io
from .models import Backup
from .serializers import BackupSerializer

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
