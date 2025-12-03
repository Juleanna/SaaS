from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # Приватные (владелец магазина)
    path('stores/<int:store_id>/orders/', views.OrderListCreateView.as_view(), name='order-list-create'),
    path('stores/<int:store_id>/orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('stores/<int:store_id>/orders/<int:order_id>/items/', views.OrderItemListCreateView.as_view(), name='order-item-list-create'),
    path('stores/<int:store_id>/orders/<int:order_id>/status/', views.update_order_status, name='order-status-update'),
    path('stores/<int:store_id>/orders/statistics/', views.order_statistics, name='order-statistics'),

    # Публичные (витрина)
    path('public/<slug:store_slug>/cart/', views.CartDetailView.as_view(), name='cart-detail'),
    path('public/<slug:store_slug>/cart/items/', views.CartItemListCreateView.as_view(), name='cart-item-list-create'),
    path('public/<slug:store_slug>/cart/items/<int:pk>/', views.CartItemDetailView.as_view(), name='cart-item-detail'),
    path('public/<slug:store_slug>/checkout/', views.checkout, name='checkout'),

    # Сервисный
    path('recent/', views.recent_orders, name='recent-orders'),
]
