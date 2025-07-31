from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display
from .models import (
    Unit, Supplier, Warehouse, Packaging, Stock, Supply, SupplyItem,
    Movement, MovementItem, WriteOff, WriteOffItem, Inventory, InventoryItem,
    CostingMethod, CostingRule, StockBatch, StockMovement, CostCalculation
)


@admin.register(Unit)
class UnitAdmin(ModelAdmin):
    """Адміністрування одиниць вимірювання"""
    
    list_display = ('name_display', 'short_name_display', 'is_base_display', 'created_at_display')
    list_filter = ('is_base', 'created_at')
    search_fields = ('name', 'short_name')
    ordering = ['name']
    
    @display(description=_('Назва'), ordering='name')
    def name_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-500">straighten</span>'
            '<span class="font-medium">{}</span>'
            '</div>',
            obj.name
        )
    
    @display(description=_('Скорочення'), ordering='short_name')
    def short_name_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{}</span>',
            obj.short_name
        )
    
    @display(description=_('Базова'), ordering='is_base')
    def is_base_display(self, obj):
        if obj.is_base:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Базова</span>'
                '</span>'
            )
        return '-'
    
    @display(description=_('Створено'), ordering='created_at')
    def created_at_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.created_at.strftime('%d.%m.%Y'),
            obj.created_at.strftime('%H:%M')
        )


@admin.register(Supplier)
class SupplierAdmin(ModelAdmin):
    """Адміністрування постачальників"""
    
    list_display = ('name_display', 'code_display', 'contact_info_display', 'is_active_display', 'payment_terms_display')
    list_filter = ('is_active', 'payment_terms', 'created_at')
    search_fields = ('name', 'code', 'contact_person', 'email', 'phone')
    ordering = ['name']
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('name', 'code', 'is_active')
        }),
        (_('Контактна інформація'), {
            'fields': ('contact_person', 'phone', 'email', 'address')
        }),
        (_('Податкова інформація'), {
            'fields': ('tax_number', 'payment_terms')
        }),
        (_('Додатково'), {
            'fields': ('notes',)
        }),
    )
    
    @display(description=_('Постачальник'), ordering='name')
    def name_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-purple-500">business</span>'
            '<div>'
            '<div class="font-medium">{}</div>'
            '<div class="text-sm text-gray-500">{}</div>'
            '</div>'
            '</div>',
            obj.name,
            obj.contact_person or 'Контактна особа не вказана'
        )
    
    @display(description=_('Код'), ordering='code')
    def code_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-mono">{}</span>',
            obj.code
        )
    
    @display(description=_('Контакти'))
    def contact_info_display(self, obj):
        contacts = []
        if obj.phone:
            contacts.append(f'<span class="material-symbols-outlined text-xs">phone</span> {obj.phone}')
        if obj.email:
            contacts.append(f'<span class="material-symbols-outlined text-xs">email</span> {obj.email}')
        
        if contacts:
            return format_html(
                '<div class="text-sm space-y-1">{}</div>',
                '<br>'.join(contacts)
            )
        return '-'
    
    @display(description=_('Статус'), ordering='is_active')
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Активний</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">cancel</span>'
                '<span>Неактивний</span>'
                '</span>'
            )
    
    @display(description=_('Умови оплати'), ordering='payment_terms')
    def payment_terms_display(self, obj):
        return format_html(
            '<span class="text-sm">{} днів</span>',
            obj.payment_terms
        )


@admin.register(Warehouse)
class WarehouseAdmin(ModelAdmin):
    """Адміністрування складів"""
    
    list_display = ('name_display', 'code_display', 'manager_display', 'is_active_display', 'created_at_display')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code', 'address', 'manager__email', 'manager__first_name', 'manager__last_name')
    ordering = ['name']
    
    @display(description=_('Склад'), ordering='name')
    def name_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-orange-500">warehouse</span>'
            '<div>'
            '<div class="font-medium">{}</div>'
            '<div class="text-sm text-gray-500">{}</div>'
            '</div>'
            '</div>',
            obj.name,
            obj.address[:50] + '...' if len(obj.address or '') > 50 else obj.address or 'Адреса не вказана'
        )
    
    @display(description=_('Код'), ordering='code')
    def code_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm font-mono">{}</span>',
            obj.code
        )
    
    @display(description=_('Завідувач'), ordering='manager__email')
    def manager_display(self, obj):
        if obj.manager:
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-gray-400">person</span>'
                '<span>{}</span>'
                '</div>',
                obj.manager.get_full_name() or obj.manager.email
            )
        return '-'
    
    @display(description=_('Статус'), ordering='is_active')
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Активний</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">cancel</span>'
                '<span>Неактивний</span>'
                '</span>'
            )
    
    @display(description=_('Створено'), ordering='created_at')
    def created_at_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.created_at.strftime('%d.%m.%Y'),
            obj.created_at.strftime('%H:%M')
        )


@admin.register(Packaging)
class PackagingAdmin(ModelAdmin):
    """Адміністрування фасування"""
    
    list_display = ('product_display', 'quantity_display', 'unit_display', 'is_default_display', 'barcode_display')
    list_filter = ('is_default', 'unit', 'created_at')
    search_fields = ('product__name', 'barcode')
    ordering = ['product', '-is_default', 'quantity']
    
    @display(description=_('Товар'), ordering='product__name')
    def product_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">inventory</span>'
            '<span>{}</span>'
            '</div>',
            obj.product.name
        )
    
    @display(description=_('Кількість'), ordering='quantity')
    def quantity_display(self, obj):
        return format_html(
            '<span class="font-medium text-blue-600">{}</span>',
            obj.quantity
        )
    
    @display(description=_('Одиниця'), ordering='unit__name')
    def unit_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-gray-100 rounded text-sm">{}</span>',
            obj.unit.short_name
        )
    
    @display(description=_('За замовчуванням'), ordering='is_default')
    def is_default_display(self, obj):
        if obj.is_default:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">star</span>'
                '<span>Так</span>'
                '</span>'
            )
        return '-'
    
    @display(description=_('Штрих-код'))
    def barcode_display(self, obj):
        if obj.barcode:
            return format_html(
                '<span class="px-2 py-1 bg-gray-50 border rounded text-sm font-mono">{}</span>',
                obj.barcode
            )
        return '-'


@admin.register(Stock)
class StockAdmin(ModelAdmin):
    """Адміністрування залишків"""
    
    list_display = (
        'warehouse_display', 'product_display', 'quantity_display', 
        'reserved_display', 'available_display', 'status_display'
    )
    list_filter = ('warehouse', 'updated_at')
    search_fields = ('product__name', 'warehouse__name')
    ordering = ['warehouse', 'product']
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-orange-500">warehouse</span>'
            '<span>{}</span>'
            '</div>',
            obj.warehouse.name
        )
    
    @display(description=_('Товар'), ordering='product__name')
    def product_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">inventory</span>'
            '<div>'
            '<div class="font-medium">{}</div>'
            '<div class="text-sm text-gray-500">{}</div>'
            '</div>'
            '</div>',
            obj.product.name,
            str(obj.packaging)
        )
    
    @display(description=_('Кількість'), ordering='quantity')
    def quantity_display(self, obj):
        return format_html(
            '<span class="font-medium text-lg">{}</span>',
            obj.quantity
        )
    
    @display(description=_('Зарезервовано'), ordering='reserved_quantity')
    def reserved_display(self, obj):
        if obj.reserved_quantity > 0:
            return format_html(
                '<span class="text-orange-600 font-medium">{}</span>',
                obj.reserved_quantity
            )
        return '-'
    
    @display(description=_('Доступно'))
    def available_display(self, obj):
        return format_html(
            '<span class="font-medium text-green-600">{}</span>',
            obj.available_quantity
        )
    
    @display(description=_('Статус'))
    def status_display(self, obj):
        if obj.is_low_stock:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">warning</span>'
                '<span>Мало</span>'
                '</span>'
            )
        elif obj.is_overstocked:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">inventory_2</span>'
                '<span>Багато</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Норма</span>'
                '</span>'
            )


class SupplyItemInline(TabularInline):
    model = SupplyItem
    extra = 0
    fields = ('product', 'packaging', 'quantity', 'received_quantity', 'unit_price', 'total_price')
    readonly_fields = ('total_price',)


@admin.register(Supply)
class SupplyAdmin(ModelAdmin):
    """Адміністрування постачання"""
    
    list_display = (
        'number_display', 'supplier_display', 'warehouse_display', 
        'status_display', 'order_date_display', 'total_amount_display'
    )
    list_filter = ('status', 'warehouse', 'order_date', 'created_at')
    search_fields = ('number', 'supplier__name', 'warehouse__name')
    ordering = ['-created_at']
    inlines = [SupplyItemInline]
    
    @display(description=_('Номер'), ordering='number')
    def number_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-500">local_shipping</span>'
            '<span class="font-mono font-medium">#{}</span>'
            '</div>',
            obj.number
        )
    
    @display(description=_('Постачальник'), ordering='supplier__name')
    def supplier_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-purple-500">business</span>'
            '<span>{}</span>'
            '</div>',
            obj.supplier.name
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-orange-500">warehouse</span>'
            '<span>{}</span>'
            '</div>',
            obj.warehouse.name
        )
    
    @display(description=_('Статус'), ordering='status')
    def status_display(self, obj):
        status_colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'in_transit': 'bg-yellow-100 text-yellow-800',
            'received': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
        }
        
        status_icons = {
            'draft': 'draft',
            'confirmed': 'check_circle',
            'in_transit': 'local_shipping',
            'received': 'inventory',
            'cancelled': 'cancel',
        }
        
        color_class = status_colors.get(obj.status, 'bg-gray-100 text-gray-800')
        icon = status_icons.get(obj.status, 'help')
        
        return format_html(
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {}">'
            '<span class="material-symbols-outlined text-xs">{}</span>'
            '<span>{}</span>'
            '</span>',
            color_class,
            icon,
            obj.get_status_display()
        )
    
    @display(description=_('Дата замовлення'), ordering='order_date')
    def order_date_display(self, obj):
        return format_html(
            '<span class="text-sm">{}</span>',
            obj.order_date.strftime('%d.%m.%Y')
        )
    
    @display(description=_('Сума'), ordering='total_amount')
    def total_amount_display(self, obj):
        return format_html(
            '<span class="font-medium text-green-600">{:.2f} ₴</span>',
            obj.total_amount
        )


# Аналогічно створюємо admin для інших моделей (Movement, WriteOff, Inventory)
# Для економії місця покажу тільки основні

class MovementItemInline(TabularInline):
    model = MovementItem
    extra = 0


@admin.register(Movement)
class MovementAdmin(ModelAdmin):
    list_display = ('number_display', 'from_warehouse_display', 'to_warehouse_display', 'status_display', 'movement_date')
    list_filter = ('status', 'from_warehouse', 'to_warehouse', 'movement_date')
    search_fields = ('number', 'from_warehouse__name', 'to_warehouse__name')
    ordering = ['-created_at']
    inlines = [MovementItemInline]
    
    @display(description=_('Номер'), ordering='number')
    def number_display(self, obj):
        return format_html(
            '<span class="font-mono font-medium">#{}</span>',
            obj.number
        )
    
    @display(description=_('Звідки'), ordering='from_warehouse__name')
    def from_warehouse_display(self, obj):
        return format_html(
            '<span class="text-red-600">{}</span>',
            obj.from_warehouse.name
        )
    
    @display(description=_('Куди'), ordering='to_warehouse__name')
    def to_warehouse_display(self, obj):
        return format_html(
            '<span class="text-green-600">{}</span>',
            obj.to_warehouse.name
        )
    
    @display(description=_('Статус'), ordering='status')
    def status_display(self, obj):
        status_colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'in_transit': 'bg-yellow-100 text-yellow-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
        }
        
        color_class = status_colors.get(obj.status, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class,
            obj.get_status_display()
        )


class WriteOffItemInline(TabularInline):
    model = WriteOffItem
    extra = 0


@admin.register(WriteOff)
class WriteOffAdmin(ModelAdmin):
    list_display = ('number_display', 'warehouse_display', 'reason_display', 'writeoff_date', 'total_amount_display')
    list_filter = ('reason', 'warehouse', 'writeoff_date')
    search_fields = ('number', 'warehouse__name', 'description')
    ordering = ['-created_at']
    inlines = [WriteOffItemInline]
    
    @display(description=_('Номер'), ordering='number')
    def number_display(self, obj):
        return format_html(
            '<span class="font-mono font-medium">#{}</span>',
            obj.number
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<span>{}</span>',
            obj.warehouse.name
        )
    
    @display(description=_('Причина'), ordering='reason')
    def reason_display(self, obj):
        reason_colors = {
            'expired': 'bg-yellow-100 text-yellow-800',
            'damaged': 'bg-red-100 text-red-800',
            'lost': 'bg-gray-100 text-gray-800',
            'theft': 'bg-red-100 text-red-800',
            'defective': 'bg-orange-100 text-orange-800',
            'other': 'bg-blue-100 text-blue-800',
        }
        
        color_class = reason_colors.get(obj.reason, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class,
            obj.get_reason_display()
        )
    
    @display(description=_('Сума'), ordering='total_amount')
    def total_amount_display(self, obj):
        return format_html(
            '<span class="font-medium text-red-600">{:.2f} ₴</span>',
            obj.total_amount
        )


class InventoryItemInline(TabularInline):
    model = InventoryItem
    extra = 0
    fields = ('product', 'packaging', 'expected_quantity', 'actual_quantity', 'shortage_quantity', 'surplus_quantity')
    readonly_fields = ('shortage_quantity', 'surplus_quantity')


@admin.register(Inventory)
class InventoryAdmin(ModelAdmin):
    list_display = ('number_display', 'warehouse_display', 'status_display', 'start_date', 'discrepancies_display')
    list_filter = ('status', 'warehouse', 'start_date')
    search_fields = ('number', 'warehouse__name', 'responsible_person__email')
    ordering = ['-created_at']
    inlines = [InventoryItemInline]
    
    @display(description=_('Номер'), ordering='number')
    def number_display(self, obj):
        return format_html(
            '<span class="font-mono font-medium">#{}</span>',
            obj.number
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<span>{}</span>',
            obj.warehouse.name
        )
    
    @display(description=_('Статус'), ordering='status')
    def status_display(self, obj):
        status_colors = {
            'draft': 'bg-gray-100 text-gray-800',
            'in_progress': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800',
        }
        
        color_class = status_colors.get(obj.status, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class,
            obj.get_status_display()
        )
    
    @display(description=_('Розбіжності'))
    def discrepancies_display(self, obj):
        if obj.has_discrepancies:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">warning</span>'
                '<span>{} поз.</span>'
                '</span>',
                obj.discrepancy_items_count
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Без розбіжностей</span>'
                '</span>'
            )


@admin.register(CostingMethod)
class CostingMethodAdmin(ModelAdmin):
    """Адміністрування методів розрахунку собівартості"""
    
    list_display = ('name_display', 'method_display', 'is_default_display', 'is_active_display', 'created_at_display')
    list_filter = ('method', 'is_default', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ['name']
    
    @display(description=_('Назва'), ordering='name')
    def name_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-indigo-500">calculate</span>'
            '<span class="font-medium">{}</span>'
            '</div>',
            obj.name
        )
    
    @display(description=_('Метод'), ordering='method')
    def method_display(self, obj):
        method_colors = {
            'fifo': 'bg-blue-100 text-blue-800',
            'lifo': 'bg-purple-100 text-purple-800',
            'average': 'bg-green-100 text-green-800',
            'specific': 'bg-orange-100 text-orange-800',
        }
        
        color_class = method_colors.get(obj.method, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-3 py-1 rounded-full text-sm font-medium {}">{}</span>',
            color_class,
            obj.get_method_display()
        )
    
    @display(description=_('За замовчуванням'), ordering='is_default')
    def is_default_display(self, obj):
        if obj.is_default:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">star</span>'
                '<span>Так</span>'
                '</span>'
            )
        return '-'
    
    @display(description=_('Активний'), ordering='is_active')
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Так</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">cancel</span>'
                '<span>Ні</span>'
                '</span>'
            )
    
    @display(description=_('Створено'), ordering='created_at')
    def created_at_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.created_at.strftime('%d.%m.%Y'),
            obj.created_at.strftime('%H:%M')
        )


@admin.register(CostingRule)
class CostingRuleAdmin(ModelAdmin):
    """Адміністрування правил розрахунку собівартості"""
    
    list_display = ('warehouse_display', 'target_display', 'costing_method_display', 'priority_display', 'is_active_display')
    list_filter = ('warehouse', 'costing_method', 'is_active', 'priority')
    search_fields = ('warehouse__name', 'product__name', 'category__name')
    ordering = ['warehouse', '-priority']
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-orange-500">warehouse</span>'
            '<span>{}</span>'
            '</div>',
            obj.warehouse.name
        )
    
    @display(description=_('Ціль'))
    def target_display(self, obj):
        if obj.product:
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-green-500">inventory</span>'
                '<span>{}</span>'
                '</div>',
                obj.product.name
            )
        elif obj.category:
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-blue-500">category</span>'
                '<span>{}</span>'
                '</div>',
                obj.category.name
            )
        return '-'
    
    @display(description=_('Метод'), ordering='costing_method__name')
    def costing_method_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">{}</span>',
            obj.costing_method.name
        )
    
    @display(description=_('Пріоритет'), ordering='priority')
    def priority_display(self, obj):
        return format_html(
            '<span class="inline-flex items-center justify-center w-8 h-8 bg-gray-200 text-gray-800 rounded-full text-sm font-medium">{}</span>',
            obj.priority
        )
    
    @display(description=_('Активний'), ordering='is_active')
    def is_active_display(self, obj):
        if obj.is_active:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Так</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">cancel</span>'
                '<span>Ні</span>'
                '</span>'
            )


@admin.register(StockBatch)
class StockBatchAdmin(ModelAdmin):
    """Адміністрування партій товарів"""
    
    list_display = (
        'batch_number_display', 'product_display', 'warehouse_display', 
        'quantity_display', 'unit_cost_display', 'status_display', 'received_date_display'
    )
    list_filter = ('warehouse', 'is_active', 'received_date', 'expiry_date')
    search_fields = ('batch_number', 'product__name', 'warehouse__name', 'supplier__name')
    ordering = ['-received_date']
    
    @display(description=_('Партія'), ordering='batch_number')
    def batch_number_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-teal-500">inventory_2</span>'
            '<span class="font-mono font-medium">{}</span>'
            '</div>',
            obj.batch_number
        )
    
    @display(description=_('Товар'), ordering='product__name')
    def product_display(self, obj):
        return format_html(
            '<div>'
            '<div class="font-medium">{}</div>'
            '<div class="text-sm text-gray-500">{}</div>'
            '</div>',
            obj.product.name,
            str(obj.packaging)
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<span class="text-sm">{}</span>',
            obj.warehouse.name
        )
    
    @display(description=_('Кількість'))
    def quantity_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div><span class="font-medium text-green-600">{}</span> / <span class="text-gray-500">{}</span></div>'
            '<div class="text-xs text-gray-400">залишок / початок</div>'
            '</div>',
            obj.remaining_quantity,
            obj.initial_quantity
        )
    
    @display(description=_('Собівартість'), ordering='unit_cost')
    def unit_cost_display(self, obj):
        return format_html(
            '<span class="font-medium text-blue-600">{:.2f} ₴</span>',
            obj.unit_cost
        )
    
    @display(description=_('Статус'))
    def status_display(self, obj):
        if obj.is_depleted:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">remove_circle</span>'
                '<span>Вичерпано</span>'
                '</span>'
            )
        elif obj.is_expired:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">schedule</span>'
                '<span>Прострочено</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Активна</span>'
                '</span>'
            )
    
    @display(description=_('Отримано'), ordering='received_date')
    def received_date_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.received_date.strftime('%d.%m.%Y'),
            obj.received_date.strftime('%H:%M')
        )


@admin.register(StockMovement)
class StockMovementAdmin(ModelAdmin):
    """Адміністрування руху товарів"""
    
    list_display = (
        'movement_date_display', 'product_display', 'warehouse_display', 
        'movement_type_display', 'quantity_display', 'unit_cost_display'
    )
    list_filter = ('movement_type', 'warehouse', 'movement_date')
    search_fields = ('product__name', 'warehouse__name', 'reference_document')
    ordering = ['-movement_date']
    
    @display(description=_('Дата'), ordering='movement_date')
    def movement_date_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.movement_date.strftime('%d.%m.%Y'),
            obj.movement_date.strftime('%H:%M')
        )
    
    @display(description=_('Товар'), ordering='product__name')
    def product_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">inventory</span>'
            '<span>{}</span>'
            '</div>',
            obj.product.name
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<span class="text-sm">{}</span>',
            obj.warehouse.name
        )
    
    @display(description=_('Тип руху'), ordering='movement_type')
    def movement_type_display(self, obj):
        type_colors = {
            'in': 'bg-green-100 text-green-800',
            'out': 'bg-red-100 text-red-800',
            'transfer_in': 'bg-blue-100 text-blue-800',
            'transfer_out': 'bg-orange-100 text-orange-800',
            'adjustment_in': 'bg-teal-100 text-teal-800',
            'adjustment_out': 'bg-pink-100 text-pink-800',
            'writeoff': 'bg-gray-100 text-gray-800',
            'inventory': 'bg-purple-100 text-purple-800',
        }
        
        color_class = type_colors.get(obj.movement_type, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class,
            obj.get_movement_type_display()
        )
    
    @display(description=_('Кількість'), ordering='quantity')
    def quantity_display(self, obj):
        color = 'text-green-600' if obj.quantity > 0 else 'text-red-600'
        sign = '+' if obj.quantity > 0 else ''
        
        return format_html(
            '<span class="font-medium {}">{}{}</span>',
            color,
            sign,
            obj.quantity
        )
    
    @display(description=_('Собівартість'), ordering='unit_cost')
    def unit_cost_display(self, obj):
        if obj.unit_cost:
            return format_html(
                '<span class="text-sm">{:.2f} ₴</span>',
                obj.unit_cost
            )
        return '-'


@admin.register(CostCalculation)
class CostCalculationAdmin(ModelAdmin):
    """Адміністрування розрахунків собівартості"""
    
    list_display = (
        'calculation_date_display', 'product_display', 'warehouse_display', 
        'costing_method_display', 'costs_display', 'is_current_display'
    )
    list_filter = ('costing_method', 'warehouse', 'is_current', 'calculation_date')
    search_fields = ('product__name', 'warehouse__name')
    ordering = ['-calculation_date']
    
    @display(description=_('Дата'), ordering='calculation_date')
    def calculation_date_display(self, obj):
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.calculation_date.strftime('%d.%m.%Y'),
            obj.calculation_date.strftime('%H:%M')
        )
    
    @display(description=_('Товар'), ordering='product__name')
    def product_display(self, obj):
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">inventory</span>'
            '<div>'
            '<div class="font-medium">{}</div>'
            '<div class="text-sm text-gray-500">{} шт.</div>'
            '</div>'
            '</div>',
            obj.product.name,
            obj.total_quantity
        )
    
    @display(description=_('Склад'), ordering='warehouse__name')
    def warehouse_display(self, obj):
        return format_html(
            '<span class="text-sm">{}</span>',
            obj.warehouse.name
        )
    
    @display(description=_('Метод'), ordering='costing_method__name')
    def costing_method_display(self, obj):
        return format_html(
            '<span class="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-sm">{}</span>',
            obj.costing_method.name
        )
    
    @display(description=_('Собівартості'))
    def costs_display(self, obj):
        costs = []
        if obj.average_cost:
            costs.append(f'Сер.: {obj.average_cost:.2f} ₴')
        if obj.fifo_cost:
            costs.append(f'FIFO: {obj.fifo_cost:.2f} ₴')
        if obj.lifo_cost:
            costs.append(f'LIFO: {obj.lifo_cost:.2f} ₴')
        
        return format_html(
            '<div class="text-sm space-y-1">{}</div>',
            '<br>'.join(costs) if costs else '-'
        )
    
    @display(description=_('Поточний'), ordering='is_current')
    def is_current_display(self, obj):
        if obj.is_current:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Так</span>'
                '</span>'
            )
        return '-'