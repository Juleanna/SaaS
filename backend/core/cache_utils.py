"""
Утиліти для кешування
"""

from django.core.cache import cache
from django.conf import settings
from functools import wraps
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


def make_cache_key(*args, **kwargs) -> str:
    """Створити ключ кешу з параметрів"""
    key_parts = []
    
    # Додаємо всі позиційні аргументи
    for arg in args:
        if hasattr(arg, 'id'):
            key_parts.append(f"{arg.__class__.__name__}_{arg.id}")
        else:
            key_parts.append(str(arg))
    
    # Додаємо іменовані аргументи
    for key, value in sorted(kwargs.items()):
        if hasattr(value, 'id'):
            key_parts.append(f"{key}_{value.__class__.__name__}_{value.id}")
        else:
            key_parts.append(f"{key}_{value}")
    
    # Створюємо хеш якщо ключ занадто довгий
    key_string = ':'.join(key_parts)
    if len(key_string) > 200:
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"long_key:{key_hash}"
    
    return key_string


def cache_result(timeout=300, key_prefix='api'):
    """Декоратор для кешування результатів функцій"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Створюємо ключ кешу
            cache_key = f"{key_prefix}:{func.__name__}:{make_cache_key(*args, **kwargs)}"
            
            # Перевіряємо кеш
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Виконуємо функцію
            result = func(*args, **kwargs)
            
            # Кешуємо результат
            cache.set(cache_key, result, timeout)
            logger.debug(f"Cached result for {cache_key}")
            
            return result
        return wrapper
    return decorator


def invalidate_cache_pattern(pattern: str):
    """Очистити кеш за паттерном"""
    try:
        cache.delete_pattern(f"*{pattern}*")
        logger.info(f"Cache pattern '{pattern}' invalidated")
    except Exception as e:
        logger.error(f"Failed to invalidate cache pattern '{pattern}': {e}")


def invalidate_model_cache(model_instance, related_patterns=None):
    """Очистити кеш моделі та пов'язаних об'єктів"""
    model_name = model_instance.__class__.__name__.lower()
    instance_id = model_instance.id
    
    # Основний паттерн для моделі
    patterns_to_clear = [
        f"{model_name}_{instance_id}",
        f"{model_name}s",  # Списки моделей
    ]
    
    # Додаткові паттерни
    if related_patterns:
        patterns_to_clear.extend(related_patterns)
    
    for pattern in patterns_to_clear:
        invalidate_cache_pattern(pattern)


class CacheManager:
    """Менеджер кешування для різних типів даних"""
    
    # Таймаути кешування для різних типів даних
    TIMEOUTS = {
        'product_list': 300,        # 5 хвилин
        'product_detail': 600,      # 10 хвилин
        'category_list': 1800,      # 30 хвилин
        'store_settings': 3600,     # 1 година
        'user_permissions': 1800,   # 30 хвилин
        'pricelist_items': 300,     # 5 хвилин
        'stock_levels': 60,         # 1 хвилина
        'order_stats': 300,         # 5 хвилин
        'feature_flags': 300,       # 5 хвилин
    }
    
    def __init__(self):
        self.cache = cache
    
    def get_or_set(self, key: str, callable_or_value, timeout: int = None, cache_type: str = None):
        """Отримати з кешу або встановити нове значення"""
        if timeout is None and cache_type:
            timeout = self.TIMEOUTS.get(cache_type, 300)
        
        if timeout is None:
            timeout = 300
        
        return self.cache.get_or_set(key, callable_or_value, timeout)
    
    def set(self, key: str, value, timeout: int = None, cache_type: str = None):
        """Встановити значення в кеш"""
        if timeout is None and cache_type:
            timeout = self.TIMEOUTS.get(cache_type, 300)
        
        if timeout is None:
            timeout = 300
        
        return self.cache.set(key, value, timeout)
    
    def get(self, key: str, default=None):
        """Отримати значення з кешу"""
        return self.cache.get(key, default)
    
    def delete(self, key: str):
        """Видалити з кешу"""
        return self.cache.delete(key)
    
    def delete_pattern(self, pattern: str):
        """Видалити за паттерном"""
        try:
            return self.cache.delete_pattern(f"*{pattern}*")
        except AttributeError:
            # Fallback для cache backends що не підтримують delete_pattern
            logger.warning("Cache backend doesn't support delete_pattern")
            return 0
    
    def clear_all(self):
        """Очистити весь кеш"""
        return self.cache.clear()
    
    # Зручні методи для різних типів даних
    def cache_products(self, store_id: int, products_data, timeout: int = None):
        """Кешувати список продуктів"""
        key = f"products:store_{store_id}"
        return self.set(key, products_data, timeout, 'product_list')
    
    def get_cached_products(self, store_id: int):
        """Отримати кешовані продукти"""
        key = f"products:store_{store_id}"
        return self.get(key)
    
    def invalidate_products(self, store_id: int):
        """Очистити кеш продуктів"""
        self.delete_pattern(f"products:store_{store_id}")
        self.delete_pattern(f"product_")  # Окремі продукти
    
    def cache_store_settings(self, store_id: int, settings_data, timeout: int = None):
        """Кешувати налаштування магазину"""
        key = f"store_settings:{store_id}"
        return self.set(key, settings_data, timeout, 'store_settings')
    
    def get_cached_store_settings(self, store_id: int):
        """Отримати кешовані налаштування"""
        key = f"store_settings:{store_id}"
        return self.get(key)
    
    def cache_user_permissions(self, user_id: int, permissions_data, timeout: int = None):
        """Кешувати дозволи користувача"""
        key = f"user_permissions:{user_id}"
        return self.set(key, permissions_data, timeout, 'user_permissions')
    
    def get_cached_user_permissions(self, user_id: int):
        """Отримати кешовані дозволи"""
        key = f"user_permissions:{user_id}"
        return self.get(key)
    
    def cache_stock_levels(self, product_id: int, warehouse_id: int, stock_data, timeout: int = None):
        """Кешувати рівні запасів"""
        key = f"stock:product_{product_id}:warehouse_{warehouse_id}"
        return self.set(key, stock_data, timeout, 'stock_levels')
    
    def get_cached_stock_levels(self, product_id: int, warehouse_id: int):
        """Отримати кешовані запаси"""
        key = f"stock:product_{product_id}:warehouse_{warehouse_id}"
        return self.get(key)
    
    def invalidate_stock(self, product_id: int = None, warehouse_id: int = None):
        """Очистити кеш запасів"""
        if product_id and warehouse_id:
            key = f"stock:product_{product_id}:warehouse_{warehouse_id}"
            self.delete(key)
        elif product_id:
            self.delete_pattern(f"stock:product_{product_id}")
        elif warehouse_id:
            self.delete_pattern(f"stock:warehouse_{warehouse_id}")
        else:
            self.delete_pattern("stock:")


# Глобальний екземпляр менеджера кешу
cache_manager = CacheManager()


# Сигнали для автоматичного очищення кешу
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver


@receiver([post_save, post_delete])
def invalidate_related_cache(sender, instance, **kwargs):
    """Автоматично очищати пов'язаний кеш при зміні моделей"""
    
    # Продукти
    if sender.__name__ == 'Product':
        cache_manager.invalidate_products(instance.store_id)
        if hasattr(instance, 'category') and instance.category:
            cache_manager.delete_pattern(f"category_{instance.category_id}")
    
    # Категорії
    elif sender.__name__ == 'Category':
        cache_manager.invalidate_products(instance.store_id)
        cache_manager.delete_pattern(f"categories:store_{instance.store_id}")
    
    # Магазини
    elif sender.__name__ == 'Store':
        cache_manager.delete_pattern(f"store_{instance.id}")
        cache_manager.delete_pattern(f"store_settings:{instance.id}")
    
    # Запаси
    elif sender.__name__ == 'Stock':
        cache_manager.invalidate_stock(
            instance.product_id if hasattr(instance, 'product_id') else None,
            instance.warehouse_id if hasattr(instance, 'warehouse_id') else None
        )
    
    # Прайс-листи
    elif sender.__name__ in ['PriceList', 'PriceListItem']:
        if hasattr(instance, 'store_id'):
            cache_manager.delete_pattern(f"pricelist:store_{instance.store_id}")
        elif hasattr(instance, 'price_list') and hasattr(instance.price_list, 'store_id'):
            cache_manager.delete_pattern(f"pricelist:store_{instance.price_list.store_id}")
    
    # Користувачі
    elif sender.__name__ == 'User':
        cache_manager.delete_pattern(f"user_{instance.id}")
        cache_manager.delete_pattern(f"user_permissions:{instance.id}")
    
    logger.debug(f"Cache invalidated for {sender.__name__} instance {instance.id}")


# Middleware кешування
class CacheHeadersMiddleware:
    """Middleware для додавання заголовків кешування"""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Додаємо заголовки кешування для API endpoints
        if request.path.startswith('/api/'):
            if request.method == 'GET':
                # Кешуємо GET запити на 5 хвилин
                response['Cache-Control'] = 'public, max-age=300'
            else:
                # Не кешуємо POST/PUT/DELETE
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        return response