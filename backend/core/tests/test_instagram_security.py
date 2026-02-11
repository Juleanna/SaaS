"""
Тести безпеки для Instagram інтеграції
"""
import pytest
from rest_framework import status
from django.urls import reverse
from core.instagram_models import InstagramAccount


@pytest.mark.instagram
@pytest.mark.security
class TestInstagramOAuthSecurity:
    """Тести безпеки Instagram OAuth"""

    def test_oauth_callback_missing_code(self, authenticated_client):
        """Тест callback без коду"""
        url = reverse('instagramaccount-oauth-callback')
        response = authenticated_client.post(url, {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data

    def test_oauth_callback_missing_store_id(self, authenticated_client):
        """Тест callback без store_id"""
        url = reverse('instagramaccount-oauth-callback')
        response = authenticated_client.post(url, {'code': 'test123'})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'store_id' in response.data['error'].lower()

    def test_oauth_callback_invalid_store(self, authenticated_client, test_store):
        """Тест callback з невірним store_id"""
        url = reverse('instagramaccount-oauth-callback')
        response = authenticated_client.post(url, {
            'code': 'test123',
            'store_id': 99999  # Неіснуючий store
        })
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_cannot_connect_to_other_user_store(self, api_client, test_user, test_store, db):
        """Тест: користувач не може підключити Instagram до чужого магазину"""
        from accounts.models import User
        from stores.models import Store

        # Створити іншого користувача та його магазин
        other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='pass123'
        )
        other_store = Store.objects.create(
            name='Other Store',
            slug='other-store',
            owner=other_user
        )

        # Спроба підключити Instagram до чужого магазину
        api_client.force_authenticate(user=test_user)
        url = reverse('instagramaccount-oauth-callback')
        response = api_client.post(url, {
            'code': 'test_code',
            'store_id': other_store.id
        })

        # Не повинен мати доступ
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert 'access denied' in response.data['error'].lower()


@pytest.mark.instagram
@pytest.mark.security
class TestRateLimiting:
    """Тести Rate Limiting"""

    @pytest.mark.slow
    def test_rate_limit_blocks_excessive_requests(self, api_client, db):
        """Тест що rate limit блокує надмірні запити"""
        # Примітка: Цей тест повільний, тому помічений як slow
        # Можна пропустити: pytest -m "not slow"

        url = reverse('instagramaccount-list')

        # Зробити багато запитів
        responses = []
        for i in range(65):  # Перевищити ліміт 60/min
            response = api_client.get(url)
            responses.append(response.status_code)

        # Перевірити що хоча б один запит заблокований
        assert status.HTTP_429_TOO_MANY_REQUESTS in responses
