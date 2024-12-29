from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Department, ActivityLog
from .serializers import UserSerializer, UserCreateSerializer, DepartmentSerializer, LoginResponseSerializer, ActivityLogSerializer, UserManagementSerializer, UserPasswordSerializer, DepartmentManagementSerializer, DepartmentStatsSerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count
from .utils import log_activity
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import BaseUserManager
from django.core.exceptions import ValidationError

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
        ip_address = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        user = authenticate(username=username, password=password)
        
        if user is not None and user.is_active:  # Check if user is active
            refresh = RefreshToken.for_user(user)
            
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
                'access': str(refresh.access_token),
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
            
            # Log failed login attempt with more details
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
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

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
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all()
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
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = Department.objects.all()
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(head__username__icontains=search)
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
        department.update_stats()
        log_activity(
            user=self.request.user,
            action='Department Created',
            target=f'Department: {department.name}',
            details='New department created',
            status='success',
            ip_address=self.request.META.get('REMOTE_ADDR', '0.0.0.0')
        )

    def perform_update(self, serializer):
        department = serializer.save()
        department.update_stats()
        log_activity(
            user=self.request.user,
            action='Department Updated',
            target=f'Department: {department.name}',
            details='Department details updated',
            status='success',
            ip_address=self.request.META.get('REMOTE_ADDR', '0.0.0.0')
        )

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