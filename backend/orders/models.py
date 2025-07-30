from django.db import models
from django.utils.translation import gettext_lazy as _
from stores.models import Store
from products.models import Product, ProductVariant
from accounts.models import User


class Order(models.Model):
    """Замовлення"""
    
    STATUS_CHOICES = [
        ('pending', _('Очікує підтвердження')),
        ('confirmed', _('Підтверджено')),
        ('processing', _('В обробці')),
        ('shipped', _('Відправлено')),
        ('delivered', _('Доставлено')),
        ('cancelled', _('Скасовано')),
        ('refunded', _('Повернено')),
    ]
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='orders', verbose_name=_('Магазин'))
    
    # Номер замовлення
    order_number = models.CharField(max_length=50, unique=True, verbose_name=_('Номер замовлення'))
    
    # Дані клієнта
    customer_name = models.CharField(max_length=200, verbose_name=_('Ім\'я клієнта'))
    customer_email = models.EmailField(verbose_name=_('Email клієнта'))
    customer_phone = models.CharField(max_length=20, verbose_name=_('Телефон клієнта'))
    
    # Адреса доставки
    shipping_address = models.TextField(verbose_name=_('Адреса доставки'))
    shipping_city = models.CharField(max_length=100, verbose_name=_('Місто'))
    shipping_postal_code = models.CharField(max_length=20, blank=True, verbose_name=_('Поштовий індекс'))
    
    # Статус та дати
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name=_('Статус'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    # Суми
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Підсумок'))
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Вартість доставки'))
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Податок'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Загальна сума'))
    
    # Валюта
    currency = models.CharField(max_length=3, default='UAH', verbose_name=_('Валюта'))
    
    # Додаткова інформація
    notes = models.TextField(blank=True, verbose_name=_('Примітки'))
    tracking_number = models.CharField(max_length=100, blank=True, verbose_name=_('Номер відстеження'))
    
    # Платіжна інформація
    payment_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', _('Очікує оплати')),
            ('paid', _('Оплачено')),
            ('failed', _('Помилка оплати')),
            ('refunded', _('Повернено')),
        ],
        default='pending',
        verbose_name=_('Статус оплати')
    )
    payment_method = models.CharField(max_length=50, blank=True, verbose_name=_('Спосіб оплати'))
    payment_transaction_id = models.CharField(max_length=100, blank=True, verbose_name=_('ID транзакції'))
    
    # Джерело замовлення
    source = models.CharField(
        max_length=20,
        choices=[
            ('website', _('Веб-сайт')),
            ('telegram', _('Telegram')),
            ('instagram', _('Instagram')),
            ('phone', _('Телефон')),
        ],
        default='website',
        verbose_name=_('Джерело замовлення')
    )
    
    class Meta:
        verbose_name = _('Замовлення')
        verbose_name_plural = _('Замовлення')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.store.name} - {self.order_number}"
    
    def save(self, *args, **kwargs):
        if not self.order_number:
            # Генеруємо номер замовлення
            import uuid
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Розраховуємо загальну суму
        self.total_amount = self.subtotal + self.shipping_cost + self.tax_amount
        
        super().save(*args, **kwargs)
    
    @property
    def items_count(self):
        """Кількість товарів у замовленні"""
        return self.items.count()
    
    @property
    def status_display(self):
        """Відображення статусу"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)


class OrderItem(models.Model):
    """Товар у замовленні"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name=_('Замовлення'))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_('Товар'))
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Варіант'))
    
    product_name = models.CharField(max_length=200, verbose_name=_('Назва товару'))
    product_sku = models.CharField(max_length=50, blank=True, verbose_name=_('SKU товару'))
    
    quantity = models.PositiveIntegerField(verbose_name=_('Кількість'))
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Ціна за одиницю'))
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Загальна ціна'))
    
    # Збереження варіанту на момент замовлення
    variant_name = models.CharField(max_length=100, blank=True, verbose_name=_('Назва варіанту'))
    variant_value = models.CharField(max_length=100, blank=True, verbose_name=_('Значення варіанту'))
    
    class Meta:
        verbose_name = _('Товар замовлення')
        verbose_name_plural = _('Товари замовлення')
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product_name}"
    
    def save(self, *args, **kwargs):
        if not self.product_name:
            self.product_name = self.product.name
        if not self.product_sku:
            self.product_sku = self.product.sku
        
        if self.variant:
            self.variant_name = self.variant.name
            self.variant_value = self.variant.value
        
        # Розраховуємо загальну ціну
        self.total_price = self.unit_price * self.quantity
        
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """Історія зміни статусів замовлення"""
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history', verbose_name=_('Замовлення'))
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES, verbose_name=_('Статус'))
    notes = models.TextField(blank=True, verbose_name=_('Примітки'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата зміни'))
    
    class Meta:
        verbose_name = _('Історія статусу замовлення')
        verbose_name_plural = _('Історія статусів замовлень')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.order.order_number} - {self.get_status_display()}"


class Cart(models.Model):
    """Кошик покупця"""
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='carts', verbose_name=_('Магазин'))
    session_key = models.CharField(max_length=40, verbose_name=_('Ключ сесії'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    class Meta:
        verbose_name = _('Кошик')
        verbose_name_plural = _('Кошики')
        unique_together = ['store', 'session_key']
    
    def __str__(self):
        return f"{self.store.name} - {self.session_key}"


class CartItem(models.Model):
    """Товар у кошику"""
    
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name=_('Кошик'))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name=_('Товар'))
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_('Варіант'))
    quantity = models.PositiveIntegerField(default=1, verbose_name=_('Кількість'))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата додавання'))
    
    class Meta:
        verbose_name = _('Товар у кошику')
        verbose_name_plural = _('Товари у кошику')
        unique_together = ['cart', 'product', 'variant']
    
    def __str__(self):
        variant_info = f" ({self.variant.value})" if self.variant else ""
        return f"{self.cart} - {self.product.name}{variant_info}"
    
    @property
    def total_price(self):
        """Загальна ціна товару"""
        if self.variant:
            return self.variant.final_price * self.quantity
        return self.product.current_price * self.quantity 