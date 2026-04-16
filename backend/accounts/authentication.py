"""
Автентифікація через httpOnly cookies замість Authorization header.

Токен зберігається в httpOnly cookie `access_token`, недоступний з JavaScript,
що захищає від XSS-атак (крадіжки токена).

Додатково — CSRF-токен у звичайному (не httpOnly) cookie. Фронтенд читає його і надсилає
у заголовку X-CSRF-Token при модифікуючих запитах. Це double-submit cookie pattern.
"""
import secrets

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication


ACCESS_COOKIE_NAME = 'access_token'
REFRESH_COOKIE_NAME = 'refresh_token'
CSRF_COOKIE_NAME = 'csrf_token'
CSRF_HEADER_NAME = 'X-CSRF-Token'


class CookieJWTAuthentication(JWTAuthentication):
    """Читає JWT спочатку з cookie, потім fallback на Authorization header."""

    def authenticate(self, request):
        raw_token = request.COOKIES.get(ACCESS_COOKIE_NAME)
        if raw_token:
            try:
                validated_token = self.get_validated_token(raw_token)
                user = self.get_user(validated_token)
                return user, validated_token
            except Exception:
                pass
        return super().authenticate(request)


def set_auth_cookies(response, access_token, refresh_token=None):
    """Встановлює httpOnly cookies для access/refresh + non-httpOnly CSRF."""
    is_secure = not settings.DEBUG
    samesite = 'Lax'

    response.set_cookie(
        ACCESS_COOKIE_NAME,
        str(access_token),
        max_age=60 * 60,  # 1 година
        httponly=True,
        secure=is_secure,
        samesite=samesite,
        path='/',
    )
    if refresh_token is not None:
        response.set_cookie(
            REFRESH_COOKIE_NAME,
            str(refresh_token),
            max_age=60 * 60 * 24 * 7,  # 7 днів
            httponly=True,
            secure=is_secure,
            samesite=samesite,
            path='/api/auth/',
        )
    # CSRF токен — доступний JS щоб фронтенд міг прочитати і надіслати в заголовку
    response.set_cookie(
        CSRF_COOKIE_NAME,
        secrets.token_urlsafe(32),
        max_age=60 * 60 * 24 * 7,
        httponly=False,
        secure=is_secure,
        samesite=samesite,
        path='/',
    )


def clear_auth_cookies(response):
    """Видаляє auth cookies."""
    response.delete_cookie(ACCESS_COOKIE_NAME, path='/')
    response.delete_cookie(REFRESH_COOKIE_NAME, path='/api/auth/')
    response.delete_cookie(CSRF_COOKIE_NAME, path='/')
