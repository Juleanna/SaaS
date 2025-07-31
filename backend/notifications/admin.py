from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    """Адміністрування сповіщень"""
    
    list_display = (
        'user_display', 'title_display', 'notification_type_display', 
        'status_display', 'delivery_status', 'created_at_display'
    )
    list_filter = ('notification_type', 'is_read', 'is_sent', 'email_sent', 'telegram_sent', 'created_at')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'title', 'message')
    readonly_fields = ('created_at', 'read_at')
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('user', 'notification_type', 'title', 'message')
        }),
        (_('Пов\'язані об\'єкти'), {
            'fields': ('related_order', 'data')
        }),
        (_('Статус'), {
            'fields': ('is_read', 'is_sent', 'email_sent', 'telegram_sent')
        }),
        (_('Дати'), {
            'fields': ('created_at', 'read_at'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        """Позначити як прочитані"""
        queryset.update(is_read=True)
    mark_as_read.short_description = _('Позначити як прочитані')
    
    def mark_as_unread(self, request, queryset):
        """Позначити як непрочитані"""
        queryset.update(is_read=False)
    mark_as_unread.short_description = _('Позначити як непрочитані')
    
    # Unfold display methods
    @display(description=_('Користувач'), ordering='user__email')
    def user_display(self, obj):
        """Відображення користувача з іконкою"""
        if obj.user:
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-gray-400">person</span>'
                '<span>{}</span>'
                '</div>',
                obj.user.get_full_name() or obj.user.email
            )
        return '-'
    
    @display(description=_('Заголовок'), ordering='title')
    def title_display(self, obj):
        """Відображення заголовка з обрізанням"""
        if len(obj.title) > 50:
            return format_html(
                '<span title="{}">{}</span>',
                obj.title,
                obj.title[:47] + '...'
            )
        return obj.title
    
    @display(description=_('Тип'), ordering='notification_type')
    def notification_type_display(self, obj):
        """Відображення типу з кольоровою міткою"""
        type_colors = {
            'info': 'bg-blue-100 text-blue-800',
            'success': 'bg-green-100 text-green-800',
            'warning': 'bg-yellow-100 text-yellow-800',
            'error': 'bg-red-100 text-red-800',
        }
        color_class = type_colors.get(obj.notification_type, 'bg-gray-100 text-gray-800')
        
        return format_html(
            '<span class="px-2 py-1 rounded-full text-xs font-medium {}">{}</span>',
            color_class,
            obj.get_notification_type_display()
        )
    
    @display(description=_('Статус'), ordering='is_read')
    def status_display(self, obj):
        """Відображення статусу прочитання"""
        if obj.is_read:
            return format_html(
                '<div class="flex items-center gap-1">'
                '<span class="material-symbols-outlined text-green-500 text-sm">check_circle</span>'
                '<span class="text-green-600">Прочитано</span>'
                '</div>'
            )
        else:
            return format_html(
                '<div class="flex items-center gap-1">'
                '<span class="material-symbols-outlined text-orange-500 text-sm">radio_button_unchecked</span>'
                '<span class="text-orange-600">Не прочитано</span>'
                '</div>'
            )
    
    @display(description=_('Доставка'), ordering='is_sent')
    def delivery_status(self, obj):
        """Відображення статусу доставки"""
        statuses = []
        
        if obj.email_sent:
            statuses.append('<span class="material-symbols-outlined text-blue-500 text-sm" title="Email відправлено">email</span>')
        
        if obj.telegram_sent:
            statuses.append('<span class="material-symbols-outlined text-green-500 text-sm" title="Telegram відправлено">send</span>')
        
        if not obj.is_sent:
            statuses.append('<span class="material-symbols-outlined text-gray-400 text-sm" title="Не відправлено">schedule</span>')
        
        return format_html('<div class="flex items-center gap-1">{}</div>', ''.join(statuses))
    
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