from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # API для управління платежами (для власників магазинів)
    path('api/stores/<int:store_id>/payments/', 
         views.PaymentListCreateView.as_view(), 
         name='payment-list-create'),
    
    path('api/stores/<int:store_id>/payments/<int:pk>/', 
         views.PaymentDetailView.as_view(), 
         name='payment-detail'),
    
    path('api/stores/<int:store_id>/payments/<int:payment_id>/status/', 
         views.update_payment_status, 
         name='payment-status-update'),
    
    path('api/stores/<int:store_id>/payments/<int:payment_id>/mark-paid/', 
         views.mark_payment_as_paid, 
         name='payment-mark-paid'),
    
    # API для методів оплати
    path('api/stores/<int:store_id>/payment-methods/', 
         views.PaymentMethodListCreateView.as_view(), 
         name='payment-method-list-create'),
    
    path('api/stores/<int:store_id>/payment-methods/<uuid:pk>/', 
         views.PaymentMethodDetailView.as_view(), 
         name='payment-method-detail'),
    
    # API для повернень коштів
    path('api/stores/<int:store_id>/refunds/', 
         views.RefundListCreateView.as_view(), 
         name='refund-list-create'),
    
    path('api/stores/<int:store_id>/refunds/<uuid:pk>/', 
         views.RefundDetailView.as_view(), 
         name='refund-detail'),
    
    path('api/stores/<int:store_id>/refunds/<uuid:refund_id>/process/', 
         views.process_refund, 
         name='process-refund'),
    
    # Аналітика
    path('api/stores/<int:store_id>/payments/analytics/', 
         views.payment_analytics, 
         name='payment-analytics'),
    
    # Публічні API (для покупців)
    path('api/public/<slug:store_slug>/payment-methods/', 
         views.PaymentMethodPublicListView.as_view(), 
         name='payment-method-public-list'),
    
    path('api/public/<slug:store_slug>/orders/<int:order_id>/create-payment/', 
         views.create_payment_for_order, 
         name='create-payment-for-order'),
] 