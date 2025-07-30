from django.db import models
from django.utils.translation import gettext_lazy as _
from accounts.models import User
from orders.models import Order


class Notification(models.Model):
    """Сповіщення"""
    
    NOTIFICATION_TYPES = [
        ('order_created', _('Нове замовлення')),
        ('order_status_changed', _('Зміна статусу замовлення')),
        ('payment_received', _('Отримано платіж')),
        ('low_stock', _('Низький залишок товару')),
        ('system', _('Системне сповіщення')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name=_('Користувач'))
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES, verbose_name=_('Тип сповіщення'))
    
    title = models.CharField(max_length=200, verbose_name=_('Заголовок'))
    message = models.TextField(verbose_name=_('Повідомлення'))
    
    # Додаткові дані
    data = models.JSONField(default=dict, blank=True, verbose_name=_('Додаткові дані'))
    related_order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True, verbose_name=_('Пов\'язане замовлення'))
    
    # Статус
    is_read = models.BooleanField(default=False, verbose_name=_('Прочитано'))
    is_sent = models.BooleanField(default=False, verbose_name=_('Відправлено'))
    
    # Канали доставки
    email_sent = models.BooleanField(default=False, verbose_name=_('Email відправлено'))
    telegram_sent = models.BooleanField(default=False, verbose_name=_('Telegram відправлено'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    read_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Дата прочитання'))
    
    class Meta:
        verbose_name = _('Сповіщення')
        verbose_name_plural = _('Сповіщення')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    @property
    def notification_type_display(self):
        """Відображення типу сповіщення"""
        return dict(self.NOTIFICATION_TYPES).get(self.notification_type, self.notification_type) 