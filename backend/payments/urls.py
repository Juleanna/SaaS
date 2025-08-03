from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # API для управління платежами (для власників магазинів)
    path('stores/<int:store_id>/payments/', 
         views.PaymentListCreateView.as_view(), 
         name='payment-list-create'),
    
    path('stores/<int:store_id>/payments/<int:pk>/', 
         views.PaymentDetailView.as_view(), 
         name='payment-detail'),
    
    path('stores/<int:store_id>/payments/<int:payment_id>/status/', 
         views.update_payment_status, 
         name='payment-status-update'),
    
    path('stores/<int:store_id>/payments/<int:payment_id>/mark-paid/', 
         views.mark_payment_as_paid, 
         name='payment-mark-paid'),
    
    # API для методів оплати
    path('stores/<int:store_id>/payment-methods/', 
         views.PaymentMethodListCreateView.as_view(), 
         name='payment-method-list-create'),
    
    path('stores/<int:store_id>/payment-methods/<int:pk>/', 
         views.PaymentMethodDetailView.as_view(), 
         name='payment-method-detail'),
    
    # API для повернень коштів
    path('stores/<int:store_id>/refunds/', 
         views.RefundListCreateView.as_view(), 
         name='refund-list-create'),
    
    path('stores/<int:store_id>/refunds/<int:pk>/', 
         views.RefundDetailView.as_view(), 
         name='refund-detail'),
    
    path('stores/<int:store_id>/refunds/<int:refund_id>/process/', 
         views.process_refund, 
         name='process-refund'),
    
    # Аналітика
    path('stores/<int:store_id>/payments/analytics/', 
         views.payment_analytics, 
         name='payment-analytics'),
    
    # Публічні API (для покупців)
    path('public/<slug:store_slug>/payment-methods/', 
         views.PaymentMethodPublicListView.as_view(), 
         name='payment-method-public-list'),
    
    path('public/<slug:store_slug>/orders/<int:order_id>/create-payment/', 
         views.create_payment_for_order, 
         name='create-payment-for-order'),
] 