from rest_framework import viewsets, permissions, status
from .models import Board, List, Card, Comment
from .serializers import BoardSerializer, ListSerializer, CardSerializer, CommentSerializer
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from django.views.decorators.csrf import csrf_exempt
from django.db import models as django_models
from typing import Type, Union, Any, Optional, cast
from django.db.models.query import QuerySet
from .model_manager import get_safe_manager
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import F, Prefetch
from django.contrib.auth.models import User
from .type_hints import safe_model_access, safe_queryset_get, _safe_foreign_key_access

class BoardViewSet(viewsets.ModelViewSet):
    serializer_class = BoardSerializer
    permission_classes = [IsAuthenticated]
    queryset = get_safe_manager(Board).all()

    def get_queryset(self) -> Optional[QuerySet[Board]]:  # type: ignore
        return get_safe_manager(Board).filter(
            django_models.Q(members=self.request.user) | 
            django_models.Q(owner=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsAuthenticated]
    queryset = get_safe_manager(List).all()

    def get_queryset(self) -> Optional[QuerySet[List]]:  # type: ignore
        return get_safe_manager(List).filter(
            django_models.Q(board__members=self.request.user) | 
            django_models.Q(board__owner=self.request.user)
        )

class CardViewSet(viewsets.ModelViewSet):
    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self) -> Optional[QuerySet[Card]]:  # type: ignore
        return get_safe_manager(Card).filter(
            django_models.Q(list__board__members=self.request.user) | 
            django_models.Q(list__board__owner=self.request.user)
        )

    @action(detail=False, methods=['POST'])
    def update_card_position(self, request):
        # Extract parameters
        card_id = request.data.get('cardId')
        source_list_id = request.data.get('sourceListId')
        dest_list_id = request.data.get('destListId')

        # Fetch card and lists using safe access methods
        card_manager = get_safe_manager(Card)
        card_wrapper = safe_queryset_get(card_manager.objects, pk=card_id)
        
        # Fetch source and destination lists
        list_manager = get_safe_manager(List)
        source_list_wrapper = safe_queryset_get(list_manager.objects, pk=source_list_id)
        dest_list_wrapper = safe_queryset_get(list_manager.objects, pk=dest_list_id)

        # Access underlying model instances
        card = card_wrapper.get_instance()
        source_list = source_list_wrapper.get_instance()
        dest_list = dest_list_wrapper.get_instance()

        # Validate retrieved instances
        if card is None or source_list is None or dest_list is None:
            return Response(
                {'error': 'One or more required objects not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Safely access board
        source_board = getattr(source_list, 'board', None)
        if source_board is None:
            return Response(
                {'error': 'No board found for source list'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check user permissions
        source_board_owner = getattr(source_board, 'owner', None)
        source_board_members = getattr(source_board, 'members', [])

        if not (source_board_owner == request.user or 
                request.user in source_board_members):
            return Response(
                {'error': 'You do not have permission to move this card'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update card's list relationship
        if hasattr(card, 'list'):
            setattr(card, 'list', dest_list)
            card.save(update_fields=['list'])
        else:
            return Response(
                {'error': 'Cannot update card list'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user) 

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]
    queryset = get_safe_manager(Comment).all()

    def get_queryset(self) -> Optional[QuerySet[Comment]]:  # type: ignore
        return get_safe_manager(Comment).filter(
            django_models.Q(card__list__board__members=self.request.user) | 
            django_models.Q(card__list__board__owner=self.request.user)
        )

    def perform_create(self, serializer):
        serializer.save(author=self.request.user) 

@csrf_exempt
@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])
def login_view(request):
    if request.method == 'OPTIONS':
        response = Response()
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Explicitly generate tokens
        refresh = RefreshToken.for_user(user)
        access = AccessToken.for_user(user)
        response = Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            'refresh': str(refresh),
            'token': str(access)  # Use AccessToken directly
        })
        return response

    except Exception as e:
        print(f"Login error: {str(e)}")
        return Response(
            {'error': 'An error occurred during login'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )