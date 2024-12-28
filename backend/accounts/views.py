from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny

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