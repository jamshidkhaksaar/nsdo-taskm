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
from .models import User, Department
from .serializers import UserSerializer, UserCreateSerializer, DepartmentSerializer, LoginResponseSerializer

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
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data['username'])
            serializer = LoginResponseSerializer(data={
                'access': response.data['access'],
                'refresh': response.data['refresh'],
                'user': UserSerializer(user).data
            })
            serializer.is_valid(raise_exception=True)
            return Response(serializer.data)
        return response

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