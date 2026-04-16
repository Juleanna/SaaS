"""Custom Middleware для безпеки та оптимізації."""
import logging

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse

logger = logging.getLogger(__name__)

# Методи, які треба CSRF-захистити
_UNSAFE_METHODS = {'POST', 'PUT', 'PATCH', 'DELETE'}

# Ендпоінти, для яких CSRF пропускається (перший вхід — ще немає сесії)
_CSRF_EXEMPT_PATHS = (
    '/api/auth/login/',
    '/api/auth/register/',
    '/api/auth/token/',
    '/api/auth/password-reset/',
)


class RateLimitMiddleware:
    """Простий IP-based rate limit для /api/* із суворішим вікном для auth-endpoints."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit = getattr(settings, 'RATE_LIMIT_PER_MINUTE', 60)
        self.auth_rate_limit = getattr(settings, 'AUTH_RATE_LIMIT_PER_MINUTE', 10)
        self.rate_limit_window = 60

    def __call__(self, request):
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return self.get_response(request)

        if request.path.startswith('/api/'):
            ip = self.get_client_ip(request)
            limit = self._limit_for(request.path)
            if not self.check_rate_limit(ip, request.path, limit):
                logger.warning('Rate limit exceeded for IP=%s path=%s', ip, request.path)
                return JsonResponse(
                    {
                        'error': 'Too many requests. Please try again later.',
                        'detail': f'Rate limit exceeded. Maximum {limit} requests per minute.',
                    },
                    status=429,
                )

        return self.get_response(request)

    def _limit_for(self, path):
        # Суворіший ліміт на login/register/password-reset — захист від brute force
        if any(path.startswith(p) for p in (
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/password-reset/',
            '/api/auth/token/',
        )):
            return self.auth_rate_limit
        return self.rate_limit

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')

    def check_rate_limit(self, ip, path, limit):
        cache_key = f'rate_limit:{ip}:{path}'
        current_count = cache.get(cache_key, 0)
        if current_count >= limit:
            return False
        if current_count == 0:
            cache.set(cache_key, 1, self.rate_limit_window)
        else:
            try:
                cache.incr(cache_key)
            except ValueError:
                cache.set(cache_key, 1, self.rate_limit_window)
        return True


class CSRFDoubleSubmitMiddleware:
    """
    CSRF захист для cookie-based auth через double-submit cookie pattern.

    Для модифікуючих запитів перевіряє, що значення cookie `csrf_token` = заголовок `X-CSRF-Token`.
    Атакувач не може прочитати cookie через XSS/CORS, а значить не зможе підставити правильний header.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if (
            request.method in _UNSAFE_METHODS
            and request.path.startswith('/api/')
            and not any(request.path.startswith(p) for p in _CSRF_EXEMPT_PATHS)
        ):
            # Тільки для запитів з нашими auth-cookies — інакше не наш API-кейс
            if request.COOKIES.get('access_token'):
                cookie_token = request.COOKIES.get('csrf_token')
                header_token = request.META.get('HTTP_X_CSRF_TOKEN')
                if not cookie_token or not header_token or cookie_token != header_token:
                    logger.warning(
                        'CSRF token mismatch path=%s ip=%s',
                        request.path,
                        request.META.get('REMOTE_ADDR'),
                    )
                    return JsonResponse(
                        {'error': 'CSRF token missing or invalid'},
                        status=403,
                    )

        return self.get_response(request)
