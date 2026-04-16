from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from django.db import transaction
from decimal import Decimal
import logging

from .authentication import (
    ACCESS_COOKIE_NAME,
    REFRESH_COOKIE_NAME,
    clear_auth_cookies,
    set_auth_cookies,
)

logger = logging.getLogger(__name__)
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserProfileSerializer, UserUpdateSerializer, ChangePasswordSerializer,
    LoginSerializer
)
from .models import User


class CustomTokenObtainPairView(TokenObtainPairView):
    """Отримання JWT: access/refresh встановлюються як httpOnly cookies."""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access = response.data.get('access')
            refresh = response.data.get('refresh')
            set_auth_cookies(response, access, refresh)
            # Прибираємо токени з тіла відповіді — вони вже в cookies
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """Оновлення JWT: бере refresh з cookie, встановлює нові access/refresh в cookies."""

    def post(self, request, *args, **kwargs):
        refresh_cookie = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if refresh_cookie and 'refresh' not in request.data:
            # Підмішуємо refresh з cookie щоб серіалізатор міг його провалідувати
            request.data._mutable = True if hasattr(request.data, '_mutable') else None
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['refresh'] = refresh_cookie
            request._full_data = data
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access = response.data.get('access')
            refresh = response.data.get('refresh')
            set_auth_cookies(response, access, refresh)
            response.data.pop('access', None)
            response.data.pop('refresh', None)
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Вихід із системи — видаляє auth cookies і блеклистить refresh."""
    refresh_cookie = request.COOKIES.get(REFRESH_COOKIE_NAME)
    if refresh_cookie:
        try:
            token = RefreshToken(refresh_cookie)
            token.blacklist()
        except (TokenError, InvalidToken):
            pass
    response = Response({'message': 'Вихід виконано'}, status=status.HTTP_200_OK)
    clear_auth_cookies(response)
    return response


class UserRegistrationView(generics.CreateAPIView):
    """View для реєстрації користувачів"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View для перегляду та оновлення профілю користувача"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserUpdateView(generics.UpdateAPIView):
    """View для оновлення профілю користувача"""
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Зміна пароля користувача"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Оновлюємо сесію після зміни пароля
        update_session_auth_hash(request, user)
        
        return Response({'message': 'Пароль успішно змінено'}, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Вхід у систему. Токени встановлюються як httpOnly cookies."""
    serializer = LoginSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)

    response = Response({
        'user': {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'company_name': user.company_name,
            'subscription_plan': user.subscription_plan,
            'is_subscribed': user.is_subscribed,
        }
    }, status=status.HTTP_200_OK)
    set_auth_cookies(response, refresh.access_token, refresh)
    return response


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """Отримання інформації про поточного користувача"""
    user = request.user
    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """Завантаження аватару користувача"""
    if 'avatar' not in request.FILES:
        return Response({'error': 'Файл аватару не знайдено'}, status=status.HTTP_400_BAD_REQUEST)
    
    avatar_file = request.FILES['avatar']
    
    # Перевіряємо розмір файлу (максимум 5MB)
    if avatar_file.size > 5 * 1024 * 1024:
        return Response({'error': 'Розмір файлу не повинен перевищувати 5MB'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Перевіряємо тип файлу
    if not avatar_file.content_type.startswith('image/'):
        return Response({'error': 'Файл повинен бути зображенням'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Зберігаємо аватар
        user = request.user
        
        # Видаляємо старий аватар, якщо він існує
        if user.avatar:
            try:
                user.avatar.delete(save=False)
            except (OSError, ValueError):
                pass
        
        user.avatar = avatar_file
        user.save()
        
        # Формуємо повний URL для аватару
        avatar_url = None
        if user.avatar:
            avatar_url = request.build_absolute_uri(user.avatar.url)
        
        return Response({
            'message': 'Аватар успішно завантажено',
            'avatar_url': avatar_url
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': 'Помилка збереження аватару'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def top_up_balance(request):
    """Поповнення балансу користувача"""
    amount = request.data.get('amount')

    if not amount:
        return Response({'error': 'Сума поповнення обов\'язкова'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        amount = Decimal(str(amount))
    except (ValueError, TypeError):
        return Response({'error': 'Неправильний формат суми'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Сума повинна бути більше нуля'}, status=status.HTTP_400_BAD_REQUEST)

    if amount > Decimal('10000'):
        return Response({'error': 'Максимальна сума поповнення: 10,000 ₴'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            user = User.objects.select_for_update().get(pk=request.user.pk)
            user.balance += amount
            user.save(update_fields=['balance'])
            new_balance = user.balance
    except Exception:
        logger.exception('Failed to top up balance for user %s', request.user.pk)
        return Response({'error': 'Помилка поповнення балансу'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'message': f'Баланс успішно поповнено на {amount} ₴',
        'new_balance': float(new_balance)
    }, status=status.HTTP_200_OK)