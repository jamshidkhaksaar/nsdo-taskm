from rest_framework import serializers
from django.utils import timezone
from rest_framework import serializers
from accounts.models import User
from .models import Backup

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
    class Meta:
        model = Backup
        fields = [
            'id',
            'created_at',
            'file',
            'description',
            'size',
            'is_restored'
        ]
        read_only_fields = [
            'id',
            'created_at',
            'size',
            'is_restored'
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['file'] = instance.file.url if instance.file else None
        return representation
from .models import Board, List, Card, Task

class TaskSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    assigned_to = serializers.StringRelatedField()
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
            'created_by',
            'assigned_to',
            'department',
            'is_private'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']

    def validate(self, data):
        # Validate due date is in the future
        if 'due_date' in data and data['due_date']:
            if data['due_date'] < timezone.now():
                raise serializers.ValidationError("Due date must be in the future")
        
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
        if user != instance.created_by and user != instance.assigned_to:
            raise serializers.ValidationError(
                "You don't have permission to update this task"
            )
        return super().update(instance, validated_data)

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Card
        fields = ['id', 'title', 'description', 'list', 'order', 'created_at', 'updated_at']

class ListSerializer(serializers.ModelSerializer):
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'title', 'board', 'order', 'cards', 'created_at']

class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Board
