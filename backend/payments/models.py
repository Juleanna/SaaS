from django.db import models
from django.utils.translation import gettext_lazy as _
from orders.models import Order


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