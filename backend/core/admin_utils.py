from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import Permission
from django.utils.translation import gettext_lazy as _
from django.http import HttpResponse
from django.template.response import TemplateResponse
from django.urls import path
from django.contrib import admin
from django.db.models import Q
from functools import wraps
import json


def require_permission(permission_codename):
    """Декоратор для перевірки дозволів"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            if not request.user.has_perm(permission_codename):
                from django.core.exceptions import PermissionDenied
                raise PermissionDenied("У вас немає дозволу для цієї дії")
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator


class SaaSAdminSite(AdminSite):
    """Кастомний AdminSite для SaaS платформи"""
    
    site_header = _('SaaS Platform Адміністрування')
    site_title = _('SaaS Admin')
    index_title = _('Панель управління SaaS платформою')
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk-actions/', self.admin_view(self.bulk_actions_view), name='bulk_actions'),
            path('export-data/', self.admin_view(self.export_data_view), name='export_data'),
            path('system-status/', self.admin_view(self.system_status_view), name='system_status'),
        ]
        return custom_urls + urls
    
    @require_permission('auth.view_permission')
    def bulk_actions_view(self, request):
        """Масові дії для адміністратора"""
        context = {
            'title': 'Масові дії',
            'available_actions': [
                {'name': 'activate_users', 'title': 'Активувати користувачів'},
                {'name': 'deactivate_stores', 'title': 'Деактивувати магазини'},
                {'name': 'update_prices', 'title': 'Оновити ціни'},
                {'name': 'sync_warehouse', 'title': 'Синхронізувати склад'},
            ],
        }
        return TemplateResponse(request, 'admin/bulk_actions.html', context)
    
    @require_permission('auth.view_permission')
    def export_data_view(self, request):
        """Експорт даних"""
        if request.method == 'POST':
            export_type = request.POST.get('export_type')
            # Логіка експорту
            return HttpResponse(f'Експорт {export_type} розпочато', content_type='text/plain')
        
        context = {
            'title': 'Експорт даних',
            'export_options': [
                {'value': 'users', 'label': 'Користувачі'},
                {'value': 'stores', 'label': 'Магазини'},
                {'value': 'products', 'label': 'Товари'},
                {'value': 'orders', 'label': 'Замовлення'},
                {'value': 'warehouse', 'label': 'Складські дані'},
            ],
        }
        return TemplateResponse(request, 'admin/export_data.html', context)
    
    def system_status_view(self, request):
        """Статус системи"""
        from django.db import connection
        from django.conf import settings
        from django.core.cache import cache
        import redis
        
        # Перевірка бази даних
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_status = 'OK'
        except Exception as e:
            db_status = f'Помилка: {e}'
        
        # Перевірка Redis
        try:
            cache.set('test_key', 'test_value', 10)
            redis_status = 'OK'
        except Exception as e:
            redis_status = f'Помилка: {e}'
        
        # Статистика
        from accounts.models import User
        from stores.models import Store
        from products.models import Product
        from orders.models import Order
        
        stats = {
            'users_count': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'stores_count': Store.objects.count(),
            'active_stores': Store.objects.filter(is_active=True).count(),
            'products_count': Product.objects.count(),
            'orders_count': Order.objects.count(),
        }
        
        context = {
            'title': 'Статус системи',
            'db_status': db_status,
            'redis_status': redis_status,
            'debug_mode': settings.DEBUG,
            'stats': stats,
        }
        return TemplateResponse(request, 'admin/system_status.html', context)


def get_user_permissions_list(user):
    """Отримати список всіх дозволів користувача"""
    if user.is_superuser:
        return Permission.objects.all()
    return Permission.objects.filter(
        Q(user=user) | Q(group__user=user)
    ).distinct()


def check_model_permissions(user, app_label, model_name):
    """Перевірити дозволи для конкретної моделі"""
    permissions = ['add', 'change', 'delete', 'view']
    user_permissions = {}
    
    for perm in permissions:
        perm_code = f'{app_label}.{perm}_{model_name}'
        user_permissions[perm] = user.has_perm(perm_code)
    
    return user_permissions


def admin_action_export_selected(modeladmin, request, queryset):
    """Загальна action для експорту обраних об'єктів"""
    import csv
    from django.http import HttpResponse
    
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{modeladmin.model._meta.verbose_name_plural}.csv"'
    
    writer = csv.writer(response)
    
    # Заголовки
    fields = [field.name for field in modeladmin.model._meta.fields]
    writer.writerow(fields)
    
    # Дані
    for obj in queryset:
        row = []
        for field in fields:
            value = getattr(obj, field)
            row.append(str(value))
        writer.writerow(row)
    
    return response

admin_action_export_selected.short_description = _("Експортувати обрані записи")


class AdvancedModelAdmin(admin.ModelAdmin):
    """Розширений ModelAdmin з додатковими можливостями"""
    
    actions = ['export_selected']
    
    def export_selected(self, request, queryset):
        return admin_action_export_selected(self, request, queryset)
    
    export_selected.short_description = _("Експортувати обрані записи")
    
    def get_readonly_fields(self, request, obj=None):
        """Динамічні readonly поля на основі дозволів"""
        readonly_fields = list(super().get_readonly_fields(request, obj))
        
        if not request.user.has_perm(f'{self.model._meta.app_label}.change_{self.model._meta.model_name}'):
            # Якщо немає дозволу на зміну, робимо всі поля readonly
            readonly_fields.extend([field.name for field in self.model._meta.fields])
        
        return readonly_fields
    
    def has_add_permission(self, request):
        """Перевірка дозволу на додавання"""
        return request.user.has_perm(f'{self.model._meta.app_label}.add_{self.model._meta.model_name}')
    
    def has_change_permission(self, request, obj=None):
        """Перевірка дозволу на зміну"""
        return request.user.has_perm(f'{self.model._meta.app_label}.change_{self.model._meta.model_name}')
    
    def has_delete_permission(self, request, obj=None):
        """Перевірка дозволу на видалення"""
        return request.user.has_perm(f'{self.model._meta.app_label}.delete_{self.model._meta.model_name}')
    
    def has_view_permission(self, request, obj=None):
        """Перевірка дозволу на перегляд"""
        return request.user.has_perm(f'{self.model._meta.app_label}.view_{self.model._meta.model_name}')


# Кастомні фільтри для Unfold
class StoreFilter(admin.SimpleListFilter):
    """Фільтр по магазинах"""
    title = _('Магазин')
    parameter_name = 'store'
    
    def lookups(self, request, model_admin):
        from stores.models import Store
        return [(store.id, store.name) for store in Store.objects.filter(is_active=True)]
    
    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(store_id=self.value())
        return queryset


class DateRangeFilter(admin.SimpleListFilter):
    """Фільтр по діапазону дат"""
    title = _('Період')
    parameter_name = 'date_range'
    
    def lookups(self, request, model_admin):
        return [
            ('today', _('Сьогодні')),
            ('week', _('Цей тиждень')),
            ('month', _('Цей місяць')),
            ('quarter', _('Цей квартал')),
            ('year', _('Цей рік')),
        ]
    
    def queryset(self, request, queryset):
        from datetime import datetime, timedelta
        
        if self.value() == 'today':
            return queryset.filter(created_at__date=datetime.now().date())
        elif self.value() == 'week':
            start_week = datetime.now() - timedelta(days=7)
            return queryset.filter(created_at__gte=start_week)
        elif self.value() == 'month':
            start_month = datetime.now() - timedelta(days=30)
            return queryset.filter(created_at__gte=start_month)
        elif self.value() == 'quarter':
            start_quarter = datetime.now() - timedelta(days=90)
            return queryset.filter(created_at__gte=start_quarter)
        elif self.value() == 'year':
            start_year = datetime.now() - timedelta(days=365)
            return queryset.filter(created_at__gte=start_year)
        
        return queryset