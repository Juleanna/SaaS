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
    fields = ('name', 'value', 'price_adjustment', 'cost_adjustment', 'sku_suffix', 'is_active')


class CategoryProductInline(TabularInline):
    """Інлайн продукти в категорії"""
    model = Product
    extra = 0
    fields = ('name', 'price', 'sale_price', 'get_stock_display', 'is_active', 'is_featured')
    readonly_fields = ('name', 'get_stock_display')
    can_delete = False
    max_num = 10
    
    def get_stock_display(self, obj):
        if not obj.track_stock:
            return "Не відстежується"
        
        total_stock = obj.get_stock_quantity()
        if total_stock is None or total_stock <= 0:
            return "Немає в наявності"
        
        return f"{total_stock} од."
    get_stock_display.short_description = "Залишки"
    
    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ('get_category_preview', 'name', 'store_name_short', 'order', 'products_count', 'is_active')
    list_filter = ('is_active', 'store', 'store__owner')
    search_fields = ('name', 'description', 'store__name', 'store__owner__email')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('store', 'order', 'name')
    list_per_page = 25
    list_editable = ('is_active', 'order')
    actions = ['make_active', 'make_inactive', 'duplicate_category']
    inlines = [CategoryProductInline]
    
    fieldsets = (
        ('Основна інформація', {
            'fields': ('store', 'name', 'slug', 'description'),
            'classes': ('wide',),
            'description': 'Базова інформація про категорію'
        }),
        ('Зображення та оформлення', {
            'fields': ('image',),
            'classes': ('wide',),
            'description': 'Візуальне оформлення категорії'
        }),
        ('Налаштування відображення', {
            'fields': ('order', 'is_active'),
            'classes': ('wide',),
            'description': 'Порядок сортування та статус'
        }),
    )
    
    @display(description="Категорія", ordering="name")
    def get_category_preview(self, obj):
        if obj.image:
            return format_html(
                '<div style="display: flex; align-items: center; gap: 10px;">'
                '<img src="{}" width="40" height="40" style="border-radius: 6px; object-fit: cover;" />'
                '<strong>{}</strong>'
                '</div>',
                obj.image.url,
                obj.name
            )
        return format_html(
            '<div style="display: flex; align-items: center; gap: 10px;">'
            '<div style="width: 40px; height: 40px; background: #f3f4f6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">📦</div>'
            '<strong>{}</strong>'
            '</div>',
            obj.name
        )
    
    @display(description="Продукти", ordering="products__count")
    def products_count(self, obj):
        count = obj.products.count()
        active_count = obj.products.filter(is_active=True).count()
        if count > 0:
            return format_html(
                '<span style="color: #059669; font-weight: 600;">{}</span> / <span style="color: #6b7280;">{}</span>',
                active_count, count
            )
        return format_html('<span style="color: #9ca3af;">0</span>')
    
    @display(description="Магазин", ordering="store__name")
    def store_name_short(self, obj):
        return obj.store.name
    
    def make_active(self, request, queryset):
        """Активувати категорії"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Активовано {updated} категорій.')
    make_active.short_description = "Активувати вибрані категорії"
    
    def make_inactive(self, request, queryset):
        """Деактивувати категорії"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Деактивовано {updated} категорій.')
    make_inactive.short_description = "Деактивувати вибрані категорії"
    
    def duplicate_category(self, request, queryset):
        """Дублювати категорії"""
        duplicated = 0
        for category in queryset:
            category.pk = None
            category.name = f"{category.name} (копія)"
            category.slug = f"{category.slug}-copy"
            category.save()
            duplicated += 1
        self.message_user(request, f'Створено {duplicated} копій категорій.')
    duplicate_category.short_description = "Дублювати вибрані категорії"


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ('name', 'store', 'category', 'get_price_display', 'get_stock_status', 'get_image_preview', 'is_active', 'is_featured')
    list_filter = (
        'is_active', 
        'is_featured', 
        'product_type',
        'track_stock',
        'stock_status',
        'category',
        'store',
        ('created_at', RangeDateFilter)
    )
    search_fields = ('name', 'description', 'sku', 'barcode', 'qr_code', 'store__name', 'store__owner__email')
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
        ('Ціноутворення', {
            'fields': ('base_cost', 'price', 'sale_price', 'current_price', 'currency'),
            'classes': ('tab',),
            'description': 'Основні ціни (детальне управління через прайс-листи)'
        }),
        ('Розрахунок собівартості', {
            'fields': ('costing_method',),
            'classes': ('tab',),
            'description': 'Метод розрахунку собівартості для warehouse'
        }),
        ('Управління запасами', {
            'fields': ('track_stock', 'stock_status', 'allow_backorders'),
            'classes': ('tab',),
            'description': 'Основні налаштування обліку залишків (пороги управляються через warehouse)'
        }),
        ('Налаштування продажу', {
            'fields': ('minimum_order_quantity', 'maximum_order_quantity', 'order_increment'),
            'classes': ('tab',),
            'description': 'Обмеження кількості при замовленні'
        }),
        ('SEO налаштування', {
            'fields': ('meta_title', 'meta_description'),
            'classes': ('tab',),
            'description': 'Налаштування для пошукових систем'
        }),
        ('Характеристики', {
            'fields': ('product_type', 'weight', 'dimensions', 'sku'),
            'classes': ('tab',),
            'description': 'Фізичні характеристики та артикул'
        }),
        ('Штрихкоди та QR коди', {
            'fields': ('barcode', 'qr_code', 'auto_generate_codes'),
            'classes': ('tab',),
            'description': 'Штрихкоди та QR коди для ідентифікації товару'
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
    
    @display(description="Статус запасів")
    def get_stock_status(self, obj):
        if not obj.track_stock:
            return format_html(
                '<span style="display: inline-flex; align-items: center; gap: 4px; color: #6b7280;">'
                '<span class="material-symbols-outlined" style="font-size: 16px;">visibility_off</span> Не відстежується'
                '</span>'
            )
        
        stock_data = obj.get_stock_status_display_data()
        color_map = {
            'green': '#059669',
            'orange': '#ea580c', 
            'red': '#dc2626',
            'gray': '#6b7280',
        }
        
        return format_html(
            '<span style="display: inline-flex; align-items: center; gap: 4px; color: {};">'
            '<span class="material-symbols-outlined" style="font-size: 16px;">{}</span> {}'
            '</span>',
            color_map.get(stock_data['color'], '#6b7280'),
            stock_data['icon'],
            stock_data['message']
        )
    
    @display(description="Зображення")
    def get_image_preview(self, obj):
        primary_image = obj.images.filter(is_primary=True).first()
        if primary_image and primary_image.image:
            return format_html(
                '<img src="{}" width="40" height="40" style="border-radius: 4px; object-fit: cover;" />',
                primary_image.image.url
            )
        return "Немає"
    
    actions = ['print_barcodes', 'print_qr_codes']
    
    def print_barcodes(self, request, queryset):
        """Масовий друк штрихкодів"""
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        
        products_with_barcodes = queryset.filter(barcode__isnull=False).exclude(barcode='')
        
        if not products_with_barcodes.exists():
            self.message_user(request, 'Серед обраних товарів немає штрихкодів для друку.', level='warning')
            return
        
        html_content = render_to_string('admin/products/print_barcodes_bulk.html', {
            'products': products_with_barcodes
        })
        
        response = HttpResponse(html_content, content_type='text/html')
        response['Content-Disposition'] = 'inline; filename="barcodes_bulk.html"'
        return response
    print_barcodes.short_description = "Надрукувати штрихкоди обраних товарів"
    
    def print_qr_codes(self, request, queryset):
        """Масовий друк QR кодів"""
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        
        products_with_qr = queryset.filter(qr_code__isnull=False).exclude(qr_code='')
        
        if not products_with_qr.exists():
            self.message_user(request, 'Серед обраних товарів немає QR кодів для друку.', level='warning')
            return
        
        html_content = render_to_string('admin/products/print_qr_bulk.html', {
            'products': products_with_qr
        })
        
        response = HttpResponse(html_content, content_type='text/html')
        response['Content-Disposition'] = 'inline; filename="qr_codes_bulk.html"'
        return response
    print_qr_codes.short_description = "Надрукувати QR коди обраних товарів"


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
    list_display = ('product', 'name', 'value', 'get_price_adjustment', 'get_cost_adjustment', 'full_sku', 'is_active')
    list_filter = ('is_active', 'product__store')
    search_fields = ('name', 'value', 'sku_suffix', 'product__name', 'product__store__name')
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
    
    @display(description="Зміна собівартості", ordering="cost_adjustment")
    def get_cost_adjustment(self, obj):
        if obj.cost_adjustment:
            color = "#dc2626" if obj.cost_adjustment > 0 else "#16a34a"
            symbol = "+" if obj.cost_adjustment > 0 else ""
            return format_html(
                '<span style="color: {}; font-weight: 600;">{}{} ₴</span>',
                color, symbol, obj.cost_adjustment
            )
        return "0 ₴" 