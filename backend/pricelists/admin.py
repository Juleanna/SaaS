from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from django.urls import path, reverse
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template.response import TemplateResponse
from django.utils import timezone
from django import forms
from unfold.admin import ModelAdmin, TabularInline, StackedInline
from unfold.contrib.filters.admin import RangeDateFilter, RangeNumericFilter, RelatedDropdownFilter
from unfold.decorators import action
from decimal import Decimal
import json
import io

from .models import PriceList, PriceListItem, BulkPriceUpdate, PriceHistory
from .services import PriceListService
from .utils.excel_handler import ExcelPriceListHandler
from products.models import Product, Category


class PriceListItemForm(forms.ModelForm):
    """Кастомна форма для PriceListItem з валідацією final_price"""
    
    class Meta:
        model = PriceListItem
        fields = '__all__'
    
    def clean(self):
        cleaned_data = super().clean()
        
        # Перевіряємо, чи форма помічена для видалення
        if cleaned_data.get('DELETE'):
            return cleaned_data
        
        # Простий розрахунок без створення тимчасового об'єкта
        product = cleaned_data.get('product')
        manual_cost = cleaned_data.get('manual_cost')
        calculated_cost = cleaned_data.get('calculated_cost')
        markup_type = cleaned_data.get('markup_type', 'percentage')
        markup_value = cleaned_data.get('markup_value', Decimal('0'))
        manual_price = cleaned_data.get('manual_price')
        is_manual_override = cleaned_data.get('is_manual_override', False)
        
        # Визначаємо собівартість
        cost_calculation_method = cleaned_data.get('cost_calculation_method', 'auto')
        if cost_calculation_method == 'manual' and manual_cost:
            current_cost = manual_cost
        elif calculated_cost:
            current_cost = calculated_cost
        else:
            current_cost = Decimal('0')
        
        # Розраховуємо ціну
        calculated_price = Decimal('0.01')  # Мінімальна ціна за замовчуванням
        
        if current_cost > 0:
            if markup_type == 'percentage':
                calculated_price = current_cost * (1 + markup_value / 100)
            elif markup_type == 'fixed_amount':
                calculated_price = current_cost + markup_value
            elif markup_type == 'fixed_price':
                calculated_price = markup_value if markup_value > 0 else current_cost
            else:
                calculated_price = current_cost
        elif product and hasattr(product, 'price') and product.price > 0:
            # Якщо немає собівартості, використовуємо ціну товару
            calculated_price = product.price
        
        # Гарантуємо мінімальну ціну
        if calculated_price <= 0:
            calculated_price = Decimal('0.01')
        
        # Встановлюємо final_price
        if is_manual_override:
            cleaned_data['final_price'] = manual_price or calculated_price
        else:
            cleaned_data['final_price'] = manual_price or calculated_price
        
        return cleaned_data


class PriceListItemInline(TabularInline):
    """Inline для позицій прайс-листа"""
    model = PriceListItem
    # Відключаємо кастомну форму для inline щоб уникнути конфліктів з DELETE
    # form = PriceListItemForm  
    extra = 0
    fields = [
        'product', 'cost_calculation_method', 'manual_cost', 'calculated_cost',
        'markup_type', 'markup_value', 'calculated_price', 'manual_price', 
        'final_price', 'is_manual_override'
    ]
    readonly_fields = ['calculated_cost', 'calculated_price', 'final_price']
    autocomplete_fields = ['product']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product', 'category')


@admin.register(PriceList)
class PriceListAdmin(ModelAdmin):
    """Адмін для прайс-листів"""
    
    list_display = [
        'name', 'store', 'pricing_strategy', 'items_count_display', 
        'is_active', 'is_default', 'valid_status', 'created_at'
    ]
    list_filter = [
        'is_active', 'is_default', 'pricing_strategy',
        ('store', RelatedDropdownFilter),
        ('created_at', RangeDateFilter),
        'auto_update_from_cost'
    ]
    search_fields = ['name', 'description', 'store__name']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('store', 'name', 'description', 'created_by')
        }),
        (_('Стратегія ціноутворення'), {
            'fields': (
                'pricing_strategy', 'default_markup_percentage', 
                'default_markup_amount'
            )
        }),
        (_('Налаштування'), {
            'fields': (
                'is_active', 'is_default', 'auto_update_from_cost', 
                'update_frequency'
            ),
            'classes': ['collapse']
        }),
        (_('Валідність'), {
            'fields': ('valid_from', 'valid_until'),
            'classes': ['collapse']
        }),
        (_('Метадані'), {
            'fields': ('last_cost_sync', 'created_at', 'updated_at'),
            'classes': ['collapse']
        }),
    )
    readonly_fields = ['created_at', 'updated_at', 'last_cost_sync']
    autocomplete_fields = ['store', 'created_by']
    inlines = [PriceListItemInline]
    
    actions = [
        'activate_price_lists', 'deactivate_price_lists', 
        'sync_costs_from_warehouse', 'export_to_excel',
        'validate_price_lists'
    ]
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/import-excel/',
                self.admin_site.admin_view(self.import_excel_view),
                name='pricelists_pricelist_import_excel',
            ),
            path(
                '<path:object_id>/bulk-update/',
                self.admin_site.admin_view(self.bulk_update_view),
                name='pricelists_pricelist_bulk_update',
            ),
            path(
                '<path:object_id>/analytics/',
                self.admin_site.admin_view(self.analytics_view),
                name='pricelists_pricelist_analytics',
            ),
            path(
                'excel-template/',
                self.admin_site.admin_view(self.excel_template_view),
                name='pricelists_pricelist_excel_template',
            ),
        ]
        return custom_urls + urls
    
    def items_count_display(self, obj):
        """Відображення кількості позицій"""
        count = obj.items_count
        url = reverse('admin:pricelists_pricelistitem_changelist')
        return format_html(
            '<a href="{}?price_list__id__exact={}">{} позицій</a>',
            url, obj.id, count
        )
    items_count_display.short_description = _('Кількість позицій')
    
    def valid_status(self, obj):
        """Статус валідності прайс-листа"""
        if obj.is_valid:
            return format_html(
                '<span style="color: green;">✓ Діє</span>'
            )
        else:
            return format_html(
                '<span style="color: red;">✗ Недіє</span>'
            )
    valid_status.short_description = _('Статус')
    
    @action(description=_('Активувати прайс-листи'))
    def activate_price_lists(self, request, queryset):
        """Активація прайс-листів"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'Активовано {updated} прайс-листів.',
            messages.SUCCESS
        )
    
    @action(description=_('Деактивувати прайс-листи'))
    def deactivate_price_lists(self, request, queryset):
        """Деактивація прайс-листів"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'Деактивовано {updated} прайс-листів.',
            messages.SUCCESS
        )
    
    @action(description=_('Синхронізувати собівартість зі складу'))
    def sync_costs_from_warehouse(self, request, queryset):
        """Синхронізація собівартості зі складу"""
        service = PriceListService()
        total_updated = 0
        
        for price_list in queryset:
            result = service.update_costs_from_warehouse(price_list)
            total_updated += result['updated']
        
        self.message_user(
            request,
            f'Оновлено {total_updated} позицій.',
            messages.SUCCESS
        )
    
    @action(description=_('Експортувати в Excel'))
    def export_to_excel(self, request, queryset):
        """Експорт прайс-листів в Excel"""
        if queryset.count() == 1:
            price_list = queryset.first()
            handler = ExcelPriceListHandler()
            
            buffer = handler.export_to_excel(price_list)
            response = HttpResponse(
                buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = f'attachment; filename="pricelist_{price_list.name}.xlsx"'
            return response
        else:
            self.message_user(
                request,
                'Оберіть тільки один прайс-лист для експорту.',
                messages.ERROR
            )
    
    @action(description=_('Валідувати прайс-листи'))
    def validate_price_lists(self, request, queryset):
        """Валідація прайс-листів"""
        service = PriceListService()
        
        for price_list in queryset:
            validation = service.validate_price_list(price_list)
            
            if validation['errors']:
                self.message_user(
                    request,
                    f'{price_list.name}: Помилки - {", ".join(validation["errors"])}',
                    messages.ERROR
                )
            
            if validation['warnings']:
                self.message_user(
                    request,
                    f'{price_list.name}: Попередження - {", ".join(validation["warnings"])}',
                    messages.WARNING
                )
            
            if validation['is_valid'] and not validation['warnings']:
                self.message_user(
                    request,
                    f'{price_list.name}: Прайс-лист валідний.',
                    messages.SUCCESS
                )
    
    def import_excel_view(self, request, object_id):
        """Імпорт прайс-листа з Excel"""
        price_list = get_object_or_404(PriceList, pk=object_id)
        
        if request.method == 'POST':
            excel_file = request.FILES.get('excel_file')
            update_existing = request.POST.get('update_existing') == 'on'
            
            if excel_file:
                handler = ExcelPriceListHandler()
                result = handler.import_from_excel(
                    excel_file, price_list, update_existing=update_existing
                )
                
                if result['success']:
                    messages.success(
                        request,
                        f'Успішно імпортовано: створено {result["created"]}, '
                        f'оновлено {result["updated"]}, пропущено {result["skipped"]}'
                    )
                    
                    if result.get('errors'):
                        for error in result['errors']:
                            messages.warning(request, error)
                else:
                    for error in result.get('errors', []):
                        messages.error(request, error)
                
                return redirect('admin:pricelists_pricelist_change', object_id)
        
        context = {
            'price_list': price_list,
            'title': f'Імпорт Excel для {price_list.name}',
        }
        
        return render(request, 'admin/pricelists/import_excel.html', context)
    
    def bulk_update_view(self, request, object_id):
        """Масове оновлення цін"""
        price_list = get_object_or_404(PriceList, pk=object_id)
        
        if request.method == 'POST':
            adjustment_type = request.POST.get('adjustment_type')
            adjustment_value = Decimal(request.POST.get('adjustment_value', '0'))
            categories = request.POST.getlist('categories')
            
            service = PriceListService()
            filters = {}
            
            if categories:
                filters['categories'] = Category.objects.filter(id__in=categories)
            
            bulk_update = service.apply_bulk_markup(
                price_list=price_list,
                user=request.user,
                markup_type=adjustment_type,
                markup_value=adjustment_value,
                filters=filters
            )
            
            messages.success(
                request,
                f'Масове оновлення виконано. Змінено {bulk_update.affected_items_count} позицій.'
            )
            
            return redirect('admin:pricelists_pricelist_change', object_id)
        
        categories = Category.objects.filter(
            products__pricelistitem__price_list=price_list
        ).distinct()
        
        context = {
            'price_list': price_list,
            'categories': categories,
            'title': f'Масове оновлення для {price_list.name}',
        }
        
        return render(request, 'admin/pricelists/bulk_update.html', context)
    
    def analytics_view(self, request, object_id):
        """Аналітика прайс-листа"""
        price_list = get_object_or_404(PriceList, pk=object_id)
        service = PriceListService()
        
        # Отримуємо аналітику рентабельності
        profitability = service.get_profitability_analysis(price_list)
        
        context = {
            'price_list': price_list,
            'profitability': profitability,
            'title': f'Аналітика для {price_list.name}',
        }
        
        return render(request, 'admin/pricelists/analytics.html', context)
    
    def excel_template_view(self, request):
        """Завантаження шаблону Excel"""
        handler = ExcelPriceListHandler()
        buffer = handler.generate_template()
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="pricelist_template.xlsx"'
        return response


@admin.register(PriceListItem)
class PriceListItemAdmin(ModelAdmin):
    """Адмін для позицій прайс-листа"""
    
    form = PriceListItemForm
    
    list_display = [
        'product', 'price_list', 'current_cost_display', 'markup_display', 
        'final_price', 'profit_margin_display', 'is_manual_override',
        'last_price_update'
    ]
    list_filter = [
        ('price_list', RelatedDropdownFilter),
        ('category', RelatedDropdownFilter),
        'markup_type', 'cost_calculation_method',
        'is_manual_override', 'exclude_from_auto_update',
        ('final_price', RangeNumericFilter),
        ('last_price_update', RangeDateFilter)
    ]
    search_fields = [
        'product__name', 'product__sku', 'product__barcode',
        'price_list__name'
    ]
    ordering = ['product__name']
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('price_list', 'product', 'category')
        }),
        (_('Собівартість'), {
            'fields': (
                'cost_calculation_method', 'manual_cost', 'calculated_cost',
                'last_cost_update'
            )
        }),
        (_('Націнка та ціна'), {
            'fields': (
                'markup_type', 'markup_value', 'markup_formula',
                'calculated_price', 'manual_price', 'final_price',
                'is_manual_override'
            )
        }),
        (_('Обмеження цін'), {
            'fields': ('min_price', 'max_price'),
            'classes': ['collapse']
        }),
        (_('Налаштування'), {
            'fields': (
                'exclude_from_auto_update', 'last_price_update'
            ),
            'classes': ['collapse']
        }),
    )
    readonly_fields = [
        'calculated_cost', 'calculated_price', 'final_price',
        'last_cost_update', 'last_price_update'
    ]
    autocomplete_fields = ['product', 'price_list', 'category']
    
    actions = [
        'recalculate_prices', 'enable_manual_override', 
        'disable_manual_override', 'update_costs_from_warehouse'
    ]
    
    def current_cost_display(self, obj):
        """Відображення поточної собівартості"""
        cost = obj.current_cost
        if cost:
            return f'{cost:.2f} ₴'
        return '-'
    current_cost_display.short_description = _('Собівартість')
    
    def markup_display(self, obj):
        """Відображення націнки"""
        if obj.markup_type == 'percentage':
            return f'{obj.markup_value}%'
        elif obj.markup_type == 'fixed_amount':
            return f'{obj.markup_value} ₴'
        elif obj.markup_type == 'fixed_price':
            return f'Фікс: {obj.markup_value} ₴'
        else:
            return obj.get_markup_type_display()
    markup_display.short_description = _('Націнка')
    
    def profit_margin_display(self, obj):
        """Відображення рентабельності"""
        margin = obj.profit_margin
        if margin > 0:
            color = 'green'
        elif margin < 0:
            color = 'red'
        else:
            color = 'gray'
        
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, margin
        )
    profit_margin_display.short_description = _('Рентабельність')
    
    @action(description=_('Перерахувати ціни'))
    def recalculate_prices(self, request, queryset):
        """Перерахунок цін"""
        updated = 0
        for item in queryset.filter(is_manual_override=False):
            old_price = item.final_price
            item.save()  # Це викличе перерахунок
            if item.final_price != old_price:
                updated += 1
        
        self.message_user(
            request,
            f'Перераховано {updated} цін.',
            messages.SUCCESS
        )
    
    @action(description=_('Увімкнути ручне перевизначення'))
    def enable_manual_override(self, request, queryset):
        """Увімкнення ручного перевизначення"""
        updated = queryset.update(is_manual_override=True)
        self.message_user(
            request,
            f'Увімкнено ручне перевизначення для {updated} позицій.',
            messages.SUCCESS
        )
    
    @action(description=_('Вимкнути ручне перевизначення'))
    def disable_manual_override(self, request, queryset):
        """Вимкнення ручного перевизначення"""
        updated = queryset.update(is_manual_override=False)
        self.message_user(
            request,
            f'Вимкнено ручне перевизначення для {updated} позицій.',
            messages.SUCCESS
        )
    
    @action(description=_('Оновити собівартість зі складу'))
    def update_costs_from_warehouse(self, request, queryset):
        """Оновлення собівартості зі складу"""
        service = PriceListService()
        updated_count = 0
        
        # Групуємо по прайс-листах
        price_lists = {}
        for item in queryset:
            if item.price_list not in price_lists:
                price_lists[item.price_list] = []
            price_lists[item.price_list].append(item.product)
        
        for price_list, products in price_lists.items():
            result = service.update_costs_from_warehouse(price_list, products)
            updated_count += result['updated']
        
        self.message_user(
            request,
            f'Оновлено собівартість для {updated_count} позицій.',
            messages.SUCCESS
        )


@admin.register(BulkPriceUpdate)
class BulkPriceUpdateAdmin(ModelAdmin):
    """Адмін для масових оновлень цін"""
    
    list_display = [
        'name', 'price_list', 'update_type', 'adjustment_display',
        'is_executed', 'affected_items_count', 'created_at'
    ]
    list_filter = [
        ('price_list', RelatedDropdownFilter),
        'update_type', 'adjustment_type', 'is_executed',
        ('created_at', RangeDateFilter)
    ]
    search_fields = ['name', 'description', 'price_list__name']
    ordering = ['-created_at']
    
    fieldsets = (
        (_('Основна інформація'), {
            'fields': ('price_list', 'name', 'description', 'created_by')
        }),
        (_('Параметри оновлення'), {
            'fields': (
                'update_type', 'adjustment_type', 'adjustment_value'
            )
        }),
        (_('Фільтри'), {
            'fields': (
                'categories', 'selected_products', 
                'min_current_price', 'max_current_price'
            ),
            'classes': ['collapse']
        }),
        (_('Результат виконання'), {
            'fields': (
                'is_executed', 'executed_at', 'affected_items_count', 
                'execution_log'
            ),
            'classes': ['collapse']
        }),
    )
    readonly_fields = [
        'is_executed', 'executed_at', 'affected_items_count', 
        'execution_log', 'created_at'
    ]
    filter_horizontal = ['categories', 'selected_products']
    autocomplete_fields = ['price_list', 'created_by']
    
    def adjustment_display(self, obj):
        """Відображення коригування"""
        if obj.adjustment_type == 'percentage':
            return f'{obj.adjustment_value}%'
        elif obj.adjustment_type == 'fixed_amount':
            return f'{obj.adjustment_value} ₴'
        else:
            return f'{obj.get_adjustment_type_display()}: {obj.adjustment_value}'
    adjustment_display.short_description = _('Коригування')


@admin.register(PriceHistory)
class PriceHistoryAdmin(ModelAdmin):
    """Адмін для історії зміни цін"""
    
    list_display = [
        'price_list_item', 'change_reason', 'price_change_display',
        'cost_change_display', 'changed_by', 'changed_at'
    ]
    list_filter = [
        'change_reason',
        ('changed_by', RelatedDropdownFilter),
        ('changed_at', RangeDateFilter),
        ('price_list_item__price_list', RelatedDropdownFilter)
    ]
    search_fields = [
        'price_list_item__product__name', 'notes',
        'changed_by__username'
    ]
    ordering = ['-changed_at']
    
    fieldsets = (
        (_('Позиція'), {
            'fields': ('price_list_item', 'bulk_update')
        }),
        (_('Зміни собівартості'), {
            'fields': ('old_cost', 'new_cost')
        }),
        (_('Зміни ціни'), {
            'fields': ('old_price', 'new_price')
        }),
        (_('Метадані'), {
            'fields': ('change_reason', 'notes', 'changed_by', 'changed_at')
        }),
    )
    readonly_fields = ['changed_at']
    autocomplete_fields = ['price_list_item', 'bulk_update', 'changed_by']
    
    def price_change_display(self, obj):
        """Відображення зміни ціни"""
        if obj.old_price and obj.new_price:
            change = obj.new_price - obj.old_price
            if change > 0:
                color = 'green'
                arrow = '↑'
            elif change < 0:
                color = 'red'
                arrow = '↓'
            else:
                color = 'gray'
                arrow = '='
            
            return format_html(
                '<span style="color: {};">{} {:.2f} → {:.2f} ({:+.2f})</span>',
                color, arrow, obj.old_price, obj.new_price, change
            )
        return '-'
    price_change_display.short_description = _('Зміна ціни')
    
    def cost_change_display(self, obj):
        """Відображення зміни собівартості"""
        if obj.old_cost and obj.new_cost:
            change = obj.new_cost - obj.old_cost
            if change > 0:
                color = 'orange'
                arrow = '↑'
            elif change < 0:
                color = 'blue'
                arrow = '↓'
            else:
                color = 'gray'
                arrow = '='
            
            return format_html(
                '<span style="color: {};">{} {:.2f} → {:.2f} ({:+.2f})</span>',
                color, arrow, obj.old_cost, obj.new_cost, change
            )
        return '-'
    cost_change_display.short_description = _('Зміна собівартості')