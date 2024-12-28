from django.contrib import admin
from .models import Board, List, Card

@admin.register(Board)
class BoardAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'created_at', 'updated_at')
    search_fields = ('title', 'owner__username')
    list_filter = ('created_at', 'updated_at')

@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('title', 'board', 'order', 'created_at')
    search_fields = ('title', 'board__title')
    list_filter = ('created_at',)

@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
    list_display = ('title', 'list', 'order', 'created_at', 'updated_at')
    search_fields = ('title', 'description', 'list__title')
    list_filter = ('created_at', 'updated_at')
