from django.db import models
from django.utils.translation import gettext_lazy as _
from stores.models import Store
from accounts.models import User


class TelegramBot(models.Model):
    """Telegram бот для магазину"""
    
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='telegram_bot', verbose_name=_('Магазин'))
    bot_token = models.CharField(max_length=100, verbose_name=_('Токен бота'))
    bot_username = models.CharField(max_length=50, verbose_name=_('Username бота'))
    
    # Налаштування
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    welcome_message = models.TextField(blank=True, verbose_name=_('Привітальне повідомлення'))
    help_message = models.TextField(blank=True, verbose_name=_('Повідомлення допомоги'))
    
    # Автоматичні сповіщення
    notify_new_orders = models.BooleanField(default=True, verbose_name=_('Сповіщати про нові замовлення'))
    notify_status_changes = models.BooleanField(default=True, verbose_name=_('Сповіщати про зміну статусу'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    class Meta:
        verbose_name = _('Telegram бот')
        verbose_name_plural = _('Telegram боти')
    
    def __str__(self):
        return f"{self.store.name} - @{self.bot_username}"


class TelegramUser(models.Model):
    """Користувач Telegram"""
    
    telegram_id = models.BigIntegerField(unique=True, verbose_name=_('Telegram ID'))
    username = models.CharField(max_length=50, blank=True, verbose_name=_('Username'))
    first_name = models.CharField(max_length=100, blank=True, verbose_name=_('Ім\'я'))
    last_name = models.CharField(max_length=100, blank=True, verbose_name=_('Прізвище'))
    
    # Зв\'язок з користувачем системи
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Користувач системи'))
    
    # Статус
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    is_blocked = models.BooleanField(default=False, verbose_name=_('Заблокований'))
    
    # Налаштування
    language_code = models.CharField(max_length=10, default='uk', verbose_name=_('Мова'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата реєстрації'))
    last_activity = models.DateTimeField(auto_now=True, verbose_name=_('Остання активність'))
    
    class Meta:
        verbose_name = _('Telegram користувач')
        verbose_name_plural = _('Telegram користувачі')
    
    def __str__(self):
        return f"@{self.username}" if self.username else f"ID: {self.telegram_id}"


class TelegramSession(models.Model):
    """Сесія користувача в Telegram боті"""
    
    user = models.ForeignKey(TelegramUser, on_delete=models.CASCADE, related_name='sessions', verbose_name=_('Користувач'))
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='telegram_sessions', verbose_name=_('Магазин'))
    
    # Стан сесії
    current_state = models.CharField(max_length=50, default='main_menu', verbose_name=_('Поточний стан'))
    context_data = models.JSONField(default=dict, blank=True, verbose_name=_('Дані контексту'))
    
    # Кошик
    cart_items = models.JSONField(default=list, blank=True, verbose_name=_('Товари в кошику'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    class Meta:
        verbose_name = _('Telegram сесія')
        verbose_name_plural = _('Telegram сесії')
        unique_together = ['user', 'store']
    
    def __str__(self):
        return f"{self.user} - {self.store.name}"


class TelegramMessage(models.Model):
    """Повідомлення Telegram"""
    
    MESSAGE_TYPES = [
        ('text', _('Текст')),
        ('photo', _('Фото')),
        ('video', _('Відео')),
        ('document', _('Документ')),
        ('location', _('Локація')),
        ('contact', _('Контакт')),
    ]
    
    user = models.ForeignKey(TelegramUser, on_delete=models.CASCADE, related_name='messages', verbose_name=_('Користувач'))
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='telegram_messages', verbose_name=_('Магазин'))
    
    message_id = models.BigIntegerField(verbose_name=_('ID повідомлення'))
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPES, default='text', verbose_name=_('Тип повідомлення'))
    
    text = models.TextField(blank=True, verbose_name=_('Текст'))
    data = models.JSONField(default=dict, blank=True, verbose_name=_('Додаткові дані'))
    
    # Відправка
    is_from_bot = models.BooleanField(default=False, verbose_name=_('Від бота'))
    is_handled = models.BooleanField(default=False, verbose_name=_('Оброблено'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    
    class Meta:
        verbose_name = _('Telegram повідомлення')
        verbose_name_plural = _('Telegram повідомлення')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user} - {self.message_type} - {self.created_at}" 