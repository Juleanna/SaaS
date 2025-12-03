from decimal import Decimal

import stripe
from django.conf import settings
from django.db import models
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from stores.models import Store
from stores.tenancy import StoreScopedMixin
from stores.permissions import IsStoreOwnerOrStaff
from orders.models import Order
from .models import Payment, PaymentMethod, Refund
from .serializers import (
    PaymentCreateSerializer,
    PaymentMethodCreateSerializer,
    PaymentMethodPublicSerializer,
    PaymentMethodSerializer,
    PaymentSerializer,
    PaymentStatusUpdateSerializer,
    RefundCreateSerializer,
    RefundSerializer,
)


class PaymentListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """���⥦� �� ��������."""

    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['payment_method', 'status', 'currency']
    search_fields = ['order__order_number', 'transaction_id', 'external_payment_id']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Payment.objects.filter(order__store=self.store).select_related('order')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentCreateSerializer
        return PaymentSerializer


class PaymentDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """��⠫� ���⥦�."""

    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return Payment.objects.filter(order__store=self.store)


class PaymentMethodListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """���ᮡ� ������ ��������."""

    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['method_type', 'is_active']
    ordering_fields = ['sort_order', 'display_name', 'created_at']
    ordering = ['sort_order', 'display_name']

    def get_queryset(self):
        return PaymentMethod.objects.filter(store=self.store)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PaymentMethodCreateSerializer
        return PaymentMethodSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = self.store
        return context


class PaymentMethodDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """��⠫� ᯮᮡ� ������."""

    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return PaymentMethod.objects.filter(store=self.store)


class RefundListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """������ �� ��������."""

    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment__payment_method']
    search_fields = ['payment__order__order_number', 'reason']
    ordering_fields = ['created_at', 'amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Refund.objects.filter(payment__order__store=self.store).select_related('payment__order', 'initiated_by')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RefundCreateSerializer
        return RefundSerializer


class RefundDetailView(StoreScopedMixin, generics.RetrieveUpdateAPIView):
    """��⠫� �������."""

    serializer_class = RefundSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return Refund.objects.filter(payment__order__store=self.store)


# �����⠭� API (����㠭�)
class PaymentMethodPublicListView(generics.ListAPIView):
    """�������� ������ �������� ��������."""

    serializer_class = PaymentMethodPublicSerializer
    permission_classes = [permissions.AllowAny]
    ordering = ['sort_order', 'display_name']

    def get_queryset(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        return PaymentMethod.objects.filter(store=store, is_active=True)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_stripe_session(request, store_slug):
    """Создать Stripe Checkout Session для заказа."""
    if not settings.STRIPE_API_KEY:
        return Response({'error': 'Stripe API key not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    stripe.api_key = settings.STRIPE_API_KEY

    order_number = request.data.get('order_number')
    success_url = request.data.get('success_url')
    cancel_url = request.data.get('cancel_url')

    if not order_number or not success_url or not cancel_url:
        return Response({'error': 'order_number, success_url, cancel_url обязательны'}, status=status.HTTP_400_BAD_REQUEST)

    order = get_object_or_404(Order, store__slug=store_slug, store__is_active=True, order_number=order_number)

    payment, _ = Payment.objects.get_or_create(
        order=order,
        payment_method='stripe',
        defaults={'amount': order.total_amount, 'currency': order.currency, 'status': 'pending'},
    )
    # Обновляем сумму/валюту на случай изменений заказа
    payment.amount = order.total_amount
    payment.currency = order.currency
    payment.status = 'pending'
    payment.save(update_fields=['amount', 'currency', 'status'])

    idempotency_key = request.META.get('HTTP_IDEMPOTENCY_KEY') or getattr(request, 'request_id', None)

    session = stripe.checkout.Session.create(
        mode='payment',
        success_url=success_url,
        cancel_url=cancel_url,
        line_items=[
            {
                'price_data': {
                    'currency': order.currency.lower(),
                    'product_data': {'name': f"Order {order.order_number}"},
                    'unit_amount': int(order.total_amount * 100),
                },
                'quantity': 1,
            }
        ],
        metadata={
            'order_id': str(order.id),
            'store_id': str(order.store_id),
            'payment_id': str(payment.id),
        },
        idempotency_key=idempotency_key,
    )

    payment.external_payment_id = session.id
    payment.metadata = payment.metadata or {}
    payment.metadata['checkout_session'] = session.id
    payment.save()

    return Response({'session_id': session.id, 'url': session.url})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def stripe_webhook(request):
    """Обработчик Stripe webhook (checkout.session.completed / payment_intent)."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        return Response({'error': 'Stripe webhook secret not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)

    event_type = event.get('type')
    data_object = event['data']['object']
    metadata = data_object.get('metadata', {}) if isinstance(data_object, dict) else {}

    payment = None
    payment_id = metadata.get('payment_id')
    if payment_id:
        payment = Payment.objects.filter(id=payment_id).select_related('order').first()
    elif data_object.get('id'):
        payment = Payment.objects.filter(external_payment_id=data_object['id']).select_related('order').first()

    if not payment:
        return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

    if event_type in ['checkout.session.completed', 'payment_intent.succeeded']:
        payment.status = 'completed'
        payment.paid_at = payment.paid_at or timezone.now()
        payment.external_payment_id = payment.external_payment_id or data_object.get('id', '')
        payment.save()

        if payment.order.payment_status != 'paid':
            payment.order.payment_status = 'paid'
            payment.order.save()

    elif event_type in ['payment_intent.payment_failed', 'checkout.session.expired']:
        payment.status = 'failed'
        reason = data_object.get('last_payment_error', {}).get('message') if isinstance(data_object, dict) else ''
        payment.metadata = payment.metadata or {}
        if reason:
            payment.metadata['failure_reason'] = reason
        payment.save()
        if payment.order.payment_status != 'failed':
            payment.order.payment_status = 'failed'
            payment.order.save()

    return Response({'status': 'ok'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsStoreOwnerOrStaff])
def update_payment_status(request, store_id, payment_id):
    """�������� ����� ���⥦� �������楬."""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    payment = get_object_or_404(Payment, id=payment_id, order__store=store)

    serializer = PaymentStatusUpdateSerializer(data=request.data)
    if serializer.is_valid():
        old_status = payment.status

        payment.status = serializer.validated_data['status']
        if serializer.validated_data.get('external_payment_id'):
            payment.external_payment_id = serializer.validated_data['external_payment_id']
        if serializer.validated_data.get('transaction_id'):
            payment.transaction_id = serializer.validated_data['transaction_id']
        if serializer.validated_data.get('metadata'):
            payment.metadata.update(serializer.validated_data['metadata'])

        if payment.status == 'completed' and not payment.paid_at:
            payment.paid_at = timezone.now()

        payment.save()

        if payment.status == 'completed':
            payment.order.payment_status = 'paid'
            payment.order.save()
        elif payment.status == 'failed':
            payment.order.payment_status = 'failed'
            payment.order.save()

        return Response(
            {
                'message': f'����� ���⥦� ������ � "{old_status}" �� "{payment.status}"',
                'status': payment.status,
                'paid_at': payment.paid_at,
            }
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsStoreOwnerOrStaff])
def mark_payment_as_paid(request, store_id, payment_id):
    """�ਭ㤨⥫쭮 �⬥��� ����� ��� ����祭��."""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    payment = get_object_or_404(Payment, id=payment_id, order__store=store)

    if payment.status in ['completed', 'refunded']:
        return Response(
            {'error': '����� 㦥 ������� ��� �������'}, status=status.HTTP_400_BAD_REQUEST
        )

    payment.mark_as_paid()

    return Response(
        {
            'message': '����� �⬥祭 ��� ����祭',
            'status': payment.status,
            'paid_at': payment.paid_at,
        }
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsStoreOwnerOrStaff])
def process_refund(request, store_id, refund_id):
    """��ࠡ���� ������ ������."""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    refund = get_object_or_404(Refund, id=refund_id, payment__order__store=store)

    if refund.status != 'pending':
        return Response(
            {'error': '������ 㦥 ��ࠡ�⠭'}, status=status.HTTP_400_BAD_REQUEST
        )

    refund.status = 'completed'
    refund.completed_at = timezone.now()
    refund.save()

    payment = refund.payment
    payment.refund(amount=refund.amount)

    return Response({'message': '������ �஢���', 'status': refund.status})
