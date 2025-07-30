from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.urls import reverse
from accounts.models import User


class Store(models.Model):
    """Модель магазину"""
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_('Власник'))
    name = models.CharField(max_length=200, verbose_name=_('Назва магазину'))
    slug = models.SlugField(max_length=200, unique=True, verbose_name=_('URL магазину'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    
    # Контактна інформація
    phone = models.CharField(max_length=20, blank=True, verbose_name=_('Телефон'))
    email = models.EmailField(blank=True, verbose_name=_('Email'))
    address = models.TextField(blank=True, verbose_name=_('Адреса'))
    
    # Налаштування дизайну
    logo = models.ImageField(upload_to='store_logos/', blank=True, verbose_name=_('Логотип'))
    banner_image = models.ImageField(upload_to='store_banners/', blank=True, verbose_name=_('Банер'))
    
    # Кольорова схема
    primary_color = models.CharField(max_length=7, default='#3B82F6', verbose_name=_('Основний колір'))
    secondary_color = models.CharField(max_length=7, default='#1F2937', verbose_name=_('Додатковий колір'))
    accent_color = models.CharField(max_length=7, default='#F59E0B', verbose_name=_('Акцентний колір'))
    
    # Налаштування лендингу
    show_instagram_feed = models.BooleanField(default=False, verbose_name=_('Показувати Instagram стрічку'))
    show_telegram_button = models.BooleanField(default=True, verbose_name=_('Показувати кнопку Telegram'))
    custom_css = models.TextField(blank=True, verbose_name=_('Кастомний CSS'))
    
    # SEO налаштування
    meta_title = models.CharField(max_length=60, blank=True, verbose_name=_('Meta title'))
    meta_description = models.TextField(blank=True, verbose_name=_('Meta description'))
    
    # Статус
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    is_featured = models.BooleanField(default=False, verbose_name=_('Рекомендований'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    class Meta:
        verbose_name = _('Магазин')
        verbose_name_plural = _('Магазини')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        return reverse('store_detail', kwargs={'slug': self.slug})
    
    @property
    def products_count(self):
        return self.products.filter(is_active=True).count()
    
    @property
    def orders_count(self):
        return self.orders.count()


class StoreBlock(models.Model):
    """Блоки контенту для лендингу магазину"""
    
    BLOCK_TYPES = [
        ('about', _('Про нас')),
        ('contact', _('Контакти')),
        ('faq', _('Часті питання')),
        ('custom', _('Кастомний блок')),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='blocks', verbose_name=_('Магазин'))
    title = models.CharField(max_length=200, verbose_name=_('Заголовок'))
    content = models.TextField(verbose_name=_('Контент'))
    block_type = models.CharField(max_length=20, choices=BLOCK_TYPES, default='custom', verbose_name=_('Тип блоку'))
    order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    
    class Meta:
        verbose_name = _('Блок магазину')
        verbose_name_plural = _('Блоки магазину')
        ordering = ['order']
    
    def __str__(self):
        return f"{self.store.name} - {self.title}"


class StoreSocialLink(models.Model):
    """Соціальні мережі магазину"""
    
    SOCIAL_TYPES = [
        ('instagram', 'Instagram'),
        ('telegram', 'Telegram'),
        ('facebook', 'Facebook'),
        ('twitter', 'Twitter'),
        ('youtube', 'YouTube'),
        ('website', 'Веб-сайт'),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='social_links', verbose_name=_('Магазин'))
    social_type = models.CharField(max_length=20, choices=SOCIAL_TYPES, verbose_name=_('Тип соцмережі'))
    url = models.URLField(verbose_name=_('URL'))
    title = models.CharField(max_length=100, blank=True, verbose_name=_('Назва'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    
    class Meta:
        verbose_name = _('Соціальна мережа')
        verbose_name_plural = _('Соціальні мережі')
        unique_together = ['store', 'social_type']
    
    def __str__(self):
        return f"{self.store.name} - {self.get_social_type_display()}" 