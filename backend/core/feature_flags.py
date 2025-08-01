"""
Feature Flags система для SaaS платформи

Дозволяє вмикати/вимикати функції для різних рівнів користувачів
"""

from django.conf import settings
from django.core.cache import cache
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class FeatureFlags:
    """Менеджер feature flags"""
    
    # Дефолтні налаштування feature flags
    DEFAULT_FLAGS = {
        # Warehouse функції
        'warehouse_advanced_features': {
            'enabled': False,
            'description': 'Розширені функції складського обліку (FIFO/LIFO, партії, інвентаризація)',
            'user_types': ['premium', 'enterprise'],
            'requires_subscription': True
        },
        
        # Штрихкоди та QR коди
        'barcode_generation': {
            'enabled': True,
            'description': 'Автоматична генерація штрихкодів та QR кодів',
            'user_types': ['basic', 'premium', 'enterprise'],
            'requires_subscription': False
        },
        
        # Прайс-листи
        'advanced_pricing': {
            'enabled': False,
            'description': 'Розширені функції ціноутворення (формули, масові оновлення)',
            'user_types': ['premium', 'enterprise'],
            'requires_subscription': True
        },
        
        # Телеграм бот
        'telegram_integration': {
            'enabled': False,
            'description': 'Інтеграція з Telegram ботом',
            'user_types': ['premium', 'enterprise'],
            'requires_subscription': True
        },
        
        # Аналітика
        'advanced_analytics': {
            'enabled': False,
            'description': 'Розширена аналітика та звіти',
            'user_types': ['premium', 'enterprise'],
            'requires_subscription': True
        },
        
        # API рейт-лімітинг
        'api_rate_limiting': {
            'enabled': True,
            'description': 'Обмеження швидкості API запитів',
            'user_types': ['basic', 'premium', 'enterprise'],
            'requires_subscription': False
        },
        
        # Експорт даних
        'data_export': {
            'enabled': True,
            'description': 'Експорт даних в Excel/CSV',
            'user_types': ['basic', 'premium', 'enterprise'],
            'requires_subscription': False
        },
        
        # Багатомовність
        'multi_language': {
            'enabled': False,
            'description': 'Підтримка кількох мов інтерфейсу',
            'user_types': ['enterprise'],
            'requires_subscription': True
        },
        
        # Кастомні домени
        'custom_domains': {
            'enabled': False,
            'description': 'Власні домени для магазинів',
            'user_types': ['enterprise'],
            'requires_subscription': True
        },
        
        # Білий лейбл
        'white_label': {
            'enabled': False,
            'description': 'Приховування брендінгу платформи',
            'user_types': ['enterprise'],
            'requires_subscription': True
        }
    }
    
    def __init__(self):
        self.cache_timeout = getattr(settings, 'FEATURE_FLAGS_CACHE_TIMEOUT', 300)  # 5 хвилин
        self.cache_prefix = 'feature_flags'
    
    def _get_cache_key(self, flag_name: str, user_id: Optional[int] = None, store_id: Optional[int] = None) -> str:
        """Генерує ключ для кешування"""
        parts = [self.cache_prefix, flag_name]
        if user_id:
            parts.append(f'user_{user_id}')
        if store_id:
            parts.append(f'store_{store_id}')
        return ':'.join(parts)
    
    def get_user_subscription_type(self, user) -> str:
        """Отримати тип підписки користувача"""
        if not user or not user.is_authenticated:
            return 'guest'
        
        # Логіка визначення типу підписки
        if hasattr(user, 'subscription_plan'):
            return user.subscription_plan
        
        # Дефолтно базовий план
        return 'basic'
    
    def is_enabled(self, flag_name: str, user=None, store=None, force_check: bool = False) -> bool:
        """
        Перевіряє чи увімкнений feature flag
        
        Args:
            flag_name: Назва feature flag
            user: Користувач (для перевірки підписки)
            store: Магазин (для store-specific налаштувань)
            force_check: Пропустити кеш і перевірити напряму
        """
        # Кеш ключ
        cache_key = self._get_cache_key(
            flag_name, 
            user.id if user else None, 
            store.id if store else None
        )
        
        # Перевіряємо кеш якщо не примусова перевірка
        if not force_check:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
        
        # Отримуємо конфігурацію flag
        flag_config = self._get_flag_config(flag_name)
        if not flag_config:
            logger.warning(f"Feature flag '{flag_name}' not found")
            return False
        
        # Базова перевірка - чи увімкнений глобально
        if not flag_config.get('enabled', False):
            result = False
        else:
            result = self._check_user_access(flag_config, user, store)
        
        # Кешуємо результат
        cache.set(cache_key, result, self.cache_timeout)
        return result
    
    def _get_flag_config(self, flag_name: str) -> Optional[Dict[str, Any]]:
        """Отримати конфігурацію feature flag"""
        # Спочатку перевіряємо налаштування Django settings
        custom_flags = getattr(settings, 'FEATURE_FLAGS', {})
        if flag_name in custom_flags:
            # Об'єднуємо з дефолтними налаштуваннями
            default_config = self.DEFAULT_FLAGS.get(flag_name, {})
            return {**default_config, **custom_flags[flag_name]}
        
        # Використовуємо дефолтні налаштування
        return self.DEFAULT_FLAGS.get(flag_name)
    
    def _check_user_access(self, flag_config: Dict[str, Any], user, store) -> bool:
        """Перевіряє чи має користувач доступ до feature"""
        # Перевіряємо чи потрібна підписка
        if flag_config.get('requires_subscription', False):
            if not user or not user.is_authenticated:
                return False
            
            # Перевіряємо чи є активна підписка
            if not getattr(user, 'is_subscribed', False):
                return False
        
        # Перевіряємо тип користувача
        allowed_user_types = flag_config.get('user_types', [])
        if allowed_user_types:
            user_type = self.get_user_subscription_type(user)
            if user_type not in allowed_user_types:
                return False
        
        return True
    
    def get_enabled_flags(self, user=None, store=None) -> Dict[str, bool]:
        """Отримати всі увімкнені feature flags для користувача"""
        result = {}
        for flag_name in self.DEFAULT_FLAGS.keys():
            result[flag_name] = self.is_enabled(flag_name, user, store)
        return result
    
    def enable_flag(self, flag_name: str, user=None, store=None):
        """Тимчасово увімкнути feature flag (для тестування)"""
        cache_key = self._get_cache_key(
            flag_name, 
            user.id if user else None, 
            store.id if store else None
        )
        cache.set(cache_key, True, self.cache_timeout)
        logger.info(f"Feature flag '{flag_name}' temporarily enabled")
    
    def disable_flag(self, flag_name: str, user=None, store=None):
        """Тимчасово вимкнути feature flag (для тестування)"""
        cache_key = self._get_cache_key(
            flag_name, 
            user.id if user else None, 
            store.id if store else None
        )
        cache.set(cache_key, False, self.cache_timeout)
        logger.info(f"Feature flag '{flag_name}' temporarily disabled")
    
    def clear_cache(self, flag_name: str = None, user=None, store=None):
        """Очистити кеш feature flags"""
        if flag_name:
            cache_key = self._get_cache_key(
                flag_name, 
                user.id if user else None, 
                store.id if store else None
            )
            cache.delete(cache_key)
        else:
            # Очищуємо весь кеш feature flags (можна оптимізувати)
            cache.delete_pattern(f'{self.cache_prefix}:*')


# Глобальний екземпляр
feature_flags = FeatureFlags()


# Зручні декоратори та функції
def feature_required(flag_name: str, redirect_url: str = None):
    """
    Декоратор для views, що вимагає певний feature flag
    """
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            from django.http import HttpResponseForbidden
            from django.shortcuts import redirect
            
            if not feature_flags.is_enabled(flag_name, request.user):
                if redirect_url:
                    return redirect(redirect_url)
                return HttpResponseForbidden("Feature not available")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def check_feature(flag_name: str, user=None, store=None) -> bool:
    """Швидка перевірка feature flag"""
    return feature_flags.is_enabled(flag_name, user, store)


# Template tags helper
def get_feature_flags_context(user=None, store=None) -> Dict[str, bool]:
    """Отримати context для шаблонів"""
    return feature_flags.get_enabled_flags(user, store)