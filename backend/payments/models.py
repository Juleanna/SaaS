from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
import uuid
from orders.models import Order
from accounts.models import User


class Payment(models.Model):
    """Платіж"""
    
    PAYMENT_METHODS = [
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('yookassa', 'ЮKassa'),
        ('cash', 'Накладений платіж'),
        ('bank_transfer', 'Банківський переказ'),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Очікує оплати')),
        ('processing', _('В обробці')),
        ('completed', _('Завершено')),
        ('failed', _('Помилка')),
        ('cancelled', _('Скасовано')),
        ('refunded', _('Повернено')),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', verbose_name=_('Замовлення'))
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Сума'))
    currency = models.CharField(max_length=3, default='UAH', verbose_name=_('Валюта'))
    
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, verbose_name=_('Спосіб оплати'))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name=_('Статус'))
    
    # Зовнішні ID
    external_payment_id = models.CharField(max_length=100, blank=True, verbose_name=_('Зовнішній ID платежу'))
    transaction_id = models.CharField(max_length=100, blank=True, verbose_name=_('ID транзакції'))
    
    # Додаткова інформація
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    metadata = models.JSONField(default=dict, blank=True, verbose_name=_('Метадані'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    paid_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Дата оплати'))
    
    class Meta:
        verbose_name = _('Платіж')
        verbose_name_plural = _('Платежі')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order.order_number} - {self.get_payment_method_display()} - {self.amount}"
    
    @property
    def status_display(self):
        """Відображення статусу"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    @property
    def payment_method_display(self):
        """Відображення способу оплати"""
        return dict(self.PAYMENT_METHODS).get(self.payment_method, self.payment_method)
    
    def mark_as_paid(self):
        """Позначити платіж як оплачений"""
        if self.status not in ['completed']:
            self.status = 'completed'
            self.paid_at = timezone.now()
            self.save()
            
            # Оновлюємо статус замовлення
            if self.order.payment_status == 'pending':
                self.order.payment_status = 'paid'
                self.order.save()
    
    def mark_as_failed(self, reason=''):
        """Позначити платіж як невдалий"""
        self.status = 'failed'
        if reason:
            self.metadata = self.metadata or {}
            self.metadata['failure_reason'] = reason
        self.save()
    
    def refund(self, amount=None):
        """Повернути кошти"""
        refund_amount = amount or self.amount
        if self.status == 'completed':
            self.status = 'refunded'
            self.metadata = self.metadata or {}
            self.metadata['refund_amount'] = str(refund_amount)
            self.metadata['refunded_at'] = timezone.now().isoformat()
            self.save()
            return True
        return False


class PaymentMethod(models.Model):
    """Налаштування методів оплати для магазину"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        'stores.Store', 
        on_delete=models.CASCADE, 
        related_name='payment_methods',
        verbose_name=_('Магазин')
    )
    
    # Основні налаштування
    method_type = models.CharField(
        max_length=20, 
        choices=Payment.PAYMENT_METHODS,
        verbose_name=_('Тип методу оплати')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    display_name = models.CharField(max_length=100, verbose_name=_('Назва для відображення'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    
    # Налаштування для інтеграцій
    api_credentials = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name=_('API налаштування'),
        help_text=_('Зберігаються в зашифрованому вигляді')
    )
    
    # Налаштування комісій
    commission_type = models.CharField(
        max_length=10,
        choices=[
            ('percentage', _('Відсоток')),
            ('fixed', _('Фіксована сума')),
            ('combined', _('Відсоток + фіксована сума')),
        ],
        default='percentage',
        verbose_name=_('Тип комісії')
    )
    commission_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name=_('Відсоток комісії')
    )
    commission_fixed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name=_('Фіксована комісія')
    )
    
    # Обмеження
    min_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Мінімальна сума')
    )
    max_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Максимальна сума')
    )
    
    # Налаштування відображення
    sort_order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок сортування'))
    icon = models.ImageField(upload_to='payment_icons/', blank=True, verbose_name=_('Іконка'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Оновлено'))
    
    class Meta:
        verbose_name = _('Метод оплати')
        verbose_name_plural = _('Методи оплати')
        ordering = ['sort_order', 'display_name']
        unique_together = ['store', 'method_type']
    
    def __str__(self):
        return f"{self.store.name} - {self.display_name}"
    
    def calculate_commission(self, amount):
        """Розрахувати комісію для суми"""
        commission = Decimal('0.00')
        
        if self.commission_type in ['percentage', 'combined']:
            commission += amount * (self.commission_percentage / 100)
        
        if self.commission_type in ['fixed', 'combined']:
            commission += self.commission_fixed
        
        return commission
    
    def is_amount_valid(self, amount):
        """Перевірити чи валідна сума для цього методу"""
        if self.min_amount and amount < self.min_amount:
            return False
        if self.max_amount and amount > self.max_amount:
            return False
        return True


class Refund(models.Model):
    """Модель повернення коштів"""
    
    STATUS_CHOICES = [
        ('pending', _('Очікує обробки')),
        ('processing', _('В обробці')),
        ('completed', _('Завершено')),
        ('failed', _('Помилка')),
        ('cancelled', _('Скасовано')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment, 
        on_delete=models.CASCADE, 
        related_name='refunds',
        verbose_name=_('Платіж')
    )
    
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name=_('Сума повернення')
    )
    reason = models.TextField(verbose_name=_('Причина повернення'))
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name=_('Статус')
    )
    
    # Зовнішні ID
    external_refund_id = models.CharField(
        max_length=100, 
        blank=True,
        verbose_name=_('Зовнішній ID повернення')
    )
    
    # Відстеження
    initiated_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        verbose_name=_('Ініціатор повернення')
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Дата обробки'))
    
    class Meta:
        verbose_name = _('Повернення коштів')
        verbose_name_plural = _('Повернення коштів')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Повернення {self.amount} для {self.payment.order.order_number}" 