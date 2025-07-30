from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Кастомний серіалізатор для JWT токенів"""
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Додаємо інформацію про користувача
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'company_name': self.user.company_name,
            'subscription_plan': self.user.subscription_plan,
            'is_subscribed': self.user.is_subscribed,
        }
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Серіалізатор для реєстрації користувачів"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'email', 'username', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'company_name'
        )
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Паролі не співпадають")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Серіалізатор для профілю користувача"""
    
    avatar = serializers.SerializerMethodField()
    avg_spending = serializers.ReadOnlyField()
    
    def get_avatar(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'username', 'first_name', 'last_name',
            'phone', 'company_name', 'avatar', 'telegram_username', 'telegram_chat_id',
            'instagram_username', 'email_notifications', 'telegram_notifications',
            'subscription_plan', 'is_subscribed', 'balance', 'monthly_spending', 
            'total_spent', 'avg_spending', 'date_joined'
        )
        read_only_fields = ('id', 'email', 'date_joined', 'balance', 'monthly_spending', 'total_spent')


class UserUpdateSerializer(serializers.ModelSerializer):
    """Серіалізатор для оновлення профілю користувача"""
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'phone', 'company_name',
            'telegram_username', 'telegram_chat_id', 'instagram_username',
            'email_notifications', 'telegram_notifications'
        )


class ChangePasswordSerializer(serializers.Serializer):
    """Серіалізатор для зміни пароля"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Нові паролі не співпадають")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Неправильний поточний пароль")
        return value


class LoginSerializer(serializers.Serializer):
    """Серіалізатор для входу в систему"""
    
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Сначала попробуем найти пользователя по email
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
            
            if not user:
                raise serializers.ValidationError("Неправильний email або пароль")
            if not user.is_active:
                raise serializers.ValidationError("Обліковий запис деактивовано")
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Необхідно вказати email та пароль")
        
        return attrs 