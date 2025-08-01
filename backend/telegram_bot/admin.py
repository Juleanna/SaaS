from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter, RelatedDropdownFilter
from unfold.decorators import display
from .models import TelegramBot, TelegramUser, TelegramSession, TelegramMessage


class TelegramSessionInline(TabularInline):
    """Inline для сесій Telegram користувача"""
    model = TelegramSession
    extra = 0
    fields = ('store', 'current_state', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')
    can_delete = True
    max_num = 10


@admin.register(TelegramBot)
class TelegramBotAdmin(ModelAdmin):
    """Адміністрування Telegram ботів"""
    
    list_display = (
        'store_display', 'bot_username_display', 'is_active_display', 
        'notifications_display', 'created_at_display'
    )
    list_filter = ('is_active', 'notify_new_orders', 'notify_status_changes', 'created_at')
    search_fields = ('store__name', 'bot_username', 'bot_token')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('store', 'bot_token', 'bot_username', 'is_active')
        }),
        (_('Повідомлення'), {
            'fields': ('welcome_message', 'help_message'),
            'classes': ('collapse',)
        }),
        (_('Налаштування сповіщень'), {
            'fields': ('notify_new_orders', 'notify_status_changes'),
            'classes': ('collapse',)
        }),
        (_('Дати'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ['store__name']
    
    @display(description=_('Магазин'), ordering='store__name')
    def store_display(self, obj):
        """Відображення магазину"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-500">store</span>'
            '<span>{}</span>'
            '</div>',
            obj.store.name
        )
    
    @display(description=_('Бот'), ordering='bot_username')
    def bot_username_display(self, obj):
        """Відображення бота з посиланням"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-500">smart_toy</span>'
            '<a href="https://t.me/{}" target="_blank" class="text-blue-600 hover:text-blue-800">@{}</a>'
            '</div>',
            obj.bot_username,
            obj.bot_username
        )
    
    @display(description=_('Статус'), ordering='is_active')
    def is_active_display(self, obj):
        """Відображення статусу активності"""
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
    
    @display(description=_('Сповіщення'))
    def notifications_display(self, obj):
        """Відображення налаштувань сповіщень"""
        notifications = []
        if obj.notify_new_orders:
            notifications.append('<span class="text-green-600">Замовлення</span>')
        if obj.notify_status_changes:
            notifications.append('<span class="text-blue-600">Статуси</span>')
        
        if notifications:
            return format_html(' | '.join(notifications))
        return format_html('<span class="text-gray-400">Вимкнено</span>')
    
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


@admin.register(TelegramUser)
class TelegramUserAdmin(ModelAdmin):
    """Адміністрування Telegram користувачів"""
    
    list_display = (
        'telegram_user_display', 'user_display', 'is_active_display', 
        'is_blocked_display', 'language_code', 'last_activity_display'
    )
    list_filter = (
        'is_active', 'is_blocked', 'language_code', 
        ('last_activity', RangeDateFilter), 'created_at'
    )
    search_fields = ('username', 'first_name', 'last_name', 'telegram_id', 'user__email')
    readonly_fields = ('created_at', 'last_activity')
    inlines = [TelegramSessionInline]
    
    fieldsets = (
        (_('Telegram інформація'), {
            'fields': ('telegram_id', 'username', 'first_name', 'last_name')
        }),
        (_('Система'), {
            'fields': ('user', 'language_code')
        }),
        (_('Статуси'), {
            'fields': ('is_active', 'is_blocked')
        }),
        (_('Дати'), {
            'fields': ('created_at', 'last_activity'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'last_activity'
    ordering = ['-last_activity']
    
    actions = ['activate_users', 'deactivate_users', 'block_users', 'unblock_users']
    
    @display(description=_('Telegram'), ordering='username')
    def telegram_user_display(self, obj):
        """Відображення Telegram користувача"""
        if obj.username:
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-blue-400">telegram</span>'
                '<div>'
                '<div class="font-medium">@{}</div>'
                '<div class="text-sm text-gray-500">ID: {}</div>'
                '</div>'
                '</div>',
                obj.username,
                obj.telegram_id
            )
        else:
            name = f"{obj.first_name} {obj.last_name}".strip() or f"ID: {obj.telegram_id}"
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-blue-400">telegram</span>'
                '<div>'
                '<div class="font-medium">{}</div>'
                '<div class="text-sm text-gray-500">ID: {}</div>'
                '</div>'
                '</div>',
                name,
                obj.telegram_id
            )
    
    @display(description=_('Користувач системи'), ordering='user__email')
    def user_display(self, obj):
        """Відображення пов'язаного користувача"""
        if obj.user:
            user_url = reverse('admin:accounts_user_change', args=[obj.user.pk])
            return format_html(
                '<div class="flex items-center gap-2">'
                '<span class="material-symbols-outlined text-gray-400">person</span>'
                '<a href="{}" class="text-blue-600 hover:text-blue-800">{}</a>'
                '</div>',
                user_url,
                obj.user.get_full_name() or obj.user.email
            )
        return format_html('<span class="text-gray-400">Не пов\'язано</span>')
    
    @display(description=_('Активний'), ordering='is_active')
    def is_active_display(self, obj):
        """Відображення статусу активності"""
        if obj.is_active:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Так</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">radio_button_unchecked</span>'
                '<span>Ні</span>'
                '</span>'
            )
    
    @display(description=_('Заблокований'), ordering='is_blocked')
    def is_blocked_display(self, obj):
        """Відображення статусу блокування"""
        if obj.is_blocked:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">block</span>'
                '<span>Так</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Ні</span>'
                '</span>'
            )
    
    @display(description=_('Остання активність'), ordering='last_activity')
    def last_activity_display(self, obj):
        """Відображення останньої активності"""
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.last_activity.strftime('%d.%m.%Y'),
            obj.last_activity.strftime('%H:%M')
        )
    
    def activate_users(self, request, queryset):
        """Активувати користувачів"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Активовано {updated} користувачів.')
    activate_users.short_description = _('Активувати користувачів')
    
    def deactivate_users(self, request, queryset):
        """Деактивувати користувачів"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Деактивовано {updated} користувачів.')
    deactivate_users.short_description = _('Деактивувати користувачів')
    
    def block_users(self, request, queryset):
        """Заблокувати користувачів"""
        updated = queryset.update(is_blocked=True)
        self.message_user(request, f'Заблоковано {updated} користувачів.')
    block_users.short_description = _('Заблокувати користувачів')
    
    def unblock_users(self, request, queryset):
        """Розблокувати користувачів"""
        updated = queryset.update(is_blocked=False)
        self.message_user(request, f'Розблоковано {updated} користувачів.')
    unblock_users.short_description = _('Розблокувати користувачів')


@admin.register(TelegramSession)
class TelegramSessionAdmin(ModelAdmin):
    """Адміністрування Telegram сесій"""
    
    list_display = (
        'user_display', 'store_display', 'current_state', 
        'cart_items_count', 'created_at_display', 'updated_at_display'
    )
    list_filter = (
        'current_state', ('store', RelatedDropdownFilter), 
        ('created_at', RangeDateFilter), ('updated_at', RangeDateFilter)
    )
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'store__name')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('user', 'store', 'current_state')
        }),
        (_('Контекст сесії'), {
            'fields': ('context_data',),
            'classes': ('collapse',)
        }),
        (_('Кошик'), {
            'fields': ('cart_items',),
            'classes': ('collapse',)
        }),
        (_('Дати'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'updated_at'
    ordering = ['-updated_at']
    
    @display(description=_('Користувач'), ordering='user__username')
    def user_display(self, obj):
        """Відображення користувача"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-400">person</span>'
            '<span>{}</span>'
            '</div>',
            str(obj.user)
        )
    
    @display(description=_('Магазин'), ordering='store__name')
    def store_display(self, obj):
        """Відображення магазину"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">store</span>'
            '<span>{}</span>'
            '</div>',
            obj.store.name
        )
    
    @display(description=_('Товарів у кошику'))
    def cart_items_count(self, obj):
        """Кількість товарів у кошику"""
        if obj.cart_items:
            count = len(obj.cart_items)
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">shopping_cart</span>'
                '<span>{}</span>'
                '</span>',
                count
            )
        return format_html('<span class="text-gray-400">Порожній</span>')
    
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
    
    @display(description=_('Оновлено'), ordering='updated_at')
    def updated_at_display(self, obj):
        """Відображення дати оновлення"""
        return format_html(
            '<div class="text-sm">'
            '<div>{}</div>'
            '<div class="text-gray-500">{}</div>'
            '</div>',
            obj.updated_at.strftime('%d.%m.%Y'),
            obj.updated_at.strftime('%H:%M')
        )


@admin.register(TelegramMessage)
class TelegramMessageAdmin(ModelAdmin):
    """Адміністрування Telegram повідомлень"""
    
    list_display = (
        'user_display', 'store_display', 'message_type_display', 
        'text_preview', 'is_from_bot_display', 'is_handled_display', 'created_at_display'
    )
    list_filter = (
        'message_type', 'is_from_bot', 'is_handled', 
        ('store', RelatedDropdownFilter), 
        ('created_at', RangeDateFilter)
    )
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'store__name', 'text')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('user', 'store', 'message_id', 'message_type')
        }),
        (_('Контент'), {
            'fields': ('text', 'data')
        }),
        (_('Статуси'), {
            'fields': ('is_from_bot', 'is_handled')
        }),
        (_('Дати'), {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    
    actions = ['mark_as_handled', 'mark_as_unhandled']
    
    @display(description=_('Користувач'), ordering='user__username')
    def user_display(self, obj):
        """Відображення користувача"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-blue-400">person</span>'
            '<span>{}</span>'
            '</div>',
            str(obj.user)
        )
    
    @display(description=_('Магазин'), ordering='store__name')
    def store_display(self, obj):
        """Відображення магазину"""
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="material-symbols-outlined text-green-500">store</span>'
            '<span>{}</span>'
            '</div>',
            obj.store.name
        )
    
    @display(description=_('Тип'), ordering='message_type')
    def message_type_display(self, obj):
        """Відображення типу повідомлення"""
        type_colors = {
            'text': 'bg-blue-100 text-blue-800',
            'photo': 'bg-green-100 text-green-800',
            'video': 'bg-purple-100 text-purple-800',
            'document': 'bg-orange-100 text-orange-800',
            'location': 'bg-red-100 text-red-800',
            'contact': 'bg-yellow-100 text-yellow-800',
        }
        
        type_icons = {
            'text': 'text_fields',
            'photo': 'photo',
            'video': 'videocam',
            'document': 'description',
            'location': 'location_on',
            'contact': 'contact_phone',
        }
        
        color_class = type_colors.get(obj.message_type, 'bg-gray-100 text-gray-800')
        icon = type_icons.get(obj.message_type, 'message')
        
        return format_html(
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium {}">'
            '<span class="material-symbols-outlined text-xs">{}</span>'
            '<span>{}</span>'
            '</span>',
            color_class,
            icon,
            obj.get_message_type_display()
        )
    
    @display(description=_('Текст'))
    def text_preview(self, obj):
        """Попередній перегляд тексту"""
        if obj.text:
            if len(obj.text) > 50:
                return format_html(
                    '<span title="{}">{}</span>',
                    obj.text,
                    obj.text[:47] + '...'
                )
            return obj.text
        return format_html('<span class="text-gray-400">Немає тексту</span>')
    
    @display(description=_('Від бота'), ordering='is_from_bot')
    def is_from_bot_display(self, obj):
        """Відображення джерела повідомлення"""
        if obj.is_from_bot:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">smart_toy</span>'
                '<span>Бот</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">person</span>'
                '<span>Користувач</span>'
                '</span>'
            )
    
    @display(description=_('Оброблено'), ordering='is_handled')
    def is_handled_display(self, obj):
        """Відображення статусу обробки"""
        if obj.is_handled:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">check_circle</span>'
                '<span>Так</span>'
                '</span>'
            )
        else:
            return format_html(
                '<span class="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">'
                '<span class="material-symbols-outlined text-xs">schedule</span>'
                '<span>Ні</span>'
                '</span>'
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
    
    def mark_as_handled(self, request, queryset):
        """Позначити як оброблені"""
        updated = queryset.update(is_handled=True)
        self.message_user(request, f'Позначено як оброблені {updated} повідомлень.')
    mark_as_handled.short_description = _('Позначити як оброблені')
    
    def mark_as_unhandled(self, request, queryset):
        """Позначити як необроблені"""
        updated = queryset.update(is_handled=False)
        self.message_user(request, f'Позначено як необроблені {updated} повідомлень.')
    mark_as_unhandled.short_description = _('Позначити як необроблені')