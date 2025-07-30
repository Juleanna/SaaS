from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display
from .models import Store, StoreBlock, StoreSocialLink


class StoreBlockInline(TabularInline):
    model = StoreBlock
    extra = 0
    fields = ('title', 'block_type', 'order', 'is_active')
    ordering = ('order',)


class StoreSocialLinkInline(TabularInline):
    model = StoreSocialLink
    extra = 0
    fields = ('social_type', 'title', 'url', 'is_active')


@admin.register(Store)
class StoreAdmin(ModelAdmin):
    list_display = ('name', 'owner', 'slug', 'get_logo_preview', 'products_count', 'orders_count', 'is_active', 'is_featured', 'created_at')
    list_filter = (
        'is_active', 
        'is_featured', 
        ('created_at', RangeDateFilter),
        'owner'
    )
    search_fields = ('name', 'owner__email', 'owner__first_name', 'owner__last_name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'products_count', 'orders_count')
    list_per_page = 20
    actions_on_top = True
    actions_on_bottom = False
    inlines = [StoreBlockInline, StoreSocialLinkInline]
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('owner', 'name', 'slug', 'description'),
            'classes': ('tab',),
            'description': 'Базова інформація про магазин'
        }),
        ('Контактна інформація', {
            'fields': ('phone', 'email', 'address'),
            'classes': ('tab',),
            'description': 'Контактні дані магазину'
        }),
        ('Зображення та дизайн', {
            'fields': ('logo', 'banner_image', 'primary_color', 'secondary_color', 'accent_color'),
            'classes': ('tab',),
            'description': 'Логотип, банер та кольорова схема'
        }),
        ('Налаштування лендингу', {
            'fields': ('show_instagram_feed', 'show_telegram_button', 'custom_css'),
            'classes': ('tab',),
            'description': 'Налаштування відображення на лендингу'
        }),
        ('SEO налаштування', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('tab',),
            'description': 'Налаштування для пошукових систем'
        }),
        ('Статус та метрики', {
            'fields': ('is_active', 'is_featured', 'products_count', 'orders_count'),
            'classes': ('tab',),
            'description': 'Статус магазину та основні метрики'
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Системні дати створення та оновлення'
        }),
    )
    
    @display(description="Логотип", ordering="logo")
    def get_logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius: 4px; object-fit: cover;" />',
                obj.logo.url
            )
        return "Немає"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('owner').prefetch_related('blocks', 'social_links')


@admin.register(StoreBlock)
class StoreBlockAdmin(ModelAdmin):
    list_display = ('store', 'title', 'block_type', 'order', 'is_active', 'get_content_preview')
    list_filter = (
        'block_type',
        'is_active', 
        'store'
    )
    search_fields = ('title', 'content', 'store__name', 'store__owner__email')
    ordering = ('store', 'order')
    list_per_page = 25
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('store', 'title', 'block_type', 'order'),
            'classes': ('tab',)
        }),
        ('Контент', {
            'fields': ('content',),
            'classes': ('tab',)
        }),
        ('Налаштування', {
            'fields': ('is_active',),
            'classes': ('tab',)
        }),
    )
    
    @display(description="Попередній перегляд контенту")
    def get_content_preview(self, obj):
        if obj.content:
            # Видаляємо HTML теги для попереднього перегляду
            import re
            clean_content = re.sub('<.*?>', '', obj.content)
            return clean_content[:50] + "..." if len(clean_content) > 50 else clean_content
        return "Немає контенту"


@admin.register(StoreSocialLink)  
class StoreSocialLinkAdmin(ModelAdmin):
    list_display = ('store', 'social_type', 'title', 'get_url_link', 'is_active')
    list_filter = (
        'social_type',
        'is_active', 
        'store'
    )
    search_fields = ('title', 'url', 'store__name', 'store__owner__email')
    list_per_page = 25
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('store', 'social_type', 'title'),
            'classes': ('tab',)
        }),
        ('Посилання', {
            'fields': ('url',),
            'classes': ('tab',)
        }),
        ('Налаштування', {
            'fields': ('is_active',),
            'classes': ('tab',)
        }),
    )
    
    @display(description="Посилання")
    def get_url_link(self, obj):
        if obj.url:
            return format_html(
                '<a href="{}" target="_blank" style="color: #3b82f6; text-decoration: none;">{}</a>',
                obj.url,
                obj.url[:30] + "..." if len(obj.url) > 30 else obj.url
            )
        return "Немає посилання" 