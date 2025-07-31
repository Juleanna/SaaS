from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    """Адміністрування платежів"""
    
    list_display = (
        'order_display', 'amount_display', 'payment_method_display', 
        'status_display', 'created_at_display', 'paid_at_display'
    )
    list_filter = ('status', 'payment_method', 'currency', 'created_at')
    search_fields = ('order__order_number', 'external_payment_id', 'transaction_id')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('order', 'amount', 'currency', 'payment_method', 'status')
        }),
        (_('Зовнішні ідентифікатори'), {
            'fields': ('external_payment_id', 'transaction_id')
        }),
        (_('Додаткова інформація'), {
            'fields': ('description', 'metadata')
        }),
        (_('Дати'), {
            'fields': ('created_at', 'updated_at', 'paid_at'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    # Unfold display methods
    @display(description=_('Замовлення'), ordering='order__order_number')
    def order_display(self, obj):
        """Відображення замовлення з посиланням"""
        if obj.order:
            order_url = reverse('admin:orders_order_change', args=[obj.order.pk])
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-blue-500">shopping_cart</span>'
                '<a href="{}" class="text-blue-600 hover:text-blue-800">#{}</a>'
                '</div>',
                order_url,
                obj.order.order_number if hasattr(obj.order, 'order_number') else obj.order.pk
            )
        return '-'
    
    @display(description=_('Сума'), ordering='amount')
    def amount_display(self, obj):
        """Відображення суми з валютою"""
        return format_html(
            '<div class="text-right font-medium">'
            '<span class="text-green-600">{:.2f}</span>'
            '<span class="text-gray-500 ml-1">{}</span>'
            '</div>',
            obj.amount,
            obj.currency
        )
    
    @display(description=_('Спосіб оплати'), ordering='payment_method')
    def payment_method_display(self, obj):
        """Відображення способу оплати з іконкою"""
        method_icons = {
            'card': 'credit_card',
            'bank_transfer': 'account_balance',
            'paypal': 'payment',
            'cash': 'payments',
            'crypto': 'currency_bitcoin',
        }
        
        method_colors = {
            'card': 'text-blue-500',
            'bank_transfer': 'text-green-500',
            'paypal': 'text-indigo-500',
            'cash': 'text-gray-500',
            'crypto': 'text-orange-500',
        }
        
        icon = method_icons.get(obj.payment_method, 'payment')
        color = method_colors.get(obj.payment_method, 'text-gray-500')
        
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined {}">{}</span>'
            '<span>{}</span>'
            '</div>',
            color,
            icon,
            obj.get_payment_method_display()
        )
    
    @display(description=_('Статус'), ordering='status')
    def status_display(self, obj):
        """Відображення статусу з кольоровою міткою"""
        status_colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800',
            'refunded': 'bg-purple-100 text-purple-800',
        }
        
        status_icons = {
            'pending': 'schedule',
            'processing': 'hourglass_empty',
            'completed': 'check_circle',
            'failed': 'error',
            'cancelled': 'cancel',
            'refunded': 'undo',
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
    
    @display(description=_('Створено'), ordering='created_at')
    def created_at_display(self, obj):
        """Відображення дати створення"""
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.created_at.strftime('%d.%m.%Y'),
            obj.created_at.strftime('%H:%M')
        )
    
    @display(description=_('Оплачено'), ordering='paid_at')
    def paid_at_display(self, obj):
        """Відображення дати оплати"""
        if obj.paid_at:
            return format_html(
                '<div class="text-sm">'
                '<div class="text-green-600">{}</div>'
                '<div class="text-gray-500">{}</div>'
                '</div>',
                obj.paid_at.strftime('%d.%m.%Y'),
                obj.paid_at.strftime('%H:%M')
            )
        else:
            return format_html(
                '<span class="text-gray-400">-</span>'
            )