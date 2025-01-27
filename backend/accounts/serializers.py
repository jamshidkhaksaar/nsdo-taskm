from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Department, ActivityLog, SystemSettings, Backup, UserProfile
from django.core.files.base import ContentFile
import base64

User = get_user_model()

# Define UserSerializer first since it's used by other serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'department', 'position',
            'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['date_joined', 'last_login']

# Then define DepartmentSerializer which uses UserSerializer
class DepartmentSerializer(serializers.ModelSerializer):
    head = UserSerializer(read_only=True)
    members = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'head', 'members', 'created_at', 'updated_at']

    def get_members(self, obj):
        return UserSerializer(obj.users.all(), many=True).data

# Update UserSerializer to include department_details
UserSerializer.department_details = DepartmentSerializer(source='department', read_only=True)

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
        read_only_fields = ['created_at', 'updated_at']

    def get_head_name(self, obj):
        if obj.head:
            return f"{obj.head.first_name} {obj.head.last_name}".strip() or obj.head.username
        return "No Head Assigned"

    def get_members(self, obj):
        return UserSerializer(obj.users.all(), many=True).data

    def get_members_count(self, obj):
        return obj.members_count

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
            'weather_api_enabled',
            'weather_api_key',
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

class UserProfileSerializer(serializers.ModelSerializer):
    avatar_base64 = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'avatar', 'avatar_base64', 'avatar_url', 'bio', 
            'phone_number', 'location', 'linkedin', 'github', 
            'twitter', 'website', 'skills', 'theme_preference',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'avatar_url']
        extra_kwargs = {
            'avatar': {'required': False, 'allow_null': True, 'write_only': True},
            'bio': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': ''},
            'phone_number': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'location': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'linkedin': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'github': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'twitter': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'website': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': None},
            'skills': {'required': False, 'default': list, 'allow_null': True},
            'theme_preference': {'required': False, 'allow_blank': True, 'allow_null': True, 'default': 'light'},
        }

    def get_avatar_url(self, obj):
        if obj.avatar:
            try:
                return self.context['request'].build_absolute_uri(obj.avatar.url)
            except Exception:
                return None
        return None

    def validate(self, data):
        # Handle URL fields - convert empty strings and invalid URLs to None
        url_fields = ['linkedin', 'github', 'twitter', 'website']
        for field in url_fields:
            if field in data:
                value = data.get(field)
                if not value or (isinstance(value, str) and not value.strip()):
                    data[field] = None

        # Ensure skills is always a list
        if 'skills' in data and data['skills'] is None:
            data['skills'] = []

        return data

    def update(self, instance, validated_data):
        avatar_base64 = validated_data.pop('avatar_base64', None)
        
        if avatar_base64 and avatar_base64.strip():  # Only process if not empty
            try:
                if ';base64,' in avatar_base64:
                    format, imgstr = avatar_base64.split(';base64,')
                    ext = format.split('/')[-1]
                    data = ContentFile(base64.b64decode(imgstr), name=f'avatar_{instance.user.username}.{ext}')
                    instance.avatar = data
            except Exception as e:
                print(f"Error processing avatar: {e}")
                # If avatar processing fails, generate a default one
                instance.generate_avatar()

        # Handle skills separately to ensure it's always a list
        skills = validated_data.pop('skills', None)
        if skills is not None:
            instance.skills = skills if isinstance(skills, list) else []

        # Update other fields
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance 

class PasswordUpdateSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords don't match")
        return data

class TwoFactorSettingsSerializer(serializers.Serializer):
    enabled = serializers.BooleanField(required=True)
    verification_code = serializers.CharField(required=False, allow_blank=True)

class TaskExportSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=['csv', 'pdf'], required=True) 