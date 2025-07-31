from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
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
    
    # Ціноутворення
    base_cost = models.DecimalField(
        _('Базова собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_('Орієнтовна собівартість для розрахунків (якщо не використовується автоматичний розрахунок)')
    )
    markup_percentage = models.DecimalField(
        _('Націнка (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('0'),
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Відсоток націнки до собівартості')
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('Ціна продажу')
    )
    sale_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Акційна ціна')
    )
    currency = models.CharField(max_length=3, default='UAH', verbose_name=_('Валюта'))
    
    # Автоматичне ціноутворення
    auto_pricing = models.BooleanField(
        _('Автоматичне ціноутворення'),
        default=False,
        help_text=_('Автоматично розраховувати ціну на основі собівартості та націнки')
    )
    price_update_frequency = models.CharField(
        _('Частота оновлення ціни'),
        max_length=20,
        choices=[
            ('manual', _('Вручну')),
            ('daily', _('Щодня')),
            ('weekly', _('Щотижня')),
            ('on_cost_change', _('При зміні собівартості')),
        ],
        default='manual'
    )
    
    # Управління запасами
    track_stock = models.BooleanField(
        _('Відстежувати залишки'),
        default=True,
        help_text=_('Увімкнути облік залишків на складах')
    )
    stock_status = models.CharField(
        _('Статус наявності'),
        max_length=20,
        choices=[
            ('in_stock', _('В наявності')),
            ('out_of_stock', _('Немає в наявності')),
            ('limited', _('Обмежена кількість')),
            ('preorder', _('Під замовлення')),
            ('discontinued', _('Знято з виробництва')),
        ],
        default='in_stock'
    )
    allow_backorders = models.BooleanField(
        _('Дозволити попереднє замовлення'),
        default=False,
        help_text=_('Дозволити замовлення при відсутності на складі')
    )
    
    # Пороги для попереджень
    low_stock_threshold = models.DecimalField(
        _('Поріг малих залишків'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Мінімальна кількість для попередження про малі залишки')
    )
    critical_stock_threshold = models.DecimalField(
        _('Критичний поріг залишків'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Критична кількість для терміновго поповнення')
    )
    optimal_stock_level = models.DecimalField(
        _('Оптимальний рівень запасів'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))],
        help_text=_('Цільова кількість для підтримки на складі')
    )
    
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
    last_cost_update = models.DateTimeField(
        _('Останнє оновлення собівартості'),
        null=True,
        blank=True
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
    
    def get_stock_quantity(self, warehouse=None):
        """Отримати кількість на складі"""
        if not self.track_stock:
            return None
        
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
        if not self.track_stock:
            return Decimal('0')
        
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
            return self.base_cost or Decimal('0')
        
        service = CostCalculationService()
        
        # Отримуємо основне фасування товару
        packaging = self.packagings.filter(is_default=True).first()
        if not packaging:
            return self.base_cost or Decimal('0')
        
        return service.calculate_average_cost(warehouse, self, packaging)
    
    def calculate_suggested_price(self, warehouse=None):
        """Розрахувати рекомендовану ціну на основі собівартості та націнки"""
        cost = self.get_average_cost(warehouse)
        if not cost:
            cost = self.base_cost or Decimal('0')
        
        if cost and self.markup_percentage:
            markup_amount = cost * (self.markup_percentage / 100)
            return cost + markup_amount
        
        return cost
    
    def update_price_from_cost(self, warehouse=None, save=True):
        """Оновити ціну на основі собівартості та націнки"""
        if self.auto_pricing:
            suggested_price = self.calculate_suggested_price(warehouse)
            if suggested_price:
                self.price = suggested_price
                self.last_cost_update = timezone.now()
                if save:
                    self.save(update_fields=['price', 'last_cost_update'])
        return self.price
    
    def get_stock_status_display_data(self):
        """Отримати дані для відображення статусу запасів"""
        total_stock = self.get_stock_quantity()
        
        if not self.track_stock:
            return {
                'status': 'not_tracked',
                'color': 'gray',
                'icon': 'visibility_off',
                'message': 'Не відстежується'
            }
        
        if total_stock is None or total_stock <= 0:
            return {
                'status': 'out_of_stock',
                'color': 'red',
                'icon': 'inventory',
                'message': 'Немає в наявності'
            }
        
        if self.critical_stock_threshold and total_stock <= self.critical_stock_threshold:
            return {
                'status': 'critical',
                'color': 'red',
                'icon': 'warning',
                'message': f'Критично мало: {total_stock}'
            }
        
        if self.low_stock_threshold and total_stock <= self.low_stock_threshold:
            return {
                'status': 'low',
                'color': 'orange',
                'icon': 'inventory_2',
                'message': f'Мало залишків: {total_stock}'
            }
        
        return {
            'status': 'in_stock',
            'color': 'green',
            'icon': 'check_circle',
            'message': f'В наявності: {total_stock}'
        }
    
    def is_orderable(self, quantity=1):
        """Чи можна замовити товар"""
        if not self.is_active:
            return False
        
        if not self.track_stock:
            return True
        
        available_stock = self.get_stock_quantity()
        
        if available_stock is None or available_stock <= 0:
            return self.allow_backorders
        
        if quantity < self.minimum_order_quantity:
            return False
        
        if self.maximum_order_quantity and quantity > self.maximum_order_quantity:
            return False
        
        return available_stock >= quantity
    
    def get_max_orderable_quantity(self):
        """Максимальна кількість, яку можна замовити"""
        if not self.track_stock or self.allow_backorders:
            return self.maximum_order_quantity
        
        available_stock = self.get_stock_quantity()
        
        if available_stock is None or available_stock <= 0:
            return Decimal('0')
        
        if self.maximum_order_quantity:
            return min(available_stock, self.maximum_order_quantity)
        
        return available_stock
    
    def save(self, *args, **kwargs):
        # Автоматичне оновлення ціни при збереженні
        if self.auto_pricing and self.base_cost and self.markup_percentage:
            self.price = self.calculate_suggested_price()
        
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