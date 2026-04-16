from decimal import Decimal
from datetime import timedelta

import pytest
from django.utils import timezone

from promotions.models import Coupon
from stores.models import Store
from accounts.models import User


@pytest.fixture
def store(db):
    user = User.objects.create_user(username='seller', email='seller@example.com', password='pass12345')
    return Store.objects.create(owner=user, name='Shop', slug='shop', is_active=True)


@pytest.mark.django_db
def test_percentage_discount(store):
    coupon = Coupon.objects.create(
        store=store, code='SALE20',
        discount_type=Coupon.DiscountType.PERCENTAGE,
        discount_value=Decimal('20'),
    )
    assert coupon.calculate_discount(Decimal('100.00')) == Decimal('20.00')


@pytest.mark.django_db
def test_fixed_discount_capped_by_order(store):
    coupon = Coupon.objects.create(
        store=store, code='MINUS50',
        discount_type=Coupon.DiscountType.FIXED,
        discount_value=Decimal('50'),
    )
    # Знижка не може бути більша за замовлення
    assert coupon.calculate_discount(Decimal('30.00')) == Decimal('30.00')


@pytest.mark.django_db
def test_expired_coupon_invalid(store):
    coupon = Coupon.objects.create(
        store=store, code='OLD', discount_value=Decimal('10'),
        valid_until=timezone.now() - timedelta(days=1),
    )
    ok, reason = coupon.is_valid(order_amount=Decimal('100'))
    assert not ok
    assert 'минув' in reason


@pytest.mark.django_db
def test_max_uses_limit(store):
    coupon = Coupon.objects.create(
        store=store, code='LIMITED', discount_value=Decimal('10'),
        max_uses=1, uses_count=1,
    )
    ok, reason = coupon.is_valid()
    assert not ok
    assert 'максимальну' in reason


@pytest.mark.django_db
def test_min_order_amount(store):
    coupon = Coupon.objects.create(
        store=store, code='BIG', discount_value=Decimal('10'),
        min_order_amount=Decimal('500'),
    )
    ok, _ = coupon.is_valid(order_amount=Decimal('100'))
    assert not ok
    ok, _ = coupon.is_valid(order_amount=Decimal('600'))
    assert ok
