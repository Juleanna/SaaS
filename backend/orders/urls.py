from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # API для управління замовленнями (для власників магазинів)
    path('api/stores/<int:store_id>/orders/', 
         views.OrderListCreateView.as_view(), 
         name='order-list-create'),
    
    path('api/stores/<int:store_id>/orders/<int:pk>/', 
         views.OrderDetailView.as_view(), 
         name='order-detail'),
    
    path('api/stores/<int:store_id>/orders/<int:order_id>/items/', 
         views.OrderItemListCreateView.as_view(), 
         name='order-item-list-create'),
    
    path('api/stores/<int:store_id>/orders/<int:order_id>/status/', 
         views.update_order_status, 
         name='order-status-update'),
    
    path('api/stores/<int:store_id>/orders/statistics/', 
         views.order_statistics, 
         name='order-statistics'),
    
    # API для кошика (публічне API для покупців)
    path('api/public/<slug:store_slug>/cart/', 
         views.CartDetailView.as_view(), 
         name='cart-detail'),
    
    path('api/public/<slug:store_slug>/cart/items/', 
         views.CartItemListCreateView.as_view(), 
         name='cart-item-list-create'),
    
    path('api/public/<slug:store_slug>/cart/items/<int:pk>/', 
         views.CartItemDetailView.as_view(), 
         name='cart-item-detail'),
    
    path('api/public/<slug:store_slug>/checkout/', 
         views.checkout, 
         name='checkout'),
    
    # Додаткові API
    path('recent/', views.recent_orders, name='recent-orders'),
]