from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Кастомна модель користувача для продавців"""
    
    # Додаткові поля для продавців
    phone = models.CharField(max_length=20, blank=True, verbose_name=_('Телефон'))
    company_name = models.CharField(max_length=100, blank=True, verbose_name=_('Назва компанії'))
    telegram_username = models.CharField(max_length=50, blank=True, verbose_name=_('Telegram username'))
    telegram_chat_id = models.CharField(max_length=50, blank=True, verbose_name=_('Telegram Chat ID'))
    instagram_username = models.CharField(max_length=50, blank=True, verbose_name=_('Instagram username'))
    
    # Аватар користувача
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name=_('Аватар'))
    
    # Платежна інформація
    stripe_customer_id = models.CharField(max_length=100, blank=True, verbose_name=_('Stripe Customer ID'))
    
    # Налаштування сповіщень
    email_notifications = models.BooleanField(default=True, verbose_name=_('Email сповіщення'))
    telegram_notifications = models.BooleanField(default=False, verbose_name=_('Telegram сповіщення'))
    
    # Статус підписки
    is_subscribed = models.BooleanField(default=False, verbose_name=_('Активна підписка'))
    subscription_plan = models.CharField(
        max_length=20,
        choices=[
            ('free', _('Безкоштовний')),
            ('basic', _('Базовий')),
            ('premium', _('Преміум')),
        ],
        default='free',
        verbose_name=_('План підписки')
    )
    
    # Баланс та фінанси
    balance = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00, 
        verbose_name=_('Баланс рахунку')
    )
    monthly_spending = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00, 
        verbose_name=_('Витрати цього місяця')
    )
    total_spent = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00, 
        verbose_name=_('Загальні витрати')
    )
    
    class Meta:
        verbose_name = _('Користувач')
        verbose_name_plural = _('Користувачі')
    
    def __str__(self):
        return self.email
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    @property
    def avg_spending(self):
        """Обчислює середні місячні витрати за останні 6 місяців"""
        # Поки що повертаємо приблизне значення на основі загальних витрат
        # В майбутньому це можна замінити на реальну логіку з історії транзакцій
        if self.total_spent > 0:
            # Припускаємо, що користувач активний 3 місяці в середньому
            return round(float(self.total_spent) / 3, 2)
        return 0.00 