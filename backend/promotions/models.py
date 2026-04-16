from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from stores.models import Store


class Coupon(models.Model):
    """Промокод для магазину."""

    class DiscountType(models.TextChoices):
        PERCENTAGE = 'percentage', _('Відсоток')
        FIXED = 'fixed', _('Фіксована сума')

    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='coupons',
        verbose_name=_('Магазин'),
    )
    code = models.CharField(_('Код'), max_length=32, db_index=True)
    description = models.CharField(_('Опис'), max_length=255, blank=True)

    discount_type = models.CharField(
        _('Тип знижки'),
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE,
    )
    discount_value = models.DecimalField(
        _('Значення знижки'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    min_order_amount = models.DecimalField(
        _('Мінімальна сума замовлення'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
    )

    max_uses = models.PositiveIntegerField(
        _('Максимум використань'),
        null=True,
        blank=True,
        help_text=_('Порожнє = без обмежень'),
    )
    uses_count = models.PositiveIntegerField(_('Використано'), default=0)

    valid_from = models.DateTimeField(_('Діє з'), null=True, blank=True)
    valid_until = models.DateTimeField(_('Діє до'), null=True, blank=True)
    is_active = models.BooleanField(_('Активний'), default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Промокод')
        verbose_name_plural = _('Промокоди')
        unique_together = [('store', 'code')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} ({self.store.name})'

    def is_valid(self, order_amount=None):
        """Повертає (bool, reason)."""
        now = timezone.now()
        if not self.is_active:
            return False, 'Промокод неактивний'
        if self.valid_from and now < self.valid_from:
            return False, 'Промокод ще не активний'
        if self.valid_until and now > self.valid_until:
            return False, 'Термін дії промокоду минув'
        if self.max_uses is not None and self.uses_count >= self.max_uses:
            return False, 'Промокод використано максимальну кількість разів'
        if order_amount is not None and Decimal(order_amount) < self.min_order_amount:
            return False, f'Мінімальна сума для промокоду: {self.min_order_amount} ₴'
        return True, None

    def calculate_discount(self, order_amount):
        """Повертає суму знижки в грошах."""
        order_amount = Decimal(order_amount)
        if self.discount_type == self.DiscountType.PERCENTAGE:
            discount = order_amount * (self.discount_value / Decimal('100'))
        else:
            discount = self.discount_value
        # Знижка не може бути більша за суму замовлення
        return min(discount, order_amount).quantize(Decimal('0.01'))
