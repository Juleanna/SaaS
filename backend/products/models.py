from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
import random
import string
import uuid
import re
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
    
    # Дати
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, verbose_name=_('Дата створення'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Дата оновлення'))
    
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
    
    # Ціноутворення (базові поля, детальне управління через прайс-листи)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Ціна продажу'),
        help_text=_('Поточна ціна продажу (синхронізується з прайс-листів)')
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Акційна ціна')
    )
    currency = models.CharField(max_length=3, default='UAH', verbose_name=_('Валюта'))
    
    
    
    
    # Собівартість та методи розрахунку  
    costing_method = models.ForeignKey(
        'warehouse.CostingMethod',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products',
        verbose_name=_('Метод розрахунку собівартості'),
        help_text=_('Якщо не вказано, використовується метод за замовчуванням')
    )
    
    # Налаштування продажу
    minimum_order_quantity = models.DecimalField(
        _('Мінімальна кількість замовлення'),
        max_digits=10,
        decimal_places=3,
        default=Decimal('1'),
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    maximum_order_quantity = models.DecimalField(
        _('Максимальна кількість замовлення'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    order_increment = models.DecimalField(
        _('Крок замовлення'),
        max_digits=10,
        decimal_places=3,
        default=Decimal('1'),
        validators=[MinValueValidator(Decimal('0.001'))],
        help_text=_('Кратність, на яку може збільшуватися кількість замовлення')
    )
    
    # Основні налаштування
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
    
    def get_stock_quantity(self, warehouse=None):
        """Отримати кількість на складі"""
        from warehouse.models import Stock
        
        if warehouse:
            stocks = Stock.objects.filter(
                product=self,
                warehouse=warehouse
            )
        else:
            stocks = Stock.objects.filter(product=self)
        
        return sum(stock.available_quantity for stock in stocks)
    
    def get_total_cost_value(self, warehouse=None):
        """Загальна вартість товару на складі"""
        from warehouse.models import Stock
        
        if warehouse:
            stocks = Stock.objects.filter(
                product=self,
                warehouse=warehouse
            )
        else:
            stocks = Stock.objects.filter(product=self)
        
        total_value = Decimal('0')
        for stock in stocks:
            if stock.cost_price:
                total_value += stock.quantity * stock.cost_price
        
        return total_value
    
    def get_average_cost(self, warehouse=None):
        """Середня собівартість товару"""
        from warehouse.services import CostCalculationService
        from warehouse.models import Warehouse
        
        if not warehouse:
            # Беремо перший активний склад магазину
            warehouse = Warehouse.objects.filter(
                # Тут може бути логіка прив'язки до магазину
                is_active=True
            ).first()
        
        if not warehouse:
            return Decimal('0')
        
        service = CostCalculationService()
        
        # Отримуємо основне фасування товару
        packaging = self.packagings.filter(is_default=True).first()
        if not packaging:
            return Decimal('0')
        
        return service.calculate_average_cost(warehouse, self, packaging)
    
    def get_current_price_from_pricelist(self, store=None):
        """Отримати поточну ціну з активного прайс-листа"""
        from pricelists.models import PriceList, PriceListItem
        
        if not store:
            store = self.store
        
        # Шукаємо активний прайс-лист за замовчуванням
        default_pricelist = PriceList.objects.filter(
            store=store,
            is_active=True,
            is_default=True
        ).first()
        
        if not default_pricelist:
            # Якщо немає за замовчуванням, беремо будь-який активний
            default_pricelist = PriceList.objects.filter(
                store=store,
                is_active=True
            ).first()
        
        if default_pricelist:
            price_item = PriceListItem.objects.filter(
                price_list=default_pricelist,
                product=self
            ).first()
            
            if price_item:
                return price_item.final_price
        
        # Якщо не знайдено в прайс-листах, повертаємо поточну ціну
        return self.price
    
    def get_stock_status_display_data(self):
        """Отримати дані для відображення статусу запасів"""
        total_stock = self.get_stock_quantity()
        
        if total_stock is None or total_stock <= 0:
            return {
                'status': 'out_of_stock',
                'color': 'red',
                'icon': 'inventory',
                'message': 'Немає в наявності'
            }
        
        # Пороги залишків управляються через warehouse систему
        from warehouse.models import Stock
        
        # Перевіряємо критичні залишки через warehouse настройки
        stocks = Stock.objects.filter(product=self)
        low_stocks = [s for s in stocks if s.is_low_stock]
        overstocked = [s for s in stocks if s.is_overstocked]
        
        if low_stocks:
            return {
                'status': 'low',
                'color': 'orange',
                'icon': 'warning',
                'message': f'Мало залишків: {total_stock}'
            }
        
        if overstocked:
            return {
                'status': 'overstocked',
                'color': 'yellow',
                'icon': 'inventory_2',
                'message': f'Багато запасів: {total_stock}'
            }
        
        return {
            'status': 'in_stock',
            'color': 'green',
            'icon': 'check_circle',
            'message': f'В наявності: {total_stock}'
        }
    
    def is_orderable(self, quantity=1, allow_backorders=False):
        """Чи можна замовити товар"""
        if not self.is_active:
            return False
        
        available_stock = self.get_stock_quantity()
        
        if available_stock is None or available_stock <= 0:
            return allow_backorders
        
        if quantity < self.minimum_order_quantity:
            return False
        
        if self.maximum_order_quantity and quantity > self.maximum_order_quantity:
            return False
        
        return available_stock >= quantity
    
    def get_max_orderable_quantity(self, allow_backorders=False):
        """Максимальна кількість, яку можна замовити"""
        if allow_backorders:
            return self.maximum_order_quantity
        
        available_stock = self.get_stock_quantity()
        
        if available_stock is None or available_stock <= 0:
            return Decimal('0')
        
        if self.maximum_order_quantity:
            return min(available_stock, self.maximum_order_quantity)
        
        return available_stock
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


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
    cost_adjustment = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0, 
        verbose_name=_('Доплата до собівартості'),
        help_text=_('Додаткова собівартість для цього варіанту')
    )
    sku_suffix = models.CharField(max_length=20, blank=True, verbose_name=_('Суфікс SKU'))
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    
    # Відстеження варіантів можна робити через окремі записи у Stock з вказанням варіанту
    
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
    
    @property
    def full_sku(self):
        """Повний SKU з урахуванням суфікса"""
        base_sku = self.product.sku or ''
        if self.sku_suffix:
            return f"{base_sku}-{self.sku_suffix}"
        return base_sku
    
    def get_variant_cost(self, warehouse=None):
        """Собівартість варіанту"""
        base_cost = self.product.get_average_cost(warehouse)
        return base_cost + self.cost_adjustment


class ProductSEO(models.Model):
    """SEO налаштування товару"""
    
    product = models.OneToOneField(
        Product, 
        on_delete=models.CASCADE, 
        related_name='seo',
        verbose_name=_('Товар')
    )
    meta_title = models.CharField(max_length=60, blank=True, verbose_name=_('Meta title'))
    meta_description = models.TextField(blank=True, verbose_name=_('Meta description'))
    meta_keywords = models.CharField(max_length=255, blank=True, verbose_name=_('Meta keywords'))
    
    # Open Graph теги
    og_title = models.CharField(max_length=95, blank=True, verbose_name=_('OG title'))
    og_description = models.CharField(max_length=300, blank=True, verbose_name=_('OG description'))
    og_image = models.ImageField(upload_to='og_images/', blank=True, verbose_name=_('OG зображення'))
    
    # Налаштування індексації
    noindex = models.BooleanField(default=False, verbose_name=_('No Index'))
    nofollow = models.BooleanField(default=False, verbose_name=_('No Follow'))
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Оновлено'))
    
    class Meta:
        verbose_name = _('SEO налаштування товару')
        verbose_name_plural = _('SEO налаштування товарів')
    
    def __str__(self):
        return f"SEO для {self.product.name}"


class ProductBarcode(models.Model):
    """Штрихкоди та коди товарів"""
    
    PRODUCT_TYPE_CHOICES = [
        ('piece', _('Поштучний товар')),
        ('weight', _('Ваговий товар')),
    ]
    
    product = models.OneToOneField(
        Product, 
        on_delete=models.CASCADE, 
        related_name='barcode_info',
        verbose_name=_('Товар')
    )
    
    # Тип товару для штрихкодування
    product_type = models.CharField(
        max_length=10,
        choices=PRODUCT_TYPE_CHOICES,
        default='piece',
        verbose_name=_('Тип товару')
    )
    
    # Штрихкоди та QR коди
    barcode = models.CharField(
        max_length=13,
        blank=True,
        unique=True,
        verbose_name=_('Штрихкод'),
        help_text=_('13 цифр для поштучного товару, 7 цифр для вагового')
    )
    qr_code = models.CharField(
        max_length=100,
        blank=True,
        unique=True,
        verbose_name=_('QR код'),
        help_text=_('Унікальний QR код товару')
    )
    auto_generate_codes = models.BooleanField(
        default=True,
        verbose_name=_('Автогенерація кодів'),
        help_text=_('Автоматично генерувати штрихкод і QR код')
    )
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Оновлено'))
    
    class Meta:
        verbose_name = _('Штрихкод товару')
        verbose_name_plural = _('Штрихкоди товарів')
    
    def __str__(self):
        return f"Код для {self.product.name}"
    
    def clean(self):
        """Валідація полів штрихкоду"""
        super().clean()
        
        # Валідація штрихкоду
        if self.barcode:
            if not re.match(r'^\d+$', self.barcode):
                raise ValidationError({
                    'barcode': _('Штрихкод повинен містити тільки цифри')
                })
            
            if self.product_type == 'piece' and len(self.barcode) != 13:
                raise ValidationError({
                    'barcode': _('Штрихкод для поштучного товару повинен містити 13 цифр')
                })
            elif self.product_type == 'weight' and len(self.barcode) != 7:
                raise ValidationError({
                    'barcode': _('Штрихкод для вагового товару повинен містити 7 цифр')
                })
    
    def generate_barcode(self):
        """Генерація штрихкоду"""
        if self.product_type == 'piece':
            # Генеруємо 13-значний штрихкод для поштучного товару
            while True:
                barcode = ''.join([str(random.randint(0, 9)) for _ in range(13)])
                if not ProductBarcode.objects.filter(barcode=barcode).exists():
                    return barcode
        else:
            # Генеруємо 7-значний штрихкод для вагового товару
            while True:
                barcode = ''.join([str(random.randint(0, 9)) for _ in range(7)])
                if not ProductBarcode.objects.filter(barcode=barcode).exists():
                    return barcode
    
    def generate_qr_code(self):
        """Генерація QR коду"""
        while True:
            qr_code = str(uuid.uuid4()).replace('-', '').upper()[:12]
            if not ProductBarcode.objects.filter(qr_code=qr_code).exists():
                return qr_code
    
    def save(self, *args, **kwargs):
        # Автоматична генерація кодів
        if self.auto_generate_codes:
            if not self.barcode:
                self.barcode = self.generate_barcode()
            if not self.qr_code:
                self.qr_code = self.generate_qr_code()
        
        # Валідація перед збереженням
        self.full_clean()
        
        super().save(*args, **kwargs) 