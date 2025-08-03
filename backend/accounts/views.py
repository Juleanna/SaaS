from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import update_session_auth_hash
from decimal import Decimal
from .serializers import (
    CustomTokenObtainPairSerializer, UserRegistrationSerializer,
    UserProfileSerializer, UserUpdateSerializer, ChangePasswordSerializer,
    LoginSerializer
)
from .models import User


class CustomTokenObtainPairView(TokenObtainPairView):
    """Кастомний view для отримання JWT токенів"""
    serializer_class = CustomTokenObtainPairSerializer


class CustomTokenRefreshView(TokenRefreshView):
    """Кастомний view для оновлення JWT токенів"""
    pass


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
    """Кастомний view для входу в систему"""
    print(f"Login attempt - Request data: {request.data}")  # Debug log
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Генеруємо JWT токени
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
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
    
    print(f"Login failed - Serializer errors: {serializer.errors}")  # Debug log
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
            except:
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
    try:
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
        
        user = request.user
        
        # Імітуємо успішну оплату (в реальному проекті тут буде інтеграція з платіжною системою)
        # В майбутньому тут буде: Stripe, LiqPay, або інша платіжна система
        
        # Поповнюємо баланс
        user.balance += amount
        user.save()
        
        return Response({
            'message': f'Баланс успішно поповнено на {amount} ₴',
            'new_balance': float(user.balance)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': 'Помилка поповнення балансу'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 