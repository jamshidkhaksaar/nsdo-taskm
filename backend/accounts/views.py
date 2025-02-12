from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse, FileResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework_simplejwt.views import TokenObtainPairView
from django.db.models import Q
from .models import User, Department, ActivityLog, SystemSettings, Backup, UserProfile
from api.models import Task
from .serializers import (
    UserSerializer, UserCreateSerializer, DepartmentSerializer, 
    LoginResponseSerializer, ActivityLogSerializer, UserManagementSerializer, 
    UserPasswordSerializer, DepartmentManagementSerializer, DepartmentStatsSerializer, 
    SecuritySettingsSerializer, BackupSettingsSerializer, NotificationSettingsSerializer, 
    APISettingsSerializer, BackupSerializer, UserProfileSerializer,
    PasswordUpdateSerializer, TwoFactorSettingsSerializer, TaskExportSerializer
)
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Count
from .utils import log_activity
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError
import os
import shutil
from django.conf import settings
from rest_framework.parsers import MultiPartParser, JSONParser, FormParser
import json
from django.forms import model_to_dict
import re
import pyotp
import qrcode
import io
import base64
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from django.http import HttpResponse
import logging
from .renderers import CSVRenderer, PDFRenderer

logger = logging.getLogger(__name__)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt for user: {username}")  # Debug log
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            
            # Determine user role
            user_role = 'admin' if user.is_superuser else 'user'
            
            # Debug logging
            print("User authentication successful")
            print(f"Username: {user.username}")
            print(f"Email: {user.email}")
            print(f"Is superuser: {user.is_superuser}")
            print(f"Role assigned: {user_role}")
            
            response_data = {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': user_role,  # Explicitly set role
                }
            }
            
            print(f"Response data: {response_data}")  # Debug log
            return Response(response_data)
        else:
            print(f"Authentication failed for user: {username}")  # Debug log
            return Response({'error': 'Invalid credentials'}, status=401) 

@permission_classes([AllowAny])
class CreateAdminView(APIView):
    def post(self, request):
        try:
            # Add error handling for missing fields
            username = request.data.get('username')
            email = request.data.get('email')
            password = request.data.get('password')
            
            if not all([username, email, password]):
                return Response({
                    'error': 'Missing required fields'
                }, status=400)

            user = User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            return Response({
                'message': 'Admin user created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_superuser': user.is_superuser,
                    'role': 'admin'
                }
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=400) 

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')
        verification_code = request.data.get('verification_code')
        remember_me = request.data.get('remember_me', False)
        ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        user = authenticate(username=username, password=password)
        
        if user is not None and user.is_active:
            # Check if user has 2FA enabled
            if user.profile.two_factor_enabled:
                # If no verification code provided, return need_2fa flag
                if not verification_code:
                    return Response({
                        'need_2fa': True,
                        'message': 'Please provide 2FA verification code'
                    }, status=status.HTTP_200_OK)
                
                # Verify 2FA code
                try:
                    totp = pyotp.TOTP(user.profile.two_factor_secret)
                    if not totp.verify(verification_code.strip()):
                        log_activity(
                            user=user,
                            action='Failed Login Attempt',
                            target='2FA Verification',
                            details='Invalid 2FA code provided',
                            status='error',
                            ip_address=ip_address
                        )
                        return Response(
                            {'error': 'Invalid 2FA verification code'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except Exception as e:
                    log_activity(
                        user=user,
                        action='Failed Login Attempt',
                        target='2FA Verification',
                        details=f'2FA verification error: {str(e)}',
                        status='error',
                        ip_address=ip_address
                    )
                    return Response(
                        {'error': 'Failed to verify 2FA code'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Generate tokens with extended lifetime if remember_me is True
            refresh = RefreshToken.for_user(user)
            
            # Extend token lifetime if remember_me is True
            if remember_me:
                # Extend refresh token to 30 days and access token to 7 days for "remember me"
                refresh.set_exp(lifetime=timedelta(days=30))
                access_token = refresh.access_token
                access_token.set_exp(lifetime=timedelta(days=7))
            else:
                # Use default token lifetimes from settings
                access_token = refresh.access_token
            
            # Log successful login
            log_activity(
                user=user,
                action='User Login',
                target='System',
                details=f'Successful login from {request.META.get("HTTP_USER_AGENT", "Unknown Browser")}',
                status='success',
                ip_address=ip_address
            )
            
            response_data = {
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }
            return Response(response_data)
        else:
            # Try to get the user object even if authentication failed
            try:
                attempted_user = User.objects.get(username=username)
                if not attempted_user.is_active:
                    details = 'Account is inactive'
                else:
                    details = 'Invalid password'
            except User.DoesNotExist:
                details = 'User does not exist'
            
            # Log failed login attempt
            log_activity(
                user=None,
                action='Failed Login Attempt',
                target=f'Username: {username}',
                details=f'Failed login attempt: {details} from {request.META.get("HTTP_USER_AGENT", "Unknown Browser")}',
                status='error',
                ip_address=ip_address
            )
            
            return Response(
                {'error': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        department_id = request.query_params.get('department_id')
        if department_id:
            users = self.queryset.filter(department_id=department_id)
            serializer = self.get_serializer(users, many=True)
            return Response(serializer.data)
        return Response(
            {'error': 'department_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentManagementSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        department = self.get_object()
        users = User.objects.filter(department=department)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

class ActivityLogViewSet(viewsets.ModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = ActivityLog.objects.all()
        
        # Time range filter
        time_range = self.request.query_params.get('time_range', '24h')
        if time_range and time_range != 'all':
            now = timezone.now()
            if time_range == '1h':
                start_time = now - timedelta(hours=1)
            elif time_range == '24h':
                start_time = now - timedelta(days=1)
            elif time_range == '7d':
                start_time = now - timedelta(days=7)
            elif time_range == '30d':
                start_time = now - timedelta(days=30)
            queryset = queryset.filter(timestamp__gte=start_time)

        # Include logs without users (failed login attempts)
        queryset = queryset.filter(
            Q(user__isnull=True) |  # Include logs without users
            Q(user__isnull=False)   # And logs with users
        )

        return queryset.order_by('-timestamp')

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'])
    def log_activity(self, request):
        """
        Create a new activity log entry.
        """
        serializer = self.get_serializer(data={
            **request.data,
            'ip_address': request.META.get('REMOTE_ADDR', '0.0.0.0'),
            'user': request.user.id
        })
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """
        Delete multiple activity logs at once.
        """
        log_ids = request.data.get('log_ids', [])
        if not log_ids:
            return Response(
                {'error': 'No log IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Only allow admins to delete logs
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            deleted_count = ActivityLog.objects.filter(id__in=log_ids).delete()[0]
            return Response({
                'message': f'Successfully deleted {deleted_count} logs',
                'deleted_count': deleted_count
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def delete_all(self, request):
        """
        Delete all activity logs.
        """
        try:
            # Only allow admins to delete all logs
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # Log the deletion attempt before deleting everything
            log_activity(
                user=request.user,
                action='Delete All Logs',
                target='System',
                details='Deleted all activity logs',
                status='success',
                ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
            )

            # Delete all logs
            deleted_count = ActivityLog.objects.all().delete()[0]
            
            return Response({
                'message': f'Successfully deleted all logs ({deleted_count} entries)',
                'deleted_count': deleted_count
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """
        Override destroy method to add custom logic for single log deletion
        """
        try:
            # Only allow admins to delete logs
            if not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            instance = self.get_object()
            # Log the deletion activity
            log_activity(
                user=request.user,
                action='Delete Log',
                target=f'Log #{instance.id}',
                details=f'Deleted log entry: {instance.action} by {instance.user}',
                status='success',
                ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
            )
            
            self.perform_destroy(instance)
            return Response({
                'message': 'Log entry deleted successfully'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def debug(self, request):
        """
        Debug endpoint to check logs
        """
        try:
            logs = ActivityLog.objects.all()
            print(f"Total logs in database: {logs.count()}")
            print(f"User making request: {request.user.username}")
            print(f"Auth header: {request.META.get('HTTP_AUTHORIZATION', 'No auth header')}")
            
            for log in logs:
                print(f"Log: {log.action} by {log.user} at {log.timestamp}")
            
            return Response({
                'count': logs.count(),
                'logs': self.get_serializer(logs, many=True).data
            })
        except Exception as e:
            print(f"Debug endpoint error: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 

class UserManagementViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserManagementSerializer
    permission_classes = [IsAuthenticated]  # Set default permission
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'reset_password', 'toggle_status']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = User.objects.exclude(is_superuser=True)  # Exclude superusers from the list
        
        # If user is not admin, they can only see users in their department
        if not self.request.user.is_staff:
            queryset = queryset.filter(department=self.request.user.department)
        
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        try:
            user = self.get_object()
            password = request.data.get('password')

            if not password:
                return Response(
                    {'error': 'Password is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate password
            try:
                validate_password(password, user)
            except ValidationError as e:
                return Response(
                    {'error': str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Set the new password
            user.set_password(password)
            user.save()

            # Log the password reset
            log_activity(
                user=request.user,
                action='Password Reset',
                target=f'User: {user.username}',
                details='Password was reset',
                status='success',
                ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
            )

            return Response({
                'message': 'Password reset successful'
            })

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.status = 'inactive' if user.status == 'active' else 'active'
        user.save()
        
        # Log the status change
        log_activity(
            user=request.user,
            action=f'User Status Changed',
            target=f'User: {user.username}',
            details=f'Status changed to {user.status}',
            status='success',
            ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
        )
        
        return Response({
            'status': user.status,
            'message': f'User status changed to {user.status}'
        })

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        
        # Don't allow deleting yourself
        if user == request.user:
            return Response(
                {'error': 'Cannot delete your own account'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Log the deletion
        log_activity(
            user=request.user,
            action='User Deleted',
            target=f'User: {user.username}',
            details=f'User account deleted',
            status='success',
            ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
        )
        
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        try:
            # Get password from request data if provided
            password = self.request.data.get('password')
            
            # Create the user first
            user = serializer.save()
            
            if password:
                # Use provided password
                user.set_password(password)
            else:
                # Generate random password
                password = BaseUserManager().make_random_password()
                user.set_password(password)
            
            user.save()
            
            # Log the creation
            log_activity(
                user=self.request.user,
                action='User Created',
                target=f'User: {user.username}',
                details=f'New user account created',
                status='success',
                ip_address=self.request.META.get('REMOTE_ADDR', '0.0.0.0')
            )
            
            # Return success response with user data and password (if generated)
            return Response({
                'user': UserManagementSerializer(user).data,
                'default_password': None if password in self.request.data else password,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"Error creating user: {str(e)}")
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return self.perform_create(serializer)

class DepartmentManagementViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentManagementSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'update_head', 'performance']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Department.objects.all()
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['post'])
    def update_head(self, request, pk=None):
        department = self.get_object()
        new_head_id = request.data.get('head_id')
        
        try:
            new_head = User.objects.get(id=new_head_id)
            department.head = new_head
            department.save(user=request.user)
            
            return Response({
                'message': f'Department head updated to {new_head.get_full_name()}',
                'department': self.get_serializer(department).data
            })
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def performance(self, request, pk=None):
        department = self.get_object()
        # Here you would calculate performance metrics
        # This is a placeholder until you implement the project model
        return Response({
            'completion_rate': department.completion_rate,
            'active_projects': department.active_projects,
            'members_count': department.members_count,
            # Add more metrics as needed
        })

    def perform_create(self, serializer):
        department = serializer.save()
        try:
            department.update_stats()
        except Exception as e:
            print(f"Error updating department stats: {e}")
            # Continue even if stats update fails
        return department

    def perform_update(self, serializer):
        department = serializer.save()
        try:
            department.update_stats()
        except Exception as e:
            print(f"Error updating department stats: {e}")
            # Continue even if stats update fails
        return department

    def perform_destroy(self, instance):
        name = instance.name
        log_activity(
            user=self.request.user,
            action='Department Deleted',
            target=f'Department: {name}',
            details='Department deleted',
            status='success',
            ip_address=self.request.META.get('REMOTE_ADDR', '0.0.0.0')
        )
        instance.delete() 

class DashboardViewSet(viewsets.ViewSet):
    permission_classes = [IsAdminUser]

    def list(self, request):
        try:
            # Get basic stats - exclude superuser from count
            total_users = User.objects.exclude(is_superuser=True).count()
            total_departments = Department.objects.count()
            active_users = User.objects.filter(is_active=True).exclude(is_superuser=True).count()
            
            # Get recent activities
            recent_activities = ActivityLog.objects.select_related('user').all()[:5]

            # Get department statistics with prefetch_related for efficiency
            departments = Department.objects.prefetch_related('users').all()
            department_stats = []
            for dept in departments:
                dept_data = {
                    'id': dept.id,
                    'name': dept.name,
                    'members_count': dept.users.count(),
                    'active_projects': dept.active_projects,
                    'completion_rate': dept.completion_rate
                }
                department_stats.append(dept_data)

            # Get user activity stats by date
            now = timezone.now()
            last_30_days = now - timedelta(days=30)
            user_activities = ActivityLog.objects.filter(
                timestamp__gte=last_30_days
            ).extra(
                select={'date': 'DATE(timestamp)'}
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')

            # Format the response
            response_data = {
                'stats': {  # Wrap stats in a stats object
                    'total_users': total_users,
                    'total_departments': total_departments,
                    'active_users': active_users,
                    'total_projects': 0,  # Will be implemented with projects
                },
                'recent_activities': ActivityLogSerializer(recent_activities, many=True).data,
                'department_stats': department_stats,
                'user_stats': {
                    'labels': [str(stat['date']) for stat in user_activities],
                    'data': [stat['count'] for stat in user_activities]
                }
            }

            print("Dashboard response:", response_data)  # Debug log
            return Response(response_data)

        except Exception as e:
            print("Dashboard error:", str(e))  # Debug log
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def department_performance(self, request):
        try:
            departments = Department.objects.all()
            serializer = DepartmentStatsSerializer(departments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def user_activities(self, request):
        try:
            days = int(request.query_params.get('days', 30))
            now = timezone.now()
            start_date = now - timedelta(days=days)
            
            activities = ActivityLog.objects.filter(
                timestamp__gte=start_date
            ).extra(
                select={'date': 'DATE(timestamp)'}
            ).values('date').annotate(
                count=Count('id')
            ).order_by('date')

            return Response({
                'labels': [str(act['date']) for act in activities],
                'data': [act['count'] for act in activities]
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 

class SecuritySettingsViewSet(viewsets.ModelViewSet):
    serializer_class = SecuritySettingsSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        # Get or create settings object
        settings, _ = SystemSettings.objects.get_or_create(pk=1)
        return settings

    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            
            # Save with user and IP information
            serializer.save(
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
            )

            # Apply settings immediately
            self.apply_security_settings(serializer.validated_data)

            return Response({
                'message': 'Security settings updated successfully',
                'settings': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def apply_security_settings(self, settings):
        """Apply security settings to the system"""
        from django.conf import settings as django_settings
        
        # Update session timeout
        if 'session_timeout_minutes' in settings:
            django_settings.SESSION_COOKIE_AGE = settings['session_timeout_minutes'] * 60

        # Update password settings
        if 'password_complexity_required' in settings:
            # You might want to update password validators here
            pass

        # Update login attempt settings
        if 'max_login_attempts' in settings:
            # You might want to configure your authentication backend
            pass 

class NotificationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAdminUser]

    def get_object(self):
        settings, _ = SystemSettings.objects.get_or_create(pk=1)
        return settings

    @action(detail=False, methods=['post'])
    def test_email(self, request):
        # Implement email test logic here
        pass

class APISettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = APISettingsSerializer
    
    def get_object(self):
        # Get or create the settings object
        obj, created = SystemSettings.objects.get_or_create(pk=1)
        return obj

    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        profile, created = UserProfile.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        
        # Handle PUT/PATCH
        try:
            # Remove avatar-related fields if they're in the request data
            data = request.data.copy()
            if 'avatar' in data:
                del data['avatar']
            if 'avatar_url' in data:
                del data['avatar_url']

            # Convert empty strings to None for certain fields
            for field in ['phone_number', 'location', 'linkedin', 'github', 'twitter', 'website']:
                if field in data and data[field] == '':
                    data[field] = None

            print("Cleaned received data:", data)  # Debug log
            partial = request.method == 'PATCH'
            serializer = self.get_serializer(profile, data=data, partial=partial)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            
            print("Validation errors:", serializer.errors)  # Debug log
            return Response(
                {
                    'error': 'Validation failed',
                    'details': serializer.errors
                }, 
                status=400
            )
        except Exception as e:
            print(f"Error updating profile: {str(e)}")  # Debug log
            return Response(
                {'error': f'Failed to update profile: {str(e)}'}, 
                status=400
            ) 

class UserSettingsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        return Response({'message': 'Settings API'})

    @action(detail=False, methods=['get'])
    def two_factor_status(self, request):
        """Get the current 2FA status for the user"""
        try:
            profile = request.user.profile
            return Response({
                'enabled': profile.two_factor_enabled,
                'setup_pending': bool(profile.two_factor_secret and not profile.two_factor_enabled)
            })
        except Exception as e:
            logger.error(f"Error getting 2FA status: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def setup_2fa(self, request):
        """Set up or disable 2FA for the user"""
        serializer = TwoFactorSettingsSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            enabled = serializer.validated_data['enabled']
            
            try:
                if enabled:
                    if user.profile.two_factor_enabled:
                        return Response(
                            {'error': '2FA is already enabled'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Generate secret key for user
                    secret = pyotp.random_base32()
                    user.profile.two_factor_secret = secret
                    user.profile.two_factor_enabled = False  # Not enabled until verified
                    user.profile.save()
                    
                    # Generate QR code
                    totp = pyotp.TOTP(secret)
                    provisioning_uri = totp.provisioning_uri(
                        user.email,
                        issuer_name="Task Management System"
                    )
                    
                    qr = qrcode.QRCode(version=1, box_size=10, border=5)
                    qr.add_data(provisioning_uri)
                    qr.make(fit=True)
                    
                    img = qr.make_image(fill_color="black", back_color="white")
                    buffer = io.BytesIO()
                    img.save(buffer, format="PNG")
                    qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
                    
                    return Response({
                        'qr_code': f"data:image/png;base64,{qr_code_base64}",
                        'secret': secret,
                        'message': '2FA setup initiated. Please scan the QR code and verify.'
                    })
                else:
                    # Disable 2FA
                    user.profile.two_factor_enabled = False
                    user.profile.two_factor_secret = None
                    user.profile.save()
                    
                    return Response({
                        'message': '2FA disabled successfully'
                    })
                    
            except Exception as e:
                return Response(
                    {'error': f'Failed to setup 2FA: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['post'])
    def verify_2fa(self, request):
        """Verify 2FA setup with a verification code"""
        code = request.data.get('verification_code')
        if not code or not code.strip():
            return Response(
                {'error': 'Verification code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = request.user
        secret = user.profile.two_factor_secret
        
        if not secret:
            return Response(
                {'error': '2FA setup not initiated. Please enable 2FA first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if user.profile.two_factor_enabled:
            return Response(
                {'error': '2FA is already enabled'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            totp = pyotp.TOTP(secret)
            if totp.verify(code.strip()):
                user.profile.two_factor_enabled = True
                user.profile.save()
                
                # Log the successful 2FA setup
                log_activity(
                    user=user,
                    action='2FA Enabled',
                    target='User Settings',
                    details='Two-factor authentication was enabled successfully',
                    status='success',
                    ip_address=request.META.get('REMOTE_ADDR', '0.0.0.0')
                )
                
                return Response({
                    'message': '2FA verified and enabled successfully'
                })
            else:
                return Response(
                    {'error': 'Invalid verification code. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {'error': f'Failed to verify 2FA: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(
        detail=False,
        methods=['get'],
        url_path='download-tasks',
        url_name='download-tasks',
        renderer_classes=[CSVRenderer, PDFRenderer],
        permission_classes=[IsAuthenticated]
    )
    def download_tasks(self, request):
        logger.info(f"Download tasks called with format: {request.query_params.get('format')}")
        logger.info(f"Request path: {request.path}")
        logger.info(f"Request method: {request.method}")
        logger.info(f"User: {request.user}")
        
        try:
            format_type = request.query_params.get('format', 'csv')
            print(f"Received download request for format: {format_type}")

            if format_type not in ['csv', 'pdf']:
                return Response(
                    {'error': 'Invalid format type. Must be csv or pdf'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            user = request.user
            user_id_str = str(user.id)
            
            # Get all tasks
            tasks = Task.objects.filter(
                Q(created_by=user)
            ).select_related('created_by', 'department')

            # Filter tasks where user is assigned
            all_tasks = []
            for task in tasks:
                if task.assigned_to:
                    try:
                        assigned_users = json.loads(task.assigned_to)
                        if user_id_str in assigned_users:
                            all_tasks.append(task)
                    except json.JSONDecodeError:
                        continue
                else:
                    all_tasks.append(task)

            if not all_tasks:
                return Response(
                    {'error': 'No tasks found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if format_type == 'csv':
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="tasks.csv"'
                
                writer = csv.writer(response)
                writer.writerow([
                    'Title', 'Description', 'Status', 'Priority',
                    'Created Date', 'Due Date', 'Department',
                    'Created By', 'Assigned To'
                ])
                
                for task in all_tasks:
                    # Get assigned users' usernames
                    assigned_users = []
                    if task.assigned_to:
                        try:
                            assigned_user_ids = json.loads(task.assigned_to)
                            assigned_users = User.objects.filter(
                                id__in=assigned_user_ids
                            ).values_list('username', flat=True)
                        except (json.JSONDecodeError, User.DoesNotExist):
                            pass

                    writer.writerow([
                        task.title,
                        task.description or '',
                        task.get_status_display(),
                        task.get_priority_display(),
                        task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        task.due_date.strftime('%Y-%m-%d %H:%M:%S') if task.due_date else '',
                        task.department.name if task.department else '',
                        task.created_by.username if task.created_by else '',
                        ', '.join(assigned_users)
                    ])
                
                return response
            else:  # pdf
                buffer = io.BytesIO()
                doc = SimpleDocTemplate(buffer, pagesize=letter)
                elements = []
                
                # Update PDF headers to match CSV
                data = [
                    ['Title', 'Description', 'Status', 'Priority',
                     'Created Date', 'Due Date', 'Department',
                     'Created By', 'Assigned To']
                ]
                
                for task in all_tasks:
                    # Get assigned users' usernames
                    assigned_users = []
                    if task.assigned_to:
                        try:
                            assigned_user_ids = json.loads(task.assigned_to)
                            assigned_users = User.objects.filter(
                                id__in=assigned_user_ids
                            ).values_list('username', flat=True)
                        except (json.JSONDecodeError, User.DoesNotExist):
                            pass

                    data.append([
                        task.title,
                        task.description or '',
                        task.get_status_display(),
                        task.get_priority_display(),
                        task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                        task.due_date.strftime('%Y-%m-%d %H:%M:%S') if task.due_date else '',
                        task.department.name if task.department else '',
                        task.created_by.username if task.created_by else '',
                        ', '.join(assigned_users)
                    ])
                
                # Adjust table style for better readability
                table = Table(data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),  # Left align for better readability
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.white),  # White background for data
                    ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                    ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                    ('FONTSIZE', (0, 1), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('WORDWRAP', (0, 0), (-1, -1), True),  # Enable word wrapping
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),  # Add some padding
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ]))
                
                # Add title to the PDF
                elements.append(Paragraph(
                    'Task Report',
                    getSampleStyleSheet()['Heading1']
                ))
                elements.append(Spacer(1, 12))  # Add some space
                elements.append(table)
                
                doc.build(elements)
                
                buffer.seek(0)
                response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = 'attachment; filename="tasks.pdf"'
                return response

        except Exception as e:
            logger.error(f"Error in download_tasks: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 