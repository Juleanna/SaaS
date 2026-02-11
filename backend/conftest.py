"""
Pytest конфігурація для всіх тестів
"""
import pytest
from django.conf import settings
from rest_framework.test import APIClient
from accounts.models import User
from stores.models import Store


@pytest.fixture(scope='session')
def django_db_setup():
    """Налаштування тестової бази даних"""
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'test_saas_platform',
        'USER': settings.DATABASES['default']['USER'],
        'PASSWORD': settings.DATABASES['default']['PASSWORD'],
        'HOST': settings.DATABASES['default']['HOST'],
        'PORT': settings.DATABASES['default']['PORT'],
    }


@pytest.fixture
def api_client():
    """API клієнт для тестів"""
    return APIClient()


@pytest.fixture
def test_user(db):
    """Створити тестового користувача"""
    user = User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123',
        first_name='Test',
        last_name='User'
    )
    return user


@pytest.fixture
def authenticated_client(api_client, test_user):
    """Аутентифікований API клієнт"""
    api_client.force_authenticate(user=test_user)
    return api_client


@pytest.fixture
def test_store(db, test_user):
    """Створити тестовий магазин"""
    store = Store.objects.create(
        name='Test Store',
        slug='test-store',
        owner=test_user,
        description='Test store description',
        is_active=True
    )
    return store


@pytest.fixture
def test_superuser(db):
    """Створити тестового суперюзера"""
    user = User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='adminpass123'
    )
    return user


@pytest.fixture
def mock_instagram_api(monkeypatch):
    """Mock Instagram API для тестів"""
    class MockInstagramResponse:
        def __init__(self, data):
            self.data = data

        def json(self):
            return self.data

        def raise_for_status(self):
            pass

    def mock_post(*args, **kwargs):
        return MockInstagramResponse({
            "access_token": "mock_token_123",
            "user_id": "12345"
        })

    def mock_get(*args, **kwargs):
        return MockInstagramResponse({
            "id": "12345",
            "username": "testuser",
            "name": "Test User",
            "followers_count": 100
        })

    import requests
    monkeypatch.setattr(requests, "post", mock_post)
    monkeypatch.setattr(requests, "get", mock_get)


@pytest.fixture(autouse=True)
def enable_db_access_for_all_tests(db):
    """Автоматично включити доступ до БД для всіх тестів"""
    pass
