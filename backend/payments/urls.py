from django.urls import path
from . import views

app_name = 'payments'

urlpatterns = [
    # Приватные (владелец магазина)
    path('stores/<int:store_id>/payments/', views.PaymentListCreateView.as_view(), name='payment-list-create'),
    path('stores/<int:store_id>/payments/<int:pk>/', views.PaymentDetailView.as_view(), name='payment-detail'),
    path('stores/<int:store_id>/payment-methods/', views.PaymentMethodListCreateView.as_view(), name='payment-method-list-create'),
    path('stores/<int:store_id>/payment-methods/<uuid:pk>/', views.PaymentMethodDetailView.as_view(), name='payment-method-detail'),
    path('stores/<int:store_id>/refunds/', views.RefundListCreateView.as_view(), name='refund-list-create'),
    path('stores/<int:store_id>/refunds/<int:pk>/', views.RefundDetailView.as_view(), name='refund-detail'),
    path('stores/<int:store_id>/payments/<int:payment_id>/status/', views.update_payment_status, name='payment-status-update'),
    path('stores/<int:store_id>/payments/<int:payment_id>/mark-paid/', views.mark_payment_as_paid, name='payment-mark-paid'),
    path('stores/<int:store_id>/refunds/<int:refund_id>/process/', views.process_refund, name='refund-process'),

    # Публичные (витрина)
    path('public/<slug:store_slug>/payment-methods/', views.PaymentMethodPublicListView.as_view(), name='payment-methods-public'),
    path('public/<slug:store_slug>/stripe/session/', views.create_stripe_session, name='stripe-session'),
    path('public/stripe/webhook/', views.stripe_webhook, name='stripe-webhook'),
]
