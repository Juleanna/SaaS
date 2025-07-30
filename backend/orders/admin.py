from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    fields = ('product', 'variant', 'quantity', 'unit_price', 'total_price')
    readonly_fields = ('total_price',)


class OrderStatusHistoryInline(TabularInline):
    model = OrderStatusHistory
    extra = 0
    fields = ('status', 'notes', 'created_at')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ('order_number', 'store', 'customer_name', 'get_total_display', 'get_status_display', 'get_payment_status', 'created_at')
    list_filter = (
        'status',
        'payment_status',
        'source',
        'store',
        ('created_at', RangeDateFilter)
    )
    search_fields = ('order_number', 'customer_name', 'customer_email', 'store__name', 'store__owner__email')
    readonly_fields = ('order_number', 'created_at', 'updated_at')
    list_per_page = 25
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('store', 'order_number', 'status', 'source'),
            'classes': ('tab',),
            'description': 'Базова інформація про замовлення'
        }),
        ('Дані клієнта', {
            'fields': ('customer_name', 'customer_email', 'customer_phone'),
            'classes': ('tab',),
            'description': 'Контактна інформація клієнта'
        }),
        ('Адреса доставки', {
            'fields': ('shipping_address', 'shipping_city', 'shipping_postal_code'),
            'classes': ('tab',),
            'description': 'Адреса для доставки замовлення'
        }),
        ('Фінансова інформація', {
            'fields': ('subtotal', 'shipping_cost', 'tax_amount', 'total_amount', 'currency'),
            'classes': ('tab',),
            'description': 'Розрахунок вартості замовлення'
        }),
        ('Платіжна інформація', {
            'fields': ('payment_status', 'payment_method', 'payment_transaction_id'),
            'classes': ('tab',),
            'description': 'Статус та дані про оплату'
        }),
        ('Додаткова інформація', {
            'fields': ('notes', 'tracking_number'),
            'classes': ('tab',),
            'description': 'Примітки та номер відстеження'
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Дати створення та оновлення'
        }),
    )
    
    @display(description="Сума", ordering="total_amount")
    def get_total_display(self, obj):
        return format_html(
            '<span style="font-weight: 600; color: #059669;">{} {}</span>',
            obj.total_amount, obj.currency
        )
    
    @display(description="Статус", ordering="status")
    def get_status_display(self, obj):
        colors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'processing': '#8b5cf6',
            'shipped': '#06b6d4',
            'delivered': '#10b981',
            'cancelled': '#ef4444',
            'refunded': '#6b7280'
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="color: {}; font-weight: 500;">{}</span>',
            color, obj.get_status_display()
        )
    
    @display(description="Статус оплати", ordering="payment_status")
    def get_payment_status(self, obj):
        colors = {
            'pending': '#f59e0b',
            'paid': '#10b981',
            'failed': '#ef4444',
            'refunded': '#6b7280'
        }
        color = colors.get(obj.payment_status, '#6b7280')
        return format_html(
            '<span style="color: {}; font-weight: 500;">{}</span>',
            color, obj.get_payment_status_display()
        )


@admin.register(OrderItem)
class OrderItemAdmin(ModelAdmin):
    list_display = ('order', 'product', 'variant', 'quantity', 'get_unit_price', 'get_total_price')
    list_filter = (
        'order__store',
        'order__status'
    )
    search_fields = ('order__order_number', 'product__name', 'product_name')
    list_per_page = 25
    
    @display(description="Ціна за одиницю", ordering="unit_price")
    def get_unit_price(self, obj):
        return f"{obj.unit_price} {obj.order.currency}"
    
    @display(description="Загальна вартість", ordering="total_price")
    def get_total_price(self, obj):
        return format_html(
            '<span style="font-weight: 600;">{} {}</span>',
            obj.total_price, obj.order.currency
        )


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(ModelAdmin):
    list_display = ('order', 'get_status_display', 'created_at', 'get_notes_preview')
    list_filter = (
        'status',
        ('created_at', RangeDateFilter)
    )
    search_fields = ('order__order_number', 'notes')
    readonly_fields = ('created_at',)
    list_per_page = 25
    ordering = ('-created_at',)
    
    @display(description="Статус")
    def get_status_display(self, obj):
        colors = {
            'pending': '#f59e0b',
            'confirmed': '#3b82f6',
            'processing': '#8b5cf6',
            'shipped': '#06b6d4',
            'delivered': '#10b981',
            'cancelled': '#ef4444',
            'refunded': '#6b7280'
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="color: {}; font-weight: 500;">{}</span>',
            color, obj.get_status_display()
        )
    
    @display(description="Примітки")
    def get_notes_preview(self, obj):
        if obj.notes:
            return obj.notes[:50] + "..." if len(obj.notes) > 50 else obj.notes
        return "Без примітки"


@admin.register(Cart)
class CartAdmin(ModelAdmin):
    list_display = ('store', 'session_key', 'get_items_count', 'created_at', 'updated_at')
    list_filter = (
        'store',
        ('created_at', RangeDateFilter)
    )
    search_fields = ('store__name', 'session_key')
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 25
    
    @display(description="Кількість товарів")
    def get_items_count(self, obj):
        return obj.items.count()


@admin.register(CartItem)
class CartItemAdmin(ModelAdmin):
    list_display = ('cart', 'product', 'variant', 'quantity', 'get_product_price')
    list_filter = ('cart__store',)
    search_fields = ('product__name', 'cart__session_key', 'cart__store__name')
    list_per_page = 25
    
    @display(description="Ціна продукту")
    def get_product_price(self, obj):
        if obj.product:
            price = obj.product.current_price
            return f"{price} {obj.product.currency}"
        return "Немає даних" 