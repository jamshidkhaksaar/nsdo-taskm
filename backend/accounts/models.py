from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_password(self.make_random_password())
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractUser):
    objects = CustomUserManager()
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
    ]
    
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active'
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='user'
    )
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )
    position = models.CharField(max_length=100, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.is_superuser and self.role != 'admin':
            self.role = 'admin'
        super().save(*args, **kwargs)

    class Meta:
        # Remove the unique_together constraint since AbstractUser already handles username uniqueness
        swappable = 'AUTH_USER_MODEL'

class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    head = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='departments',
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active_projects = models.IntegerField(default=0)
    completion_rate = models.FloatField(default=0.0)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def members_count(self):
        return self.users.count()

    def update_stats(self):
        """Update department statistics"""
        from api.models import Project  # Import here to avoid circular imports
        
        # Get projects for this department's users
        projects = Project.objects.filter(assigned_to__department=self)
        
        # Update active projects count
        self.active_projects = projects.filter(status='in_progress').count()
        
        # Calculate completion rate
        total_projects = projects.count()
        completed_projects = projects.filter(status='completed').count()
        self.completion_rate = (completed_projects / total_projects * 100) if total_projects > 0 else 0
        
        self.save()

class ActivityLog(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activity_logs'
    )
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=100)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='success'
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}" 

class SystemSettings(models.Model):
    # Security Settings
    two_factor_enabled = models.BooleanField(default=False)
    password_expiry_days = models.IntegerField(default=90)
    max_login_attempts = models.IntegerField(default=5)
    lockout_duration_minutes = models.IntegerField(default=30)
    password_complexity_required = models.BooleanField(default=True)
    session_timeout_minutes = models.IntegerField(default=60)

    # Backup Settings
    auto_backup_enabled = models.BooleanField(default=True)
    backup_frequency_hours = models.IntegerField(default=24)
    backup_retention_days = models.IntegerField(default=30)
    last_backup_at = models.DateTimeField(null=True, blank=True)
    backup_location = models.CharField(max_length=255, default='backups/')

    # Notification Settings
    email_notifications_enabled = models.BooleanField(default=True)
    smtp_server = models.CharField(max_length=255, default='smtp.example.com')
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.CharField(max_length=255, blank=True)
    smtp_password = models.CharField(max_length=255, blank=True)
    smtp_use_tls = models.BooleanField(default=True)

    # API Settings
    api_enabled = models.BooleanField(default=True)
    api_key = models.CharField(max_length=64, blank=True)
    api_rate_limit = models.IntegerField(default=100)  # Requests per minute
    api_allowed_ips = models.TextField(blank=True)  # Comma-separated list of IPs

    # Weather API Settings
    weather_api_enabled = models.BooleanField(default=False)
    weather_api_key = models.CharField(max_length=255, blank=True)

    # Add a timestamp for tracking changes
    last_updated = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='system_settings_updates'
    )

    class Meta:
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'

    def save(self, *args, **kwargs):
        # Log the settings update
        from .utils import log_activity
        action = 'System Settings Updated'
        log_activity(
            user=kwargs.get('user'),
            action=action,
            target='Security Settings',
            details='Security settings were updated',
            status='success',
            ip_address=kwargs.get('ip_address', '0.0.0.0')
        )
        super().save(*args, **kwargs) 

class Backup(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('in_progress', 'In Progress'),
        ('failed', 'Failed')
    ]
    
    TYPE_CHOICES = [
        ('full', 'Full'),
        ('partial', 'Partial')
    ]

    name = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    size = models.CharField(max_length=20)  # Store size as string (e.g., "2.5 GB")
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    file_path = models.CharField(max_length=255)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='backups'
    )
    notes = models.TextField(blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.name} ({self.timestamp})"

    def delete(self, *args, **kwargs):
        # Delete the actual backup file
        import os
        if os.path.exists(self.file_path):
            try:
                os.remove(self.file_path)
            except Exception as e:
                print(f"Error deleting backup file: {e}")
        
        # Log the deletion
        from .utils import log_activity
        log_activity(
            user=kwargs.get('user'),
            action='Backup Deleted',
            target=f'Backup: {self.name}',
            details=f'Backup file deleted: {self.file_path}',
            status='success',
            ip_address=kwargs.get('ip_address', '0.0.0.0')
        )
        
        super().delete(*args, **kwargs) 