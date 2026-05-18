from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import Docente, Usuario
from .serializers import (
    UserSerializer,
    DocenteSerializer,
    UsuarioSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdminUser


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Se requiere el token de refresco.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Sesión cerrada correctamente.'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        if hasattr(user, 'docente'):
            data['perfil'] = 'docente'
            data['docente'] = DocenteSerializer(user.docente).data
        elif hasattr(user, 'usuario'):
            data['perfil'] = 'secretaria'
            data['usuario'] = UsuarioSerializer(user.usuario).data
        elif user.is_staff:
            data['perfil'] = 'admin'
        else:
            data['perfil'] = 'sin_perfil'
        return Response(data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DocenteListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Docente.objects.select_related('user').all()
    serializer_class = DocenteSerializer


class DocenteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Docente.objects.select_related('user').all()
    serializer_class = DocenteSerializer


class UsuarioListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = Usuario.objects.select_related('user').all()
    serializer_class = UsuarioSerializer


class UsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = Usuario.objects.select_related('user').all()
    serializer_class = UsuarioSerializer
