from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Docente, Usuario


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined']
        read_only_fields = ['date_joined']


class DocenteSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = Docente
        fields = ['id', 'user', 'user_id', 'activo']


class UsuarioSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = Usuario
        fields = ['id', 'user', 'user_id', 'activo']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.get_full_name()
        if hasattr(user, 'docente'):
            token['role'] = 'docente'
        elif hasattr(user, 'usuario'):
            token['role'] = 'secretaria'
        elif user.is_staff:
            token['role'] = 'admin'
        else:
            token['role'] = 'sin_perfil'
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        user = self.user
        if hasattr(user, 'docente'):
            data['role'] = 'docente'
        elif hasattr(user, 'usuario'):
            data['role'] = 'secretaria'
        elif user.is_staff:
            data['role'] = 'admin'
        else:
            data['role'] = 'sin_perfil'
        return data
