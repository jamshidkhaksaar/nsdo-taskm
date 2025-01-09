from rest_framework import serializers
from rest_framework import serializers
from .models import Backup

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
from .models import Board, List, Card

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
