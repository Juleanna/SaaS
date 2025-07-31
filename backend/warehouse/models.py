from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal


User = get_user_model()


class Unit(models.Model):
    """Одиниці вимірювання"""
    name = models.CharField(_('Назва'), max_length=50, unique=True)
    short_name = models.CharField(_('Скорочена назва'), max_length=10)
    is_base = models.BooleanField(_('Базова одиниця'), default=False)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Одиниця вимірювання')
        verbose_name_plural = _('Одиниці вимірювання')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.short_name})"


class Supplier(models.Model):
    """Постачальники"""
    name = models.CharField(_('Назва'), max_length=200)
    code = models.CharField(_('Код'), max_length=50, unique=True)
    contact_person = models.CharField(_('Контактна особа'), max_length=100, blank=True)
    phone = models.CharField(_('Телефон'), max_length=20, blank=True)
    email = models.EmailField(_('Email'), blank=True)
    address = models.TextField(_('Адреса'), blank=True)
    tax_number = models.CharField(_('ІПН/ЄДРПОУ'), max_length=50, blank=True)
    payment_terms = models.PositiveIntegerField(_('Умови оплати (днів)'), default=30)
    is_active = models.BooleanField(_('Активний'), default=True)
    notes = models.TextField(_('Примітки'), blank=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Постачальник')
        verbose_name_plural = _('Постачальники')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Warehouse(models.Model):
    """Склади"""
    name = models.CharField(_('Назва'), max_length=100)
    code = models.CharField(_('Код'), max_length=20, unique=True)
    address = models.TextField(_('Адреса'), blank=True)
    manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name=_('Завідувач')
    )
    is_active = models.BooleanField(_('Активний'), default=True)
    description = models.TextField(_('Опис'), blank=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Склад')
        verbose_name_plural = _('Склади')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Packaging(models.Model):
    """Фасування товарів"""
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='packagings',
        verbose_name=_('Товар')
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        verbose_name=_('Одиниця вимірювання')
    )
    quantity = models.DecimalField(
        _('Кількість в упаковці'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    barcode = models.CharField(_('Штрих-код'), max_length=50, blank=True)
    is_default = models.BooleanField(_('За замовчуванням'), default=False)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Фасування')
        verbose_name_plural = _('Фасування')
        ordering = ['product', '-is_default', 'quantity']
        unique_together = ['product', 'unit', 'quantity']

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.unit.short_name}"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Зняти відмітку "за замовчуванням" з інших фасувань цього товару
            Packaging.objects.filter(
                product=self.product,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class Stock(models.Model):
    """Залишки товарів на складах"""
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stocks',
        verbose_name=_('Склад')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='stocks',
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    quantity = models.DecimalField(
        _('Кількість'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    reserved_quantity = models.DecimalField(
        _('Зарезервована кількість'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    cost_price = models.DecimalField(
        _('Собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    min_stock = models.DecimalField(
        _('Мінімальний залишок'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    max_stock = models.DecimalField(
        _('Максимальний залишок'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Залишок')
        verbose_name_plural = _('Залишки')
        ordering = ['warehouse', 'product']
        unique_together = ['warehouse', 'product', 'packaging']

    def __str__(self):
        return f"{self.warehouse.name} - {self.product.name} ({self.packaging}) - {self.quantity}"

    @property
    def available_quantity(self):
        """Доступна кількість (загальна - зарезервована)"""
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        """Чи є товар на мінімальному залишку"""
        return self.quantity <= self.min_stock

    @property
    def is_overstocked(self):
        """Чи перевищує товар максимальний залишок"""
        return self.max_stock and self.quantity > self.max_stock


class Supply(models.Model):
    """Постачання товарів"""
    SUPPLY_STATUS_CHOICES = [
        ('draft', _('Чернетка')),
        ('confirmed', _('Підтверджено')),
        ('in_transit', _('В дорозі')),
        ('received', _('Отримано')),
        ('cancelled', _('Скасовано')),
    ]

    number = models.CharField(_('Номер'), max_length=50, unique=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.CASCADE,
        related_name='supplies',
        verbose_name=_('Постачальник')
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='supplies',
        verbose_name=_('Склад')
    )
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=SUPPLY_STATUS_CHOICES,
        default='draft'
    )
    order_date = models.DateField(_('Дата замовлення'))
    expected_date = models.DateField(_('Очікувана дата'), null=True, blank=True)
    received_date = models.DateField(_('Дата отримання'), null=True, blank=True)
    total_amount = models.DecimalField(
        _('Загальна сума'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    notes = models.TextField(_('Примітки'), blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_supplies',
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Постачання')
        verbose_name_plural = _('Постачання')
        ordering = ['-created_at']

    def __str__(self):
        return f"Постачання #{self.number} від {self.supplier.name}"


class SupplyItem(models.Model):
    """Позиції постачання"""
    supply = models.ForeignKey(
        Supply,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Постачання')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    quantity = models.DecimalField(
        _('Кількість'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    received_quantity = models.DecimalField(
        _('Отримана кількість'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    unit_price = models.DecimalField(
        _('Ціна за одиницю'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_price = models.DecimalField(
        _('Загальна ціна'),
        max_digits=12,
        decimal_places=2,
        default=0
    )

    class Meta:
        verbose_name = _('Позиція постачання')
        verbose_name_plural = _('Позиції постачання')
        ordering = ['supply', 'product']

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.packaging.unit.short_name}"

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
        
        # Автоматично створюємо партію при отриманні товару
        if self.received_quantity > 0 and self.supply.status == 'received':
            self._create_stock_batch()
    
    def _create_stock_batch(self):
        """Створення партії товару при отриманні"""
        from .services import CostCalculationService
        
        # Перевіряємо, чи не створена вже партія
        existing_batch = StockBatch.objects.filter(
            supply=self.supply,
            product=self.product,
            packaging=self.packaging
        ).first()
        
        if not existing_batch and self.received_quantity > 0:
            batch_number = f"SUP-{self.supply.number}-{self.id}"
            
            StockBatch.objects.create(
                warehouse=self.supply.warehouse,
                product=self.product,
                packaging=self.packaging,
                batch_number=batch_number,
                initial_quantity=self.received_quantity,
                remaining_quantity=self.received_quantity,
                unit_cost=self.unit_price,
                received_date=self.supply.received_date or timezone.now(),
                supplier=self.supply.supplier,
                supply=self.supply
            )
            
            # Створюємо рух товару
            service = CostCalculationService()
            service._update_stock_quantity(
                self.supply.warehouse, 
                self.product, 
                self.packaging
            )


class Movement(models.Model):
    """Переміщення товарів між складами"""
    MOVEMENT_STATUS_CHOICES = [
        ('draft', _('Чернетка')),
        ('confirmed', _('Підтверджено')),
        ('in_transit', _('В дорозі')),
        ('completed', _('Завершено')),
        ('cancelled', _('Скасовано')),
    ]

    number = models.CharField(_('Номер'), max_length=50, unique=True)
    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='outgoing_movements',
        verbose_name=_('Склад відправлення')
    )
    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='incoming_movements',
        verbose_name=_('Склад призначення')
    )
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=MOVEMENT_STATUS_CHOICES,
        default='draft'
    )
    movement_date = models.DateField(_('Дата переміщення'))
    completed_date = models.DateField(_('Дата завершення'), null=True, blank=True)
    reason = models.TextField(_('Причина переміщення'), blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_movements',
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Переміщення')
        verbose_name_plural = _('Переміщення')
        ordering = ['-created_at']

    def __str__(self):
        return f"Переміщення #{self.number}: {self.from_warehouse} → {self.to_warehouse}"


class MovementItem(models.Model):
    """Позиції переміщення"""
    movement = models.ForeignKey(
        Movement,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Переміщення')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    quantity = models.DecimalField(
        _('Кількість'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    received_quantity = models.DecimalField(
        _('Отримана кількість'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )

    class Meta:
        verbose_name = _('Позиція переміщення')
        verbose_name_plural = _('Позиції переміщення')
        ordering = ['movement', 'product']

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.packaging.unit.short_name}"


class WriteOff(models.Model):
    """Списання товарів"""
    WRITEOFF_REASON_CHOICES = [
        ('expired', _('Прострочений')),
        ('damaged', _('Пошкоджений')),
        ('lost', _('Втрачений')),
        ('theft', _('Крадіжка')),
        ('defective', _('Брак')),
        ('other', _('Інше')),
    ]

    number = models.CharField(_('Номер'), max_length=50, unique=True)
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='writeoffs',
        verbose_name=_('Склад')
    )
    reason = models.CharField(
        _('Причина'),
        max_length=20,
        choices=WRITEOFF_REASON_CHOICES
    )
    writeoff_date = models.DateField(_('Дата списання'))
    description = models.TextField(_('Опис'), blank=True)
    total_amount = models.DecimalField(
        _('Загальна сума'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_writeoffs',
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Списання')
        verbose_name_plural = _('Списання')
        ordering = ['-created_at']

    def __str__(self):
        return f"Списання #{self.number} - {self.get_reason_display()}"


class WriteOffItem(models.Model):
    """Позиції списання"""
    writeoff = models.ForeignKey(
        WriteOff,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Списання')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    quantity = models.DecimalField(
        _('Кількість'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    unit_cost = models.DecimalField(
        _('Собівартість за одиницю'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0'))]
    )
    total_cost = models.DecimalField(
        _('Загальна собівартість'),
        max_digits=12,
        decimal_places=2,
        default=0
    )

    class Meta:
        verbose_name = _('Позиція списання')
        verbose_name_plural = _('Позиції списання')
        ordering = ['writeoff', 'product']

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.packaging.unit.short_name}"

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)


class Inventory(models.Model):
    """Інвентаризація складів"""
    INVENTORY_STATUS_CHOICES = [
        ('draft', _('Чернетка')),
        ('in_progress', _('В процесі')),
        ('completed', _('Завершено')),
        ('cancelled', _('Скасовано')),
    ]

    number = models.CharField(_('Номер'), max_length=50, unique=True)
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='inventories',
        verbose_name=_('Склад')
    )
    status = models.CharField(
        _('Статус'),
        max_length=20,
        choices=INVENTORY_STATUS_CHOICES,
        default='draft'
    )
    start_date = models.DateField(_('Дата початку'))
    end_date = models.DateField(_('Дата завершення'), null=True, blank=True)
    description = models.TextField(_('Опис'), blank=True)
    responsible_person = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='responsible_inventories',
        verbose_name=_('Відповідальна особа')
    )
    total_items_counted = models.PositiveIntegerField(_('Підраховано позицій'), default=0)
    total_discrepancy_amount = models.DecimalField(
        _('Загальна сума розбіжностей'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_inventories',
        verbose_name=_('Створено користувачем')
    )
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Інвентаризація')
        verbose_name_plural = _('Інвентаризації')
        ordering = ['-created_at']

    def __str__(self):
        return f"Інвентаризація #{self.number} - {self.warehouse.name}"

    @property
    def has_discrepancies(self):
        """Чи є розбіжності в інвентаризації"""
        return self.inventory_items.filter(
            models.Q(shortage_quantity__gt=0) | models.Q(surplus_quantity__gt=0)
        ).exists()

    @property
    def discrepancy_items_count(self):
        """Кількість позицій з розбіжностями"""
        return self.inventory_items.filter(
            models.Q(shortage_quantity__gt=0) | models.Q(surplus_quantity__gt=0)
        ).count()


class InventoryItem(models.Model):
    """Позиції інвентаризації"""
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='inventory_items',
        verbose_name=_('Інвентаризація')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    expected_quantity = models.DecimalField(
        _('Очікувана кількість'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    actual_quantity = models.DecimalField(
        _('Фактична кількість'),
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    shortage_quantity = models.DecimalField(
        _('Недостача'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    surplus_quantity = models.DecimalField(
        _('Излишок'),
        max_digits=10,
        decimal_places=3,
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    unit_cost = models.DecimalField(
        _('Собівартість за одиницю'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0'))]
    )
    discrepancy_amount = models.DecimalField(
        _('Сума розбіжності'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    notes = models.TextField(_('Примітки'), blank=True)
    counted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='counted_inventory_items',
        verbose_name=_('Підраховано користувачем')
    )
    counted_at = models.DateTimeField(_('Час підрахунку'), null=True, blank=True)

    class Meta:
        verbose_name = _('Позиція інвентаризації')
        verbose_name_plural = _('Позиції інвентаризації')
        ordering = ['inventory', 'product']
        unique_together = ['inventory', 'product', 'packaging']

    def __str__(self):
        return f"{self.product.name} - {self.expected_quantity}/{self.actual_quantity or '?'} {self.packaging.unit.short_name}"

    def save(self, *args, **kwargs):
        if self.actual_quantity is not None:
            difference = self.actual_quantity - self.expected_quantity
            if difference > 0:
                self.surplus_quantity = difference
                self.shortage_quantity = 0
            elif difference < 0:
                self.shortage_quantity = abs(difference)
                self.surplus_quantity = 0
            else:
                self.surplus_quantity = 0
                self.shortage_quantity = 0

            # Розрахунок суми розбіжності
            if self.unit_cost:
                discrepancy_qty = self.surplus_quantity - self.shortage_quantity
                self.discrepancy_amount = discrepancy_qty * self.unit_cost
            
            # Встановлення часу підрахунку, якщо його не було
            if not self.counted_at:
                from django.utils import timezone
                self.counted_at = timezone.now()

        super().save(*args, **kwargs)

    @property
    def has_discrepancy(self):
        """Чи є розбіжність в цій позиції"""
        return self.shortage_quantity > 0 or self.surplus_quantity > 0

    @property
    def discrepancy_type(self):
        """Тип розбіжності"""
        if self.shortage_quantity > 0:
            return 'shortage'
        elif self.surplus_quantity > 0:
            return 'surplus'
        return 'none'


class CostingMethod(models.Model):
    """Методи розрахунку собівартості"""
    COSTING_METHOD_CHOICES = [
        ('fifo', _('FIFO - Перший прийшов, перший пішов')),
        ('lifo', _('LIFO - Останній прийшов, перший пішов')),
        ('average', _('Середньозважена собівартість')),
        ('specific', _('Конкретна ідентифікація')),
    ]

    name = models.CharField(_('Назва'), max_length=50, unique=True)
    method = models.CharField(
        _('Метод'),
        max_length=20,
        choices=COSTING_METHOD_CHOICES,
        unique=True
    )
    description = models.TextField(_('Опис'), blank=True)
    is_default = models.BooleanField(_('За замовчуванням'), default=False)
    is_active = models.BooleanField(_('Активний'), default=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Метод розрахунку собівартості')
        verbose_name_plural = _('Методи розрахунку собівартості')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_method_display()})"

    def save(self, *args, **kwargs):
        if self.is_default:
            # Зняти відмітку "за замовчуванням" з інших методів
            CostingMethod.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


class CostingRule(models.Model):
    """Правила розрахунку собівартості для конкретних товарів/складів"""
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='costing_rules',
        verbose_name=_('Склад')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='costing_rules',
        verbose_name=_('Товар'),
        null=True,
        blank=True
    )
    category = models.ForeignKey(
        'products.Category',
        on_delete=models.CASCADE,
        related_name='costing_rules',
        verbose_name=_('Категорія'),
        null=True,
        blank=True
    )
    costing_method = models.ForeignKey(
        CostingMethod,
        on_delete=models.CASCADE,
        related_name='rules',
        verbose_name=_('Метод розрахунку')
    )
    priority = models.PositiveIntegerField(_('Пріоритет'), default=1)
    is_active = models.BooleanField(_('Активний'), default=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Правило розрахунку собівартості')
        verbose_name_plural = _('Правила розрахунку собівартості')
        ordering = ['warehouse', '-priority']
        unique_together = [
            ['warehouse', 'product', 'costing_method'],
            ['warehouse', 'category', 'costing_method'],
        ]

    def __str__(self):
        target = self.product.name if self.product else self.category.name if self.category else "Загальне правило"
        return f"{self.warehouse.name} - {target} ({self.costing_method.name})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.product and self.category:
            raise ValidationError(_('Не можна вказувати одночасно товар і категорію'))
        if not self.product and not self.category:
            raise ValidationError(_('Треба вказати або товар, або категорію'))


class StockBatch(models.Model):
    """Партії товарів для FIFO/LIFO розрахунків"""
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stock_batches',
        verbose_name=_('Склад')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='stock_batches',
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    batch_number = models.CharField(_('Номер партії'), max_length=100)
    initial_quantity = models.DecimalField(
        _('Початкова кількість'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    remaining_quantity = models.DecimalField(
        _('Залишок партії'),
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0'))]
    )
    unit_cost = models.DecimalField(
        _('Собівартість за одиницю'),
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_cost = models.DecimalField(
        _('Загальна собівартість партії'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    received_date = models.DateTimeField(_('Дата надходження'))
    expiry_date = models.DateField(_('Термін придатності'), null=True, blank=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_batches',
        verbose_name=_('Постачальник')
    )
    supply = models.ForeignKey(
        Supply,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_batches',
        verbose_name=_('Постачання')
    )
    is_active = models.BooleanField(_('Активна'), default=True)
    notes = models.TextField(_('Примітки'), blank=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Оновлено'), auto_now=True)

    class Meta:
        verbose_name = _('Партія товару')
        verbose_name_plural = _('Партії товарів')
        ordering = ['warehouse', 'product', 'received_date']
        unique_together = ['warehouse', 'product', 'packaging', 'batch_number']

    def __str__(self):
        return f"{self.batch_number} - {self.product.name} ({self.remaining_quantity}/{self.initial_quantity})"

    def save(self, *args, **kwargs):
        self.total_cost = self.remaining_quantity * self.unit_cost
        super().save(*args, **kwargs)

    @property
    def is_depleted(self):
        """Чи вичерпана партія"""
        return self.remaining_quantity <= 0

    @property
    def is_expired(self):
        """Чи прострочена партія"""
        if not self.expiry_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.expiry_date

    @property
    def depletion_percentage(self):
        """Відсоток використання партії"""
        if self.initial_quantity <= 0:
            return 0
        return ((self.initial_quantity - self.remaining_quantity) / self.initial_quantity) * 100


class StockMovement(models.Model):
    """Історія руху товарів для відстеження собівартості"""
    MOVEMENT_TYPE_CHOICES = [
        ('in', _('Надходження')),
        ('out', _('Витрата')),
        ('transfer_in', _('Переміщення (надходження)')),
        ('transfer_out', _('Переміщення (витрата)')),
        ('adjustment_in', _('Коригування (збільшення)')),
        ('adjustment_out', _('Коригування (зменшення)')),
        ('writeoff', _('Списання')),
        ('inventory', _('Інвентаризація')),
    ]

    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='stock_movements',
        verbose_name=_('Склад')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='stock_movements',
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    batch = models.ForeignKey(
        StockBatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='movements',
        verbose_name=_('Партія')
    )
    movement_type = models.CharField(
        _('Тип руху'),
        max_length=20,
        choices=MOVEMENT_TYPE_CHOICES
    )
    quantity = models.DecimalField(
        _('Кількість'),
        max_digits=10,
        decimal_places=3
    )
    unit_cost = models.DecimalField(
        _('Собівартість за одиницю'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    total_cost = models.DecimalField(
        _('Загальна собівартість'),
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )
    reference_document = models.CharField(_('Документ-підстава'), max_length=100, blank=True)
    reference_id = models.PositiveIntegerField(_('ID документа'), null=True, blank=True)
    movement_date = models.DateTimeField(_('Дата руху'))
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_stock_movements',
        verbose_name=_('Створено користувачем')
    )
    notes = models.TextField(_('Примітки'), blank=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)

    class Meta:
        verbose_name = _('Рух товару')
        verbose_name_plural = _('Рух товарів')
        ordering = ['-movement_date', '-created_at']

    def __str__(self):
        direction = "+" if self.movement_type.endswith('_in') or self.movement_type == 'in' else "-"
        return f"{direction}{self.quantity} {self.product.name} ({self.get_movement_type_display()})"

    def save(self, *args, **kwargs):
        if self.unit_cost and self.quantity:
            self.total_cost = abs(self.quantity) * self.unit_cost
        super().save(*args, **kwargs)


class CostCalculation(models.Model):
    """Розрахунки собівартості"""
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.CASCADE,
        related_name='cost_calculations',
        verbose_name=_('Склад')
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='cost_calculations',
        verbose_name=_('Товар')
    )
    packaging = models.ForeignKey(
        Packaging,
        on_delete=models.CASCADE,
        verbose_name=_('Фасування')
    )
    costing_method = models.ForeignKey(
        CostingMethod,
        on_delete=models.CASCADE,
        verbose_name=_('Метод розрахунку')
    )
    calculation_date = models.DateTimeField(_('Дата розрахунку'))
    total_quantity = models.DecimalField(
        _('Загальна кількість'),
        max_digits=10,
        decimal_places=3,
        default=0
    )
    average_cost = models.DecimalField(
        _('Середня собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    fifo_cost = models.DecimalField(
        _('FIFO собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    lifo_cost = models.DecimalField(
        _('LIFO собівартість'),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    total_value = models.DecimalField(
        _('Загальна вартість'),
        max_digits=12,
        decimal_places=2,
        default=0
    )
    batches_count = models.PositiveIntegerField(_('Кількість партій'), default=0)
    is_current = models.BooleanField(_('Поточний розрахунок'), default=True)
    created_at = models.DateTimeField(_('Створено'), auto_now_add=True)

    class Meta:
        verbose_name = _('Розрахунок собівартості')
        verbose_name_plural = _('Розрахунки собівартості')
        ordering = ['-calculation_date']

    def __str__(self):
        return f"{self.product.name} - {self.costing_method.name} ({self.calculation_date.strftime('%d.%m.%Y')})"