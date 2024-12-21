from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from typing import Dict, Any, Union, Type, Optional, Mapping, Tuple, Final
from django.contrib.auth.models import AbstractUser


# Define User type explicitly instead of using get_user_model()
UserModel = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = UserModel
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data: Dict[str, Any]) -> AbstractUser:
        user = UserModel.objects.create_user(**validated_data)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        # Get the token data from the parent class
        base_data = super().validate(attrs)

        if self.user is None:
            return base_data

        # Add user information to the existing dictionary
        base_data['user_id'] = str(self.user.id)
        base_data['username'] = str(self.user.username)
        base_data['email'] = str(self.user.email)

        return base_data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer