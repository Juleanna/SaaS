"""
Тести для моделей accounts
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.mark.unit
class TestUserModel:
    """Тести для моделі User"""

    def test_create_user(self, db):
        """Тест створення звичайного користувача"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        assert user.username == 'testuser'
        assert user.email == 'test@example.com'
        assert user.check_password('testpass123')
        assert not user.is_staff
        assert not user.is_superuser

    def test_create_superuser(self, db):
        """Тест створення суперюзера"""
        user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpass123'
        )
        assert user.is_staff
        assert user.is_superuser

    def test_user_str_representation(self, test_user):
        """Тест __str__ методу"""
        assert str(test_user) == test_user.email

    def test_user_full_name_property(self, test_user):
        """Тест full_name property"""
        test_user.first_name = 'John'
        test_user.last_name = 'Doe'
        test_user.save()
        assert test_user.full_name == 'John Doe'

    def test_user_default_subscription_plan(self, test_user):
        """Тест дефолтного плану підписки"""
        assert test_user.subscription_plan == 'free'
        assert test_user.is_subscribed is False

    def test_user_balance_default(self, test_user):
        """Тест дефолтного балансу"""
        assert test_user.balance == 0.00
        assert test_user.monthly_spending == 0.00
        assert test_user.total_spent == 0.00
