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
    created_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True
    )
    department = serializers.StringRelatedField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'created_at',
            'due_date',
            'status',
            'priority',
            'created_by',
            'assigned_to',
            'department',
            'is_private'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['assigned_to'] = instance.get_assigned_users()
        return ret

    def to_internal_value(self, data):
        internal_value = super().to_internal_value(data)
        if 'assigned_to' in internal_value:
            instance = self.instance or Task()
            instance.set_assigned_users(internal_value['assigned_to'])
            internal_value['assigned_to'] = instance.assigned_to
        return internal_value

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
        
        # Validate status transitions
        if self.instance and 'status' in data:
            current_status = self.instance.status
            new_status = data['status']
            
            valid_transitions = {
                'todo': ['in_progress'],
                'in_progress': ['done'],
                'done': []
            }
            
            if new_status not in valid_transitions.get(current_status, []):
                raise serializers.ValidationError(
                    f"Invalid status transition from {current_status} to {new_status}"
                )
        
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

class UserLimitedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']
        read_only_fields = ['id', 'email', 'first_name', 'last_name']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['id'] = str(instance.id)  # Convert ID to string for consistency
        return ret

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
