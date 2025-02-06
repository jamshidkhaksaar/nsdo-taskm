from django.db import models
from django.utils import timezone
from django.conf import settings
import json
import os
import uuid
from accounts.models import Department

class Task(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High')
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='medium'
    )
    created_by = models.ForeignKey(
        'accounts.User',  # Use string reference to avoid circular import
        on_delete=models.CASCADE,
        related_name='created_tasks'
    )
    assigned_to = models.JSONField(
        null=True,
        blank=True,
        help_text="JSON array of user IDs"
    )
    department = models.ForeignKey(
        'accounts.Department',
        on_delete=models.CASCADE,
        related_name='tasks',
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_private = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'

    def __str__(self):
        return self.title

    def get_assigned_users(self):
        """Get the list of assigned user IDs"""
        if not self.assigned_to:
            return []
        try:
            return json.loads(self.assigned_to)
        except json.JSONDecodeError:
            return []

    def set_assigned_users(self, user_ids):
        """Set the list of assigned user IDs"""
        if user_ids is None:
            self.assigned_to = None
        else:
            self.assigned_to = json.dumps(user_ids)

class Backup(models.Model):
    TYPE_CHOICES = [
        ('full', 'Full'),
        ('partial', 'Partial')
    ]
    
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('in_progress', 'In Progress'),
        ('failed', 'Failed')
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, default='Untitled Backup')
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
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='full')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress')
    is_restored = models.BooleanField(default=False)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'

    def __str__(self):
        return f"{self.name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"

    def save(self, *args, **kwargs):
        if not self.pk and self.file:
            self.size = self.file.size
        if not self.name or self.name == 'Untitled Backup':
            self.name = f"Backup_{timezone.now().strftime('%Y%m%d_%H%M%S')}"
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.file:
            if os.path.isfile(self.file.path):
                os.remove(self.file.path)
        super().delete(*args, **kwargs)

class Note(models.Model):
    content = models.TextField()
    color = models.CharField(max_length=50)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Note'
        verbose_name_plural = 'Notes'

    def __str__(self):
        return f"Note by {self.created_by.username} ({self.created_at.strftime('%Y-%m-%d')})"
