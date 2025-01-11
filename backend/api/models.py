from django.db import models
from django.utils import timezone
from django.conf import settings
import os
import uuid
from accounts.models import Department

class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='assigned_tasks',
        null=True,
        blank=True
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    is_private = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'

    def __str__(self):
        return self.title

class Backup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='api_backups'
    )
    file = models.FileField(upload_to='backups/')
    description = models.TextField(blank=True)
    size = models.BigIntegerField(default=0)
    is_restored = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'

    def __str__(self):
        return f"Backup {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.size = self.file.size
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)
