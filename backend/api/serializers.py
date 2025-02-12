from rest_framework import serializers
from django.utils import timezone
from accounts.models import User, SystemSettings
from .models import Backup, Task, Note

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'role',
            'departments',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']

class UserLimitedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email', 'first_name', 'last_name']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['id'] = str(instance.id)  # Convert ID to string for consistency
        return ret

class BackupSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    
    class Meta:
        model = Backup
        fields = [
            'id',
            'name',
            'timestamp',
            'created_by',
            'file',
            'description',
            'size',
            'type',
            'status',
            'is_restored',
            'error_message'
        ]
        read_only_fields = [
            'id',
            'timestamp',
            'created_by',
            'size',
            'is_restored'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['file'] = instance.file.url if instance.file else None
        # Convert size to human readable format
        if instance.size:
            for unit in ['B', 'KB', 'MB', 'GB']:
                if instance.size < 1024:
                    representation['size'] = f"{instance.size:.1f} {unit}"
                    break
                instance.size /= 1024
        return representation

class TaskSerializer(serializers.ModelSerializer):
    created_by = UserLimitedSerializer(read_only=True)
    assigned_to = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True
    )
    department = serializers.StringRelatedField()
    assigned_users = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'created_at',
            'created_at_formatted',
            'due_date',
            'status',
            'priority',
            'created_by',
            'assigned_to',
            'assigned_users',
            'department',
            'is_private',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'created_at_formatted', 'assigned_users']

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%Y-%m-%d %H:%M:%S")

    def get_assigned_users(self, obj):
        # Get the full user objects for assigned users
        assigned_ids = obj.get_assigned_users()
        if not assigned_ids:
            return []
        
        users = User.objects.filter(id__in=assigned_ids)
        return UserLimitedSerializer(users, many=True).data

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['assigned_to'] = instance.get_assigned_users()
        return ret

    def validate(self, data):
        # Validate due date is in the future
        if 'due_date' in data and data['due_date']:
            if data['due_date'] < timezone.now():
                raise serializers.ValidationError("Due date must be in the future")
        
        # Validate priority if provided
        if 'priority' in data:
            priority = data['priority'].lower()
            if priority not in ['low', 'medium', 'high']:
                raise serializers.ValidationError("Priority must be one of: low, medium, high")
            data['priority'] = priority
        
        # Validate status if provided
        if 'status' in data:
            status = data['status'].lower()
            if status not in ['pending', 'in_progress', 'completed', 'cancelled']:
                raise serializers.ValidationError("Status must be one of: pending, in_progress, completed, cancelled")
            data['status'] = status
        
        return data

    def create(self, validated_data):
        # Set the created_by field to the current user
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Only allow the creator or assigned user to update the task
        user = self.context['request'].user
        user_id_str = str(user.id)
        assigned_users = instance.get_assigned_users()
        if (user != instance.created_by and 
            (not assigned_users or user_id_str not in assigned_users)):
            raise serializers.ValidationError(
                "You don't have permission to update this task"
            )
        return super().update(instance, validated_data)

class NoteSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Note
        fields = [
            'id',
            'content',
            'color',
            'created_by',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by']

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
