from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal
import uuid
from accounts.models import User
from stores.models import Store
from products.models import Category


class PriceList(models.Model):
    """Прайс-лист для управління цінами товарів"""
    
    PRICING_STRATEGY_CHOICES = [
        ('manual', _('Ручне встановлення цін')),
        ('cost_plus_markup', _('Собівартість + націнка')),
        ('competitor_based', _('На основі цін конкурентів')),
        ('value_based', _('Цінова стратегія на основі цінності')),
        ('dynamic', _('Динамічне ціноутворення')),
    ]
    
    UPDATE_FREQUENCY_CHOICES = [
        ('manual', _('Вручну')),
        ('daily', _('Щодня')),
        ('weekly', _('Щотижня')),
        ('monthly', _('Щомісяця')),
        ('on_cost_change', _('При зміні собівартості')),
        ('on_supply', _('При постачанні')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    store = models.ForeignKey(
        Store, 
        on_delete=models.CASCADE, 
        related_name='price_lists',
        verbose_name=_('Магазин')
    )
    name = models.CharField(max_length=200, verbose_name=_('Назва прайс-листа'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    
    # Стратегія ціноутворення
    pricing_strategy = models.CharField(
        max_length=20, 
        choices=PRICING_STRATEGY_CHOICES, 
        default='cost_plus_markup',
        verbose_name=_('Стратегія ціноутворення')
    )
    default_markup_percentage = models.DecimalField(
        _('Націнка за замовчуванням (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('20.00'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('999.99'))]
    )
    default_markup_amount = models.DecimalField(
        _('Фіксована націнка за замовчуванням'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Налаштування
    is_active = models.BooleanField(default=True, verbose_name=_('Активний'))
    is_default = models.BooleanField(default=False, verbose_name=_('За замовчуванням'))
    
    # Автоматичне оновлення
    auto_update_from_cost = models.BooleanField(
        default=False, 
        verbose_name=_('Автоматично оновлювати з собівартості')
    )
    update_frequency = models.CharField(
        max_length=20, 
        choices=UPDATE_FREQUENCY_CHOICES,
        default='manual',
        verbose_name=_('Частота оновлення')
    )
    last_cost_sync = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Остання синхронізація собівартості')
    )
    
    # Валідність прайс-листа
    valid_from = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Діє з')
    )
    valid_until = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Діє до')
    )
    
    # Метадані
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_price_lists',
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Оновлено'))

    class Meta:
        verbose_name = _('Прайс-лист')
        verbose_name_plural = _('Прайс-листи')
        ordering = ['-created_at']
        unique_together = ['store', 'name']

    def __str__(self):
        return f"{self.store.name} - {self.name}"
    
    @property
    def items_count(self):
        """Кількість позицій в прайс-листі"""
        return self.items.count()
    
    @property
    def is_valid(self):
        """Чи дійсний прайс-лист зараз"""
        now = timezone.now()
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_until and now > self.valid_until:
            return False
        return self.is_active
    
    def save(self, *args, **kwargs):
        # Тільки один прайс-лист може бути за замовчуванням для магазину
        if self.is_default:
            PriceList.objects.filter(
                store=self.store, 
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
        
        super().save(*args, **kwargs)


class PriceListItem(models.Model):
    """Позиція прайс-листа"""
    
    MARKUP_TYPE_CHOICES = [
        ('percentage', _('Відсоток від собівартості')),
        ('fixed_amount', _('Фіксована сума')),
        ('fixed_price', _('Фіксована ціна')),
        ('formula', _('Формула розрахунку')),
    ]
    
    COST_CALCULATION_CHOICES = [
        ('auto', _('Автоматично з warehouse')),
        ('manual', _('Ручне введення')),
        ('last_supply', _('З останнього постачання')),
        ('average_supply', _('Середнє по постачанням')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price_list = models.ForeignKey(
        PriceList, 
        on_delete=models.CASCADE, 
        related_name='items',
        verbose_name=_('Прайс-лист')
    )
    product = models.ForeignKey(
        'products.Product', 
        on_delete=models.CASCADE,
        verbose_name=_('Товар')
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name=_('Категорія'),
        help_text=_('Автоматично заповнюється з товару')
    )
    
    # Собівартість
    cost_calculation_method = models.CharField(
        max_length=20,
        choices=COST_CALCULATION_CHOICES,
        default='auto',
        verbose_name=_('Метод розрахунку собівартості')
    )
    manual_cost = models.DecimalField(
        _('Ручна собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    calculated_cost = models.DecimalField(
        _('Розрахована собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    
    # Націнка
    markup_type = models.CharField(
        max_length=20, 
        choices=MARKUP_TYPE_CHOICES, 
        default='percentage',
        verbose_name=_('Тип націнки')
    )
    markup_value = models.DecimalField(
        _('Значення націнки'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    markup_formula = models.TextField(
        blank=True,
        verbose_name=_('Формула розрахунку'),
        help_text=_('Приклад: cost * 1.5 + 10 (доступні змінні: cost, category_markup)')
    )
    
    # Результуюча ціна
    calculated_price = models.DecimalField(
        _('Розрахована ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    manual_price = models.DecimalField(
        _('Ручна ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    final_price = models.DecimalField(
        _('Фінальна ціна'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Обмеження цін
    min_price = models.DecimalField(
        _('Мінімальна ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    max_price = models.DecimalField(
        _('Максимальна ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Налаштування
    is_manual_override = models.BooleanField(
        default=False,
        verbose_name=_('Ручне перевизначення'),
        help_text=_('Ціна встановлена вручну і не буде автоматично оновлюватися')
    )
    exclude_from_auto_update = models.BooleanField(
        default=False,
        verbose_name=_('Виключити з автооновлення')
    )
    
    # Метадані
    last_cost_update = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Останнє оновлення собівартості')
    )
    last_price_update = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name=_('Останнє оновлення ціни')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_('Оновлено'))

    class Meta:
        verbose_name = _('Позиція прайс-листа')
        verbose_name_plural = _('Позиції прайс-листа')
        ordering = ['product__name']
        unique_together = ['price_list', 'product']

    def __str__(self):
        return f"{self.price_list.name} - {self.product.name}"
    
    @property
    def current_cost(self):
        """Поточна собівартість для розрахунків"""
        if self.cost_calculation_method == 'manual' and self.manual_cost:
            return self.manual_cost
        return self.calculated_cost or Decimal('0')
    
    @property
    def profit_margin(self):
        """Рентабельність (у відсотках)"""
        if self.current_cost and self.final_price:
            profit = self.final_price - self.current_cost
            return (profit / self.current_cost) * 100
        return Decimal('0')
    
    @property
    def profit_amount(self):
        """Абсолютний прибуток"""
        if self.current_cost and self.final_price:
            return self.final_price - self.current_cost
        return Decimal('0')
    
    def calculate_price(self):
        """Розрахунок ціни на основі налаштувань"""
        cost = self.current_cost
        if not cost:
            return None
        
        if self.markup_type == 'percentage':
            calculated_price = cost * (1 + self.markup_value / 100)
        elif self.markup_type == 'fixed_amount':
            calculated_price = cost + self.markup_value
        elif self.markup_type == 'fixed_price':
            calculated_price = self.markup_value
        elif self.markup_type == 'formula' and self.markup_formula:
            try:
                # Безпечний калькулятор формул
                context = {
                    'cost': float(cost),
                    'category_markup': float(self.price_list.default_markup_percentage),
                }
                calculated_price = Decimal(str(eval(self.markup_formula, {"__builtins__": {}}, context)))
            except:
                calculated_price = cost
        else:
            calculated_price = cost
        
        # Перевірка мін/макс обмежень
        if self.min_price and calculated_price < self.min_price:
            calculated_price = self.min_price
        if self.max_price and calculated_price > self.max_price:
            calculated_price = self.max_price
            
        return calculated_price
    
    def save(self, *args, **kwargs):
        # Автоматично заповнюємо категорію з товару
        if not self.category and self.product.category:
            self.category = self.product.category
        
        # Розраховуємо ціну якщо не встановлена вручну
        if not self.is_manual_override:
            calculated = self.calculate_price()
            if calculated:
                self.calculated_price = calculated
                self.final_price = self.manual_price if self.manual_price else calculated
        else:
            self.final_price = self.manual_price if self.manual_price else self.calculated_price
        
        super().save(*args, **kwargs)


class BulkPriceUpdate(models.Model):
    """Масове оновлення цін"""
    
    UPDATE_TYPE_CHOICES = [
        ('by_category', _('За категорією')),
        ('by_supplier', _('За постачальником')),
        ('by_selection', _('Вибрані товари')),
        ('all_products', _('Всі товари в прайс-листі')),
        ('price_range', _('За діапазоном цін')),
        ('markup_adjustment', _('Коригування націнки')),
    ]
    
    ADJUSTMENT_TYPE_CHOICES = [
        ('percentage', _('Відсоток')),
        ('fixed_amount', _('Фіксована сума')),
        ('set_markup', _('Встановити націнку')),
        ('set_price', _('Встановити ціну')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price_list = models.ForeignKey(
        PriceList, 
        on_delete=models.CASCADE, 
        related_name='bulk_updates',
        verbose_name=_('Прайс-лист')
    )
    name = models.CharField(max_length=200, verbose_name=_('Назва операції'))
    description = models.TextField(blank=True, verbose_name=_('Опис'))
    
    update_type = models.CharField(
        max_length=20, 
        choices=UPDATE_TYPE_CHOICES,
        verbose_name=_('Тип оновлення')
    )
    
    # Параметри оновлення
    adjustment_type = models.CharField(
        max_length=20, 
        choices=ADJUSTMENT_TYPE_CHOICES,
        verbose_name=_('Тип коригування')
    )
    adjustment_value = models.DecimalField(
        _('Значення коригування'),
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Фільтри
    categories = models.ManyToManyField(
        Category, 
        blank=True,
        verbose_name=_('Категорії')
    )
    min_current_price = models.DecimalField(
        _('Мінімальна поточна ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    max_current_price = models.DecimalField(
        _('Максимальна поточна ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    selected_products = models.ManyToManyField(
        'products.Product',
        blank=True,
        verbose_name=_('Вибрані товари')
    )
    
    # Статус виконання
    is_executed = models.BooleanField(default=False, verbose_name=_('Виконано'))
    executed_at = models.DateTimeField(null=True, blank=True, verbose_name=_('Час виконання'))
    affected_items_count = models.PositiveIntegerField(default=0, verbose_name=_('Змінено позицій'))
    execution_log = models.TextField(blank=True, verbose_name=_('Лог виконання'))
    
    # Метадані
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Створено'))

    class Meta:
        verbose_name = _('Масове оновлення цін')
        verbose_name_plural = _('Масові оновлення цін')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.price_list.name} - {self.name}"


class PriceHistory(models.Model):
    """Історія зміни цін"""
    
    CHANGE_REASON_CHOICES = [
        ('manual', _('Ручна зміна')),
        ('cost_update', _('Оновлення собівартості')),
        ('bulk_update', _('Масове оновлення')),
        ('supply', _('Постачання')),
        ('competitor_price', _('Зміна цін конкурентів')),
        ('seasonal', _('Сезонна зміна')),
        ('promotion', _('Акція')),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    price_list_item = models.ForeignKey(
        PriceListItem,
        on_delete=models.CASCADE,
        related_name='price_history',
        verbose_name=_('Позиція прайс-листа')
    )
    
    # Зміни цін
    old_cost = models.DecimalField(
        _('Стара собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    new_cost = models.DecimalField(
        _('Нова собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    old_price = models.DecimalField(
        _('Стара ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    new_price = models.DecimalField(
        _('Нова ціна'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Метадані зміни
    change_reason = models.CharField(
        max_length=20,
        choices=CHANGE_REASON_CHOICES,
        default='manual',
        verbose_name=_('Причина зміни')
    )
    bulk_update = models.ForeignKey(
        BulkPriceUpdate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('Масове оновлення')
    )
    notes = models.TextField(blank=True, verbose_name=_('Примітки'))
    
    # Користувач та час
    changed_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_('Змінено користувачем')
    )
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name=_('Час зміни'))

    class Meta:
        verbose_name = _('Історія зміни ціни')
        verbose_name_plural = _('Історія зміни цін')
        ordering = ['-changed_at']

    def __str__(self):
        return f"{self.price_list_item.product.name} - {self.changed_at.strftime('%d.%m.%Y %H:%M')}"
    
    @property
    def price_change_percentage(self):
        """Відсоток зміни ціни"""
        if self.old_price and self.new_price and self.old_price > 0:
            return ((self.new_price - self.old_price) / self.old_price) * 100
        return Decimal('0')