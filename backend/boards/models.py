from django.db import models
from django.contrib.auth.models import User
from typing import Any, Union, Optional
from django.db.models import NOT_PROVIDED

class Board(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_boards')
    members = models.ManyToManyField(User, related_name='member_boards', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return str(self.title)

class List(models.Model):
    title = models.CharField(max_length=200)
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='lists')
    order = models.IntegerField(default=NOT_PROVIDED, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return str(self.title)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.order is None:
            self.order = 0
        super().save(*args, **kwargs)

class Card(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='cards')
    order = models.IntegerField(default=NOT_PROVIDED, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return str(self.title)

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.order is None:
            self.order = 0
        super().save(*args, **kwargs)

class Comment(models.Model):
    text = models.TextField()
    card = models.ForeignKey(Card, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        # Safely handle potential None values
        author_username = getattr(self.author, 'username', 'Unknown')
        card_title = getattr(self.card, 'title', 'Untitled')
        return str(f"Comment by {author_username} on {card_title}")