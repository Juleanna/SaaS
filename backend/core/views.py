from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum
from decimal import Decimal
from stores.models import Store
from products.models import Product
from orders.models import Order


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Отримання статистики для дашборду"""
    user_stores = Store.objects.filter(owner=request.user)
    
    # Загальна статистика
    total_stores = user_stores.count()
    total_products = Product.objects.filter(store__in=user_stores).count()
    active_products = Product.objects.filter(store__in=user_stores, is_active=True).count()
    
    # Статистика замовлень
    total_orders = Order.objects.filter(store__in=user_stores).count()
    pending_orders = Order.objects.filter(store__in=user_stores, status='pending').count()
    completed_orders = Order.objects.filter(store__in=user_stores, status='completed').count()
    
    # Статистика доходів
    total_revenue = Order.objects.filter(
        store__in=user_stores, 
        payment_status='paid'
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Статистика за останні 30 днів
    from datetime import timedelta
    from django.utils import timezone
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    recent_orders = Order.objects.filter(
        store__in=user_stores,
        created_at__gte=thirty_days_ago
    ).count()
    
    recent_revenue = Order.objects.filter(
        store__in=user_stores,
        payment_status='paid',
        created_at__gte=thirty_days_ago
    ).aggregate(
        total=Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    return Response({
        'stores': {
            'total': total_stores,
        },
        'products': {
            'total': total_products,
            'active': active_products,
            'inactive': total_products - active_products,
        },
        'orders': {
            'total': total_orders,
            'pending': pending_orders,
            'completed': completed_orders,
            'recent_30_days': recent_orders,
        },
        'revenue': {
            'total': float(total_revenue),
            'recent_30_days': float(recent_revenue),
        }
    })