"""
Custom Middleware для безпеки та оптимізації
"""
from django.core.cache import cache
from django.http import JsonResponse
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    Middleware для обмеження кількості запитів (Rate Limiting)

    Захищає API від зловживань обмежуючи кількість запитів
    від одного IP адреси протягом певного періоду часу.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        # Налаштування: запити/хвилину
        self.rate_limit = getattr(settings, 'RATE_LIMIT_PER_MINUTE', 60)
        self.rate_limit_window = 60  # секунди

    def __call__(self, request):
        # Пропустити статичні файли та медіа
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return self.get_response(request)

        # Отримати IP адресу
        ip = self.get_client_ip(request)

        # Перевірити rate limit тільки для API endpoints
        if request.path.startswith('/api/'):
            if not self.check_rate_limit(ip, request.path):
                logger.warning(f"Rate limit exceeded for IP: {ip}, path: {request.path}")
                return JsonResponse(
                    {
                        "error": "Too many requests. Please try again later.",
                        "detail": f"Rate limit exceeded. Maximum {self.rate_limit} requests per minute."
                    },
                    status=429
                )

        response = self.get_response(request)
        return response

    def get_client_ip(self, request):
        """
        Отримати IP адресу клієнта

        Перевіряє X-Forwarded-For header (для проксі/балансувальників)
        перед використанням REMOTE_ADDR.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Беремо перший IP (оригінальний клієнт)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def check_rate_limit(self, ip, path):
        """
        Перевірити чи не перевищено ліміт запитів

        Args:
            ip: IP адреса клієнта
            path: Шлях запиту

        Returns:
            bool: True якщо запит дозволено, False якщо ліміт перевищено
        """
        # Створити унікальний ключ для кешу
        cache_key = f"rate_limit:{ip}:{path}"

        # Отримати поточний лічильник
        current_count = cache.get(cache_key, 0)

        if current_count >= self.rate_limit:
            return False

        # Збільшити лічильник
        if current_count == 0:
            # Перший запит - встановити TTL
            cache.set(cache_key, 1, self.rate_limit_window)
        else:
            # Наступні запити - інкрементувати
            cache.incr(cache_key)

        return True
