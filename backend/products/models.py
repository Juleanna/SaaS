from django.db import models
from django.utils.translation import gettext_lazy as _
from stores.models import Store


class Category(models.Model):
    """Категорія товарів"""
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='categories', verbose_name=_('Магазин'))
    name = models.CharField(max_length=100, verbose_name=_('Назва'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    slug = models.SlugField(max_length=100, unique=True, verbose_name=_('URL'))
    image = models.ImageField(upload_to='category_images/', blank=True, verbose_name=_('Зображення'))
    order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активна'))
    
    class Meta:
        verbose_name = _('Категорія')
        verbose_name_plural = _('Категорії')
        ordering = ['order', 'name']
        unique_together = ['store', 'slug']
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"


class Product(models.Model):
    """Товар"""
    
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products', verbose_name=_('Магазин'))
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, 
                                related_name='products', verbose_name=_('Категорія'))
    
    name = models.CharField(max_length=200, verbose_name=_('Назва'))
    slug = models.SlugField(max_length=200, unique=True, verbose_name=_('URL'))
    description = models.TextField(verbose_name=_('Опис'))
    short_description = models.CharField(max_length=300, blank=True, verbose_name=_('Короткий опис'))
    
    # Ціна та наявність
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_('Ціна'))
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name=_('Ціна зі знижкою'))
    currency = models.CharField(max_length=3, default='UAH', verbose_name=_('Валюта'))
    
    # Наявність
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name=_('Кількість на складі'))
    is_in_stock = models.BooleanField(default=True, verbose_name=_('В наявності'))
    allow_backorders = models.BooleanField(default=False, verbose_name=_('Дозволити попереднє замовлення'))
    
    # SEO та відображення
    meta_title = models.CharField(max_length=60, blank=True, verbose_name=_('Meta title'))
    meta_description = models.TextField(blank=True, verbose_name=_('Meta description'))
    is_featured = models.BooleanField(default=False, verbose_name=_('Рекомендований'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    
    # Характеристики
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, verbose_name=_('Вага (кг)'))
    dimensions = models.CharField(max_length=50, blank=True, verbose_name=_('Розміри'))
    sku = models.CharField(max_length=50, blank=True, verbose_name=_('SKU'))
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
    class Meta:
        verbose_name = _('Товар')
        verbose_name_plural = _('Товари')
        ordering = ['-created_at']
        unique_together = ['store', 'slug']
    
    def __str__(self):
        return f"{self.store.name} - {self.name}"
    
    @property
    def current_price(self):
        """Поточна ціна (з урахуванням знижки)"""
        return self.sale_price if self.sale_price else self.price
    
    @property
    def discount_percentage(self):
        """Відсоток знижки"""
        if self.sale_price and self.price:
            return int(((self.price - self.sale_price) / self.price) * 100)
        return 0
    
    @property
    def is_on_sale(self):
        """Чи є товар на розпродажі"""
        return bool(self.sale_price and self.sale_price < self.price)


class ProductImage(models.Model):
    """Зображення товару"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name=_('Товар'))
    image = models.ImageField(upload_to='product_images/', verbose_name=_('Зображення'))
    alt_text = models.CharField(max_length=200, blank=True, verbose_name=_('Alt текст'))
    is_primary = models.BooleanField(default=False, verbose_name=_('Головне зображення'))
    order = models.PositiveIntegerField(default=0, verbose_name=_('Порядок'))
    
    class Meta:
        verbose_name = _('Зображення товару')
        verbose_name_plural = _('Зображення товарів')
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.product.name} - {self.alt_text or 'Зображення'}"
    
    def save(self, *args, **kwargs):
        # Якщо це головне зображення, знімаємо прапорець з інших
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """Варіанти товару (розмір, колір тощо)"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants', verbose_name=_('Товар'))
    name = models.CharField(max_length=100, verbose_name=_('Назва варіанту'))
    value = models.CharField(max_length=100, verbose_name=_('Значення'))
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name=_('Доплата до ціни'))
    stock_quantity = models.PositiveIntegerField(default=0, verbose_name=_('Кількість на складі'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    
    class Meta:
        verbose_name = _('Варіант товару')
        verbose_name_plural = _('Варіанти товарів')
        unique_together = ['product', 'name', 'value']
    
    def __str__(self):
        return f"{self.product.name} - {self.name}: {self.value}"
    
    @property
    def final_price(self):
        """Фінальна ціна з урахуванням доплати"""
        return self.product.current_price + self.price_adjustment 