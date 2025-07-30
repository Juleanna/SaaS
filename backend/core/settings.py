import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.templatetags.static import static
from django.urls import reverse_lazy

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-your-secret-key-here')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'unfold',  # Unfold admin theme
    'unfold.contrib.filters',  # Optional, extends the filters
    'unfold.contrib.forms',  # Optional, form widgets
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'accounts',
    'stores',
    'products',
    'orders',
    'payments',
    'notifications',
    'telegram_bot',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'saas_platform'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', '123456'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'uk'
TIME_ZONE = 'Europe/Kiev'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

CORS_ALLOW_CREDENTIALS = True

# Redis settings
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# Celery settings
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Telegram Bot settings
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')

# Stripe settings
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_USE_TLS = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@saasplatform.com')

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# Unfold Admin settings
UNFOLD = {
    "SITE_TITLE": "SaaS Platform Admin",
    "SITE_HEADER": "SaaS Platform Адміністрування",
    "SITE_URL": "/",
    "SITE_ICON": {
        "light": lambda request: static("icon-light.svg"),  # Optional
        "dark": lambda request: static("icon-dark.svg"),  # Optional
    },
    "SITE_LOGO": {
        "light": lambda request: static("logo-light.svg"),  # Optional
        "dark": lambda request: static("logo-dark.svg"),  # Optional
    },
    "SITE_SYMBOL": "speed",  # Material icon symbol
    "SHOW_HISTORY": True,  # Show history in sidebar
    "SHOW_VIEW_ON_SITE": True,  # Show "View on site" button
    "ENVIRONMENT": "core.settings.environment_callback",
    "DASHBOARD_CALLBACK": "core.admin.dashboard_callback",
    "LOGIN": {
        "image": lambda request: static("login-bg.jpg"),  # Optional
        "redirect_after": lambda request: reverse_lazy("admin:index"),
    },
    "STYLES": [
        lambda request: static("css/styles.css"),  # Optional custom styles
    ],
    "SCRIPTS": [
        lambda request: static("js/scripts.js"),  # Optional custom scripts
    ],
    "COLORS": {
        "primary": {
            "50": "250 245 255",
            "100": "243 232 255", 
            "200": "233 213 255",
            "300": "196 181 253",
            "400": "167 139 250",
            "500": "139 92 246",
            "600": "124 58 237",
            "700": "109 40 217",
            "800": "91 33 182",
            "900": "76 29 149",
            "950": "46 16 101",
        },
    },
    "EXTENSIONS": {
        "modeltranslation": {
            "flags": {
                "en": "🇬🇧",
                "uk": "🇺🇦",
            },
        },
    },
    "SIDEBAR": {
        "show_search": True,  # Enable search in sidebar
        "show_all_applications": True,  # Show all applications
        "navigation": [
            {
                "title": "Головна",
                "separator": True,
                "items": [
                    {
                        "title": "Панель управління",
                        "icon": "dashboard",
                        "link": lambda request: reverse_lazy("admin:index"),
                    },
                ],
            },
            {
                "title": "Користувачі та автентифікація",
                "separator": True,
                "items": [
                    {
                        "title": "Користувачі",
                        "icon": "person",
                        "link": lambda request: reverse_lazy("admin:accounts_user_changelist"),
                    },
                    {
                        "title": "Групи",
                        "icon": "group",
                        "link": lambda request: reverse_lazy("admin:auth_group_changelist"),
                        "permission": lambda request: request.user.has_perm("auth.view_group"),
                    },
                ],
            },
            {
                "title": "Магазини та продукти",
                "separator": True,
                "items": [
                    {
                        "title": "Магазини",
                        "icon": "store",
                        "link": lambda request: reverse_lazy("admin:stores_store_changelist"),
                    },
                    {
                        "title": "Блоки магазинів",
                        "icon": "widgets",
                        "link": lambda request: reverse_lazy("admin:stores_storeblock_changelist"),
                    },
                    {
                        "title": "Соціальні мережі",
                        "icon": "share",
                        "link": lambda request: reverse_lazy("admin:stores_storesociallink_changelist"),
                    },
                    {
                        "title": "Продукти",
                        "icon": "inventory",
                        "link": lambda request: reverse_lazy("admin:products_product_changelist"),
                    },
                ],
            },
            {
                "title": "Замовлення та платежі",
                "separator": True,
                "items": [
                    {
                        "title": "Замовлення",
                        "icon": "shopping_cart",
                        "link": lambda request: reverse_lazy("admin:orders_order_changelist"),
                    },
                    {
                        "title": "Платежі",
                        "icon": "payment",
                        "link": lambda request: reverse_lazy("admin:payments_payment_changelist"),
                    },
                ],
            },
            {
                "title": "Сповіщення",
                "separator": True,
                "items": [
                    {
                        "title": "Сповіщення",
                        "icon": "notifications",
                        "link": lambda request: reverse_lazy("admin:notifications_notification_changelist"),
                    },
                ],
            },
        ],
    },
}

def environment_callback(request):
    """Callback для показу середовища в адмінці"""
    return ["Розробка", "warning"] if DEBUG else ["Продакшн", "danger"] 