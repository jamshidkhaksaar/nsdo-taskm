from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Department, ActivityLog, SystemSettings, Backup

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'head', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    department_details = DepartmentSerializer(source='department', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'department', 'department_details', 'position',
            'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'department', 'position'
        ]

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()

    class Meta:
        fields = ['access', 'refresh', 'user']

class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'action', 'target', 'timestamp',
            'ip_address', 'status', 'details'
        ]

class UserManagementSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'department', 'department_name', 'status',
            'position', 'last_login', 'date_joined', 'is_active'
        ]
        read_only_fields = ['last_login', 'date_joined']
        extra_kwargs = {
            'username': {'required': True},
            'email': {'required': True},
            'role': {'required': True}
        }

    def create(self, validated_data):
        # Set default status to active and is_active to True
        validated_data['status'] = 'active'
        validated_data['is_active'] = True
        return super().create(validated_data)

class UserPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, required=True)
    
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError(
                'Password must be at least 8 characters long'
            )
        
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError(
                'Password must contain at least one number'
            )
            
        if not any(char.isupper() for char in value):
            raise serializers.ValidationError(
                'Password must contain at least one uppercase letter'
            )
            
        if not any(char.islower() for char in value):
            raise serializers.ValidationError(
                'Password must contain at least one lowercase letter'
            )
            
        if not any(char in '!@#$%^&*()' for char in value):
            raise serializers.ValidationError(
                'Password must contain at least one special character (!@#$%^&*())'
            )
            
        return value

class DepartmentManagementSerializer(serializers.ModelSerializer):
    head_name = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'description', 'head', 'head_name',
            'members', 'members_count', 'active_projects',
            'completion_rate', 'created_at', 'updated_at'
        ]
        read_only_fields = ['members_count', 'active_projects', 'completion_rate', 'created_at', 'updated_at']

    def get_head_name(self, obj):
        if obj.head:
            return f"{obj.head.first_name} {obj.head.last_name}".strip() or obj.head.username
        return "No Head Assigned"

    def get_members(self, obj):
        # Get all users in this department
        department_users = obj.users.all()
        return [{
            'id': str(user.id),  # Convert to string to ensure consistency
            'name': f"{user.first_name} {user.last_name}".strip() or user.username,
            'avatar': None
        } for user in department_users]

    def get_members_count(self, obj):
        # Directly count the related users
        return obj.users.count() 

class DashboardStatsSerializer(serializers.Serializer):
    stats = serializers.DictField()
    recent_activities = ActivityLogSerializer(many=True)
    department_stats = serializers.ListField()
    user_stats = serializers.DictField()

    class Meta:
        fields = ['stats', 'recent_activities', 'department_stats', 'user_stats']

class DepartmentStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = [
            'id', 'name', 'active_projects', 'completed_projects',
            'total_members', 'completion_rate'
        ] 

class SecuritySettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'two_factor_enabled',
            'password_expiry_days',
            'max_login_attempts',
            'lockout_duration_minutes',
            'password_complexity_required',
            'session_timeout_minutes',
            'last_updated'
        ]

    def validate_password_expiry_days(self, value):
        if value < 1 or value > 365:
            raise serializers.ValidationError(
                'Password expiry must be between 1 and 365 days'
            )
        return value

    def validate_max_login_attempts(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError(
                'Max login attempts must be between 1 and 10'
            )
        return value 

class BackupSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'auto_backup_enabled',
            'backup_frequency_hours',
            'backup_retention_days',
            'last_backup_at',
            'backup_location'
        ]

    def validate_backup_frequency_hours(self, value):
        if value < 1 or value > 168:  # Max 1 week
            raise serializers.ValidationError(
                'Backup frequency must be between 1 and 168 hours'
            )
        return value

class NotificationSettingsSerializer(serializers.ModelSerializer):
    smtp_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = SystemSettings
        fields = [
            'email_notifications_enabled',
            'smtp_server',
            'smtp_port',
            'smtp_username',
            'smtp_password',
            'smtp_use_tls'
        ]

class APISettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = [
            'api_enabled',
            'api_key',
            'api_rate_limit',
            'api_allowed_ips'
        ]

    def validate_api_rate_limit(self, value):
        if value < 1 or value > 1000:
            raise serializers.ValidationError(
                'API rate limit must be between 1 and 1000 requests per minute'
            )
        return value 

class BackupSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    
    class Meta:
        model = Backup
        fields = [
            'id', 'name', 'timestamp', 'size', 'type',
            'status', 'created_by', 'notes', 'error_message'
        ]
        read_only_fields = ['timestamp', 'created_by'] 