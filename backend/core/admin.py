from django.contrib import admin
from django.db.models import Count, Sum
from django.utils.html import format_html
from accounts.models import User
from stores.models import Store
from orders.models import Order
from products.models import Product


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