"""
Тести для моделей stores
"""
import pytest
from stores.models import Store


@pytest.mark.unit
class TestStoreModel:
    """Тести для моделі Store"""

    def test_create_store(self, test_user, db):
        """Тест створення магазину"""
        store = Store.objects.create(
            name='Test Store',
            slug='test-store',
            owner=test_user,
            description='Test description'
        )
        assert store.name == 'Test Store'
        assert store.slug == 'test-store'
        assert store.owner == test_user
        assert store.is_active is True

    def test_store_auto_slug_generation(self, test_user, db):
        """Тест автоматичної генерації slug"""
        store = Store.objects.create(
            name='My Awesome Store',
            owner=test_user
        )
        assert store.slug == 'my-awesome-store'

    def test_store_str_representation(self, test_store):
        """Тест __str__ методу"""
        assert str(test_store) == test_store.name

    def test_store_products_count_property(self, test_store):
        """Тест products_count property"""
        # Поки що має бути 0 (немає товарів)
        assert test_store.products_count == 0

    def test_store_orders_count_property(self, test_store):
        """Тест orders_count property"""
        # Поки що має бути 0 (немає замовлень)
        assert test_store.orders_count == 0

    def test_store_default_colors(self, test_store):
        """Тест дефолтних кольорів"""
        assert test_store.primary_color == '#3B82F6'
        assert test_store.secondary_color == '#1F2937'
        assert test_store.accent_color == '#F59E0B'
