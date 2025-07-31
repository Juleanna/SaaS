from django.contrib import admin
from django.contrib.admin import sites
from django.db.models import Count, Sum, Q
from django.utils.html import format_html
from django.template.response import TemplateResponse
from django.urls import path
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from datetime import datetime, timedelta
from accounts.models import User
from stores.models import Store
from orders.models import Order
from products.models import Product
from payments.models import Payment
from notifications.models import Notification


class DashboardAdminMixin:
    """Mixin для додавання дашборда в адмін панель"""
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    def dashboard_view(self, request):
        """Інтерактивний дашборд з фільтрами"""
        # Отримуємо фільтри
        date_filter = request.GET.get('date_filter', '30')
        store_filter = request.GET.get('store_filter', 'all')
        
        # Розраховуємо дати
        if date_filter == '7':
            start_date = datetime.now() - timedelta(days=7)
            period_name = 'останні 7 днів'
        elif date_filter == '30':
            start_date = datetime.now() - timedelta(days=30)
            period_name = 'останні 30 днів'
        elif date_filter == '90':
            start_date = datetime.now() - timedelta(days=90)
            period_name = 'останні 90 днів'
        else:
            start_date = datetime.now() - timedelta(days=365)
            period_name = 'останній рік'
        
        # Базові фільтри
        orders_filter = Q(created_at__gte=start_date)
        payments_filter = Q(created_at__gte=start_date)
        
        if store_filter != 'all':
            orders_filter &= Q(store=store_filter)
            payments_filter &= Q(order__store=store_filter)
        
        # Основна статистика
        dashboard_data = self.get_dashboard_stats(orders_filter, payments_filter)
        
        # Дані для графіків
        chart_data = self.get_chart_data(date_filter, store_filter)
        
        # Список магазинів для фільтра
        stores_list = Store.objects.filter(is_active=True)
        
        context = {
            **self.each_context(request),
            'title': 'Інтерактивний дашборд',
            'dashboard_data': dashboard_data,
            'chart_data': chart_data,
            'filters': {
                'date_filter': date_filter,
                'store_filter': store_filter,
                'stores_list': stores_list,
                'period_name': period_name,
            },
            'has_permission': True,
        }
        
        return TemplateResponse(request, 'admin/dashboard.html', context)
    
    def get_dashboard_stats(self, orders_filter, payments_filter):
        """Отримання статистики для дашборда"""
        # Основні числа
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        total_stores = Store.objects.count()
        active_stores = Store.objects.filter(is_active=True).count()
        total_products = Product.objects.count()
        
        # Статистика замовлень
        orders_queryset = Order.objects.filter(orders_filter)
        total_orders = orders_queryset.count()
        completed_orders = orders_queryset.filter(status='delivered').count()
        pending_orders = orders_queryset.filter(status='pending').count()
        cancelled_orders = orders_queryset.filter(status='cancelled').count()
        
        # Статистика платежів
        payments_queryset = Payment.objects.filter(payments_filter)
        total_revenue = payments_queryset.filter(status='completed').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        # Конверсія
        conversion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
        
        # Топ магазини
        top_stores = Store.objects.annotate(
            orders_count=Count('orders', filter=orders_filter),
            revenue=Sum('orders__payments__amount', 
                       filter=payments_filter & Q(orders__payments__status='completed'))
        ).filter(revenue__isnull=False).order_by('-revenue')[:5]
        
        # Топ продукти
        top_products = Product.objects.annotate(
            orders_count=Count('order_items__order', filter=orders_filter)
        ).filter(orders_count__gt=0).order_by('-orders_count')[:5]
        
        # Останні замовлення
        recent_orders = Order.objects.select_related('store', 'user').filter(
            orders_filter
        ).order_by('-created_at')[:10]
        
        # Статистика по статусах
        order_status_stats = orders_queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Статистика способів оплати
        payment_method_stats = payments_queryset.values('payment_method').annotate(
            count=Count('id'),
            total_amount=Sum('amount')
        ).order_by('-total_amount')
        
        return {
            'stats': {
                'total_users': total_users,
                'active_users': active_users,
                'total_stores': total_stores,
                'active_stores': active_stores,
                'total_products': total_products,
                'total_orders': total_orders,
                'completed_orders': completed_orders,
                'pending_orders': pending_orders,
                'cancelled_orders': cancelled_orders,
                'total_revenue': total_revenue,
                'conversion_rate': round(conversion_rate, 2),
            },
            'top_stores': top_stores,
            'top_products': top_products,
            'recent_orders': recent_orders,
            'order_status_stats': list(order_status_stats),
            'payment_method_stats': list(payment_method_stats),
        }
    


# Функція для дашборда (буде викликана з urls.py)
def dashboard_view(request):
    """Інтерактивний дашборд з фільтрами"""
    if not request.user.is_staff:
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden("Access denied")
    
    # Отримуємо фільтри
    date_filter = request.GET.get('date_filter', '30')
    store_filter = request.GET.get('store_filter', 'all')
    
    # Розраховуємо дати
    if date_filter == '7':
        start_date = datetime.now() - timedelta(days=7)
        period_name = 'останні 7 днів'
    elif date_filter == '30':
        start_date = datetime.now() - timedelta(days=30)
        period_name = 'останні 30 днів'
    elif date_filter == '90':
        start_date = datetime.now() - timedelta(days=90)
        period_name = 'останні 90 днів'
    else:
        start_date = datetime.now() - timedelta(days=365)
        period_name = 'останній рік'
    
    # Базові фільтри
    orders_filter = Q(created_at__gte=start_date)
    payments_filter = Q(created_at__gte=start_date)
    
    if store_filter != 'all':
        orders_filter &= Q(store=store_filter)
        payments_filter &= Q(order__store=store_filter)
    
    # Основна статистика
    dashboard_data = get_dashboard_stats(orders_filter, payments_filter, start_date, store_filter)
    
    # Дані для графіків
    chart_data = get_chart_data(date_filter, store_filter)
    
    # Список магазинів для фільтра
    stores_list = Store.objects.filter(is_active=True)
    
    context = {
        'title': 'Інтерактивний дашборд',
        'dashboard_data': dashboard_data,
        'chart_data': chart_data,
        'filters': {
            'date_filter': date_filter,
            'store_filter': store_filter,
            'stores_list': stores_list,
            'period_name': period_name,
        },
        'has_permission': True,
    }
    
    return TemplateResponse(request, 'admin/dashboard.html', context)


def get_dashboard_stats(orders_filter, payments_filter, start_date, store_filter):
    """Отримання статистики для дашборда"""
    # Основні числа
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    total_stores = Store.objects.count()
    active_stores = Store.objects.filter(is_active=True).count()
    total_products = Product.objects.count()
    
    # Статистика замовлень
    orders_queryset = Order.objects.filter(orders_filter)
    total_orders = orders_queryset.count()
    completed_orders = orders_queryset.filter(status='delivered').count()
    pending_orders = orders_queryset.filter(status='pending').count()
    cancelled_orders = orders_queryset.filter(status='cancelled').count()
    
    # Статистика платежів
    payments_queryset = Payment.objects.filter(payments_filter)
    total_revenue = payments_queryset.filter(status='completed').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # Конверсія
    conversion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
    
    # Топ магазини - використовуємо тільки фільтр по даті
    orders_date_filter = Q(orders__created_at__gte=start_date)
    payments_date_filter = Q(orders__payments__created_at__gte=start_date)
    
    if store_filter != 'all':
        stores_queryset = Store.objects.filter(id=store_filter)
    else:
        stores_queryset = Store.objects.all()
    
    top_stores = stores_queryset.annotate(
        orders_count=Count('orders', filter=orders_date_filter),
        revenue=Sum('orders__payments__amount', 
                   filter=payments_date_filter & Q(orders__payments__status='completed'))
    ).filter(revenue__isnull=False).order_by('-revenue')[:5]
    
    # Топ продукти
    top_products = Product.objects.annotate(
        orders_count=Count('orderitem__order', filter=orders_filter)
    ).filter(orders_count__gt=0).order_by('-orders_count')[:5]
    
    # Останні замовлення  
    recent_orders = Order.objects.select_related('store').filter(
        orders_filter
    ).order_by('-created_at')[:10]
    
    # Статистика по статусах
    order_status_stats = orders_queryset.values('status').annotate(
        count=Count('id')
    ).order_by('-count')
    
    # Статистика способів оплати
    payment_method_stats = payments_queryset.values('payment_method').annotate(
        count=Count('id'),
        total_amount=Sum('amount')
    ).order_by('-total_amount')
    
    return {
        'stats': {
            'total_users': total_users,
            'active_users': active_users,
            'total_stores': total_stores,
            'active_stores': active_stores,
            'total_products': total_products,
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'pending_orders': pending_orders,
            'cancelled_orders': cancelled_orders,
            'total_revenue': total_revenue,
            'conversion_rate': round(conversion_rate, 2),
        },
        'top_stores': top_stores,
        'top_products': top_products,
        'recent_orders': recent_orders,
        'order_status_stats': list(order_status_stats),
        'payment_method_stats': list(payment_method_stats),
    }


def get_chart_data(date_filter, store_filter):
    """Дані для графіків"""
    days = int(date_filter) if date_filter.isdigit() else 30
    
    # Замовлення по днях
    orders_by_day = []
    revenue_by_day = []
    labels = []
    
    for i in range(days):
        day = datetime.now() - timedelta(days=days-1-i)
        
        # Фільтри для дня
        day_filter = Q(created_at__date=day.date())
        if store_filter != 'all':
            day_filter &= Q(store=store_filter)
        
        day_orders = Order.objects.filter(day_filter).count()
        
        # Для платежів потрібен окремий фільтр
        payment_day_filter = Q(created_at__date=day.date())
        if store_filter != 'all':
            payment_day_filter &= Q(order__store=store_filter)
            
        day_revenue = Payment.objects.filter(
            payment_day_filter & Q(status='completed')
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        orders_by_day.append(day_orders)
        revenue_by_day.append(float(day_revenue))
        labels.append(day.strftime('%d.%m'))
    
    return {
        'labels': labels,
        'orders_by_day': orders_by_day,
        'revenue_by_day': revenue_by_day,
    }


def dashboard_callback(request, context):
    """Callback для панелі управління з статистикою"""
    
    # Статистика користувачів
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    subscribed_users = User.objects.filter(is_subscribed=True).count()
    
    # Статистика магазинів
    total_stores = Store.objects.count()
    active_stores = Store.objects.filter(is_active=True).count()
    
    # Статистика продуктів
    total_products = Product.objects.count()
    active_products = Product.objects.filter(is_active=True).count()
    
    # Статистика замовлень
    total_orders = Order.objects.count()
    pending_orders = Order.objects.filter(status='pending').count()
    completed_orders = Order.objects.filter(status='delivered').count()
    
    # Загальний дохід
    total_revenue = Order.objects.filter(
        payment_status='paid'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or 0
    
    # Останні замовлення
    recent_orders = Order.objects.select_related('store').order_by('-created_at')[:5]
    
    context.update({
        'dashboard_stats': {
            'users': {
                'total': total_users,
                'active': active_users,
                'subscribed': subscribed_users,
            },
            'stores': {
                'total': total_stores,
                'active': active_stores,
            },
            'products': {
                'total': total_products,
                'active': active_products,
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'completed': completed_orders,
            },
            'revenue': {
                'total': total_revenue,
            },
        },
        'recent_orders': recent_orders,
    })
    
    return context


