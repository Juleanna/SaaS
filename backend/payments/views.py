from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import models
from decimal import Decimal

from stores.models import Store
from orders.models import Order
from .models import Payment, PaymentMethod, Refund
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentStatusUpdateSerializer,
    PaymentMethodSerializer, PaymentMethodCreateSerializer, PaymentMethodPublicSerializer,
    RefundSerializer, RefundCreateSerializer
)


class PaymentListCreateView(generics.ListCreateAPIView):
    """View для управління платежами магазину"""
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_method', 'status', 'currency']
    search_fields = ['order__order_number', 'transaction_id', 'external_payment_id']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Payment.objects.filter(order__store=store).select_related('order')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer


class PaymentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим платежем"""
    
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Payment.objects.filter(order__store=store)


class PaymentMethodListCreateView(generics.ListCreateAPIView):
    """View для управління методами оплати магазину"""
    
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['method_type', 'is_active']
    ordering_fields = ['sort_order', 'display_name', 'created_at']
    ordering = ['sort_order', 'display_name']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return PaymentMethod.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentMethodCreateSerializer
        return PaymentMethodSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим методом оплати"""
    
    serializer_class = PaymentMethodSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return PaymentMethod.objects.filter(store=store)


class RefundListCreateView(generics.ListCreateAPIView):
    """View для управління поверненнями коштів"""
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment__payment_method']
    search_fields = ['payment__order__order_number', 'reason']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Refund.objects.filter(payment__order__store=store).select_related(
            'payment__order', 'initiated_by'
        )
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RefundCreateSerializer
        return RefundSerializer


class RefundDetailView(generics.RetrieveUpdateAPIView):
    """View для управління окремим поверненням"""
    
    serializer_class = RefundSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Refund.objects.filter(payment__order__store=store)


# Публічні API (для покупців)
class PaymentMethodPublicListView(generics.ListAPIView):
    """Публічний список методів оплати для магазину"""
    
    serializer_class = PaymentMethodPublicSerializer
    permission_classes = [permissions.AllowAny]
    ordering = ['sort_order', 'display_name']
    
    def get_queryset(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        return PaymentMethod.objects.filter(store=store, is_active=True)


@api_view(['POST'])
def update_payment_status(request, store_id, payment_id):
    """Оновлення статусу платежу"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    payment = get_object_or_404(Payment, id=payment_id, order__store=store)
    
    serializer = PaymentStatusUpdateSerializer(data=request.data)
    if serializer.is_valid():
        old_status = payment.status
        
        # Оновлюємо дані платежу
        payment.status = serializer.validated_data['status']
        if serializer.validated_data.get('external_payment_id'):
            payment.external_payment_id = serializer.validated_data['external_payment_id']
        if serializer.validated_data.get('transaction_id'):
            payment.transaction_id = serializer.validated_data['transaction_id']
        if serializer.validated_data.get('metadata'):
            payment.metadata.update(serializer.validated_data['metadata'])
        
        # Встановлюємо дату оплати
        if payment.status == 'completed' and not payment.paid_at:
            payment.paid_at = timezone.now()
        
        payment.save()
        
        # Оновлюємо статус замовлення
        if payment.status == 'completed':
            payment.order.payment_status = 'paid'
            payment.order.save()
        elif payment.status == 'failed':
            payment.order.payment_status = 'failed'
            payment.order.save()
        
        return Response({
            'message': f'Статус платежу змінено з "{old_status}" на "{payment.status}"',
            'status': payment.status,
            'paid_at': payment.paid_at
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def mark_payment_as_paid(request, store_id, payment_id):
    """Позначити платіж як оплачений"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    payment = get_object_or_404(Payment, id=payment_id, order__store=store)
    
    if payment.status in ['completed', 'refunded']:
        return Response(
            {'error': 'Платіж вже оплачений або повернений'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    payment.mark_as_paid()
    
    return Response({
        'message': 'Платіж успішно позначено як оплачений',
        'status': payment.status,
        'paid_at': payment.paid_at
    })


@api_view(['POST'])
def process_refund(request, store_id, refund_id):
    """Обробити повернення коштів"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    refund = get_object_or_404(Refund, id=refund_id, payment__order__store=store)
    
    if refund.status != 'pending':
        return Response(
            {'error': 'Повернення вже оброблено або скасовано'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Тут має бути логіка інтеграції з платіжною системою
    # Поки що просто позначаємо як завершене
    refund.status = 'completed'
    refund.processed_at = timezone.now()
    refund.save()
    
    # Оновлюємо статус оригінального платежу
    if refund.amount >= refund.payment.amount:
        refund.payment.status = 'refunded'
        refund.payment.save()
    
    return Response({
        'message': 'Повернення коштів успішно оброблено',
        'status': refund.status,
        'processed_at': refund.processed_at
    })


@api_view(['GET'])
def payment_analytics(request, store_id):
    """Аналітика платежів для магазину"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    
    payments = Payment.objects.filter(order__store=store)
    
    # Загальна статистика
    total_payments = payments.count()
    completed_payments = payments.filter(status='completed').count()
    total_revenue = payments.filter(status='completed').aggregate(
        total=models.Sum('amount')
    )['total'] or Decimal('0.00')
    
    # Статистика за способами оплати
    payment_methods_stats = {}
    for method_code, method_name in Payment.PAYMENT_METHODS:
        count = payments.filter(payment_method=method_code).count()
        revenue = payments.filter(
            payment_method=method_code, 
            status='completed'
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')
        
        payment_methods_stats[method_code] = {
            'name': method_name,
            'count': count,
            'revenue': revenue
        }
    
    # Статистика за статусами
    status_stats = {}
    for status_code, status_name in Payment.STATUS_CHOICES:
        count = payments.filter(status=status_code).count()
        status_stats[status_code] = {
            'name': status_name,
            'count': count
        }
    
    # Повернення коштів
    refunds = Refund.objects.filter(payment__order__store=store)
    total_refunds = refunds.count()
    total_refunded_amount = refunds.filter(status='completed').aggregate(
        total=models.Sum('amount')
    )['total'] or Decimal('0.00')
    
    return Response({
        'total_payments': total_payments,
        'completed_payments': completed_payments,
        'success_rate': (completed_payments / total_payments * 100) if total_payments > 0 else 0,
        'total_revenue': total_revenue,
        'payment_methods_statistics': payment_methods_stats,
        'status_statistics': status_stats,
        'refunds': {
            'total_refunds': total_refunds,
            'total_refunded_amount': total_refunded_amount
        }
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_payment_for_order(request, store_slug, order_id):
    """Створити платіж для замовлення (публічний endpoint)"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    order = get_object_or_404(Order, id=order_id, store=store)
    
    payment_method_id = request.data.get('payment_method_id')
    if not payment_method_id:
        return Response(
            {'error': 'Необхідно вказати метод оплати'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    payment_method = get_object_or_404(
        PaymentMethod, 
        id=payment_method_id, 
        store=store, 
        is_active=True
    )
    
    # Перевіряємо чи валідна сума для цього методу
    if not payment_method.is_amount_valid(order.total_amount):
        return Response(
            {'error': f'Сума {order.total_amount} не підходить для цього методу оплати'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Створюємо платіж
    payment = Payment.objects.create(
        order=order,
        amount=order.total_amount,
        currency=order.currency,
        payment_method=payment_method.method_type,
        description=f'Оплата замовлення {order.order_number}'
    )
    
    # Тут має бути логіка інтеграції з платіжною системою
    # Поки що просто повертаємо дані платежу
    
    serializer = PaymentSerializer(payment)
    return Response({
        'message': 'Платіж створено успішно',
        'payment': serializer.data,
        'next_step': 'redirect_to_payment_gateway'  # Залежить від методу оплати
    }, status=status.HTTP_201_CREATED)