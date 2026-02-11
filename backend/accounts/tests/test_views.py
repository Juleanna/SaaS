"""
Тести для views accounts
"""
import pytest
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.integration
class TestUserRegistration:
    """Тести для реєстрації користувачів"""

    def test_user_registration_success(self, api_client, db):
        """Тест успішної реєстрації"""
        url = reverse('user-registration')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post(url, data, format='json')

        # Перевірити що користувач створений
        assert response.status_code == status.HTTP_201_CREATED
        assert User.objects.filter(email='newuser@example.com').exists()

    def test_user_registration_password_mismatch(self, api_client, db):
        """Тест реєстрації з невідповідними паролями"""
        url = reverse('user-registration')
        data = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPass123!',
            'password_confirm': 'DifferentPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_registration_duplicate_email(self, api_client, test_user):
        """Тест реєстрації з дублікатом email"""
        url = reverse('user-registration')
        data = {
            'username': 'newuser',
            'email': test_user.email,  # Використати існуючий email
            'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.integration
class TestUserProfile:
    """Тести для профілю користувача"""

    def test_get_user_profile(self, authenticated_client, test_user):
        """Тест отримання профілю"""
        url = reverse('user-profile')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == test_user.email
        assert response.data['username'] == test_user.username

    def test_update_user_profile(self, authenticated_client, test_user):
        """Тест оновлення профілю"""
        url = reverse('user-profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = authenticated_client.patch(url, data, format='json')

        assert response.status_code == status.HTTP_200_OK
        test_user.refresh_from_db()
        assert test_user.first_name == 'Updated'
        assert test_user.last_name == 'Name'

    def test_profile_requires_authentication(self, api_client):
        """Тест що профіль потребує автентифікації"""
        url = reverse('user-profile')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.integration
class TestAvatarUpload:
    """Тести для завантаження аватара"""

    def test_upload_avatar_unauthenticated(self, api_client):
        """Тест що завантаження потребує автентифікації"""
        url = reverse('user-upload-avatar')
        response = api_client.post(url, {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
