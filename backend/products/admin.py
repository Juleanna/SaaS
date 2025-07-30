from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter
from unfold.decorators import display
from .models import Category, Product, ProductImage, ProductVariant


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 0
    fields = ('image', 'alt_text', 'is_primary', 'order')
    ordering = ('order',)


class ProductVariantInline(TabularInline):
    model = ProductVariant
    extra = 0
    fields = ('name', 'value', 'price_adjustment', 'stock_quantity', 'is_active')


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('name', 'store', 'order', 'products_count', 'is_active')
    list_filter = ('is_active', 'store')
    search_fields = ('name', 'description', 'store__name', 'store__owner__email')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('store', 'order')
    list_per_page = 25
    
    @display(description="Кількість продуктів")
    def products_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ('name', 'store', 'category', 'get_price_display', 'get_image_preview', 'stock_quantity', 'is_active', 'is_featured')
    list_filter = (
        'is_active', 
        'is_featured', 
        'is_in_stock',
        'category',
        'store',
        ('created_at', RangeDateFilter)
    )
    search_fields = ('name', 'description', 'sku', 'store__name', 'store__owner__email')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'current_price')
    list_per_page = 20
    inlines = [ProductImageInline, ProductVariantInline]
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('store', 'category', 'name', 'slug', 'description', 'short_description'),
            'classes': ('tab',),
            'description': 'Базова інформація про продукт'
        }),
        ('Ціни та наявність', {
            'fields': ('price', 'sale_price', 'current_price', 'currency', 'stock_quantity', 'is_in_stock', 'allow_backorders'),
            'classes': ('tab',),
            'description': 'Ціноутворення та управління запасами'
        }),
        ('SEO налаштування', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('tab',),
            'description': 'Налаштування для пошукових систем'
        }),
        ('Характеристики', {
            'fields': ('weight', 'dimensions', 'sku'),
            'classes': ('tab',),
            'description': 'Фізичні характеристики та артикул'
        }),
        ('Статус та налаштування', {
            'fields': ('is_featured', 'is_active'),
            'classes': ('tab',),
            'description': 'Статус продукту та його відображення'
        }),
        ('Системна інформація', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
            'description': 'Дати створення та оновлення'
        }),
    )
    
    @display(description="Ціна", ordering="price")
    def get_price_display(self, obj):
        if obj.sale_price and obj.sale_price < obj.price:
            return format_html(
                '<span style="text-decoration: line-through; color: #9ca3af;">{} {}</span><br>'
                '<span style="color: #dc2626; font-weight: 600;">{} {}</span>',
                obj.price, obj.currency,
                obj.sale_price, obj.currency
            )
        return f"{obj.price} {obj.currency}"
    
    @display(description="Зображення")
    def get_image_preview(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image and primary_image.image:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius: 4px; object-fit: cover;" />',
                primary_image.image.url
            )
        return "Немає"


@admin.register(ProductImage)
class ProductImageAdmin(ModelAdmin):
    list_display = ('product', 'get_image_preview', 'alt_text', 'is_primary', 'order')
    list_filter = ('is_primary', 'product__store')
    search_fields = ('alt_text', 'product__name', 'product__store__name')
    ordering = ('product', 'order')
    list_per_page = 25
    
    @display(description="Зображення")
    def get_image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="border-radius: 4px; object-fit: cover;" />',
                obj.image.url
            )
        return "Немає"


@admin.register(ProductVariant)
class ProductVariantAdmin(ModelAdmin):
    list_display = ('product', 'name', 'value', 'get_price_adjustment', 'stock_quantity', 'is_active')
    list_filter = ('is_active', 'product__store')
    search_fields = ('name', 'value', 'product__name', 'product__store__name')
    list_per_page = 25
    
    @display(description="Зміна ціни", ordering="price_adjustment")
    def get_price_adjustment(self, obj):
        if obj.price_adjustment:
            color = "#dc2626" if obj.price_adjustment > 0 else "#16a34a"
            symbol = "+" if obj.price_adjustment > 0 else ""
            return format_html(
                '<span style="color: {}; font-weight: 600;">{}{} ₴</span>',
                color, symbol, obj.price_adjustment
            )
        return "0 ₴" 