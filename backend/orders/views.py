from decimal import Decimal

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
from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory
from .serializers import (
    CartItemCreateSerializer,
    CartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderCreateSerializer,
    OrderItemCreateSerializer,
    OrderItemSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    OrderUpdateSerializer,
)


class OrderListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """Список/создание заказов магазина."""

    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'source']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return self.filter_queryset_by_store(Order.objects.all())

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = self.store
        return context


class OrderDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """Деталь/обновление/удаление заказа."""

    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_queryset(self):
        return self.filter_queryset_by_store(Order.objects.all())

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return OrderUpdateSerializer
        return OrderSerializer


class OrderItemListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """Позиции заказа."""

    serializer_class = OrderItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]

    def get_order(self):
        return get_object_or_404(Order, id=self.kwargs['order_id'], store=self.store)

    def get_queryset(self):
        return OrderItem.objects.filter(order=self.get_order())

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderItemCreateSerializer
        return OrderItemSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['order'] = self.get_order()
        return context


class CartDetailView(generics.RetrieveAPIView):
    """Публичная корзина по store_slug + session."""

    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key

        cart, _ = Cart.objects.get_or_create(store=store, session_key=session_key)
        return cart


class CartItemListCreateView(generics.ListCreateAPIView):
    """Публичные элементы корзины."""

    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]

    def _get_cart(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key

        cart, _ = Cart.objects.get_or_create(store=store, session_key=session_key)
        return cart

    def get_queryset(self):
        return CartItem.objects.filter(cart=self._get_cart())

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CartItemCreateSerializer
        return CartItemSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['cart'] = self._get_cart()
        return context


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Публичный элемент корзины."""

    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return CartItem.objects.filter(cart=self._get_cart())

    def _get_cart(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key

        cart, _ = Cart.objects.get_or_create(store=store, session_key=session_key)
        return cart


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def checkout(request, store_slug):
    """Создать заказ из корзины (guest checkout)."""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    session_key = request.session.session_key

    if not session_key:
        return Response({'error': 'Сессия не инициализирована'}, status=status.HTTP_400_BAD_REQUEST)

    cart = get_object_or_404(Cart, store=store, session_key=session_key)
    cart_items = CartItem.objects.filter(cart=cart)

    if not cart_items.exists():
        return Response({'error': 'Корзина пуста'}, status=status.HTTP_400_BAD_REQUEST)

    checkout_serializer = CheckoutSerializer(data=request.data)
    if not checkout_serializer.is_valid():
        return Response(checkout_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_data = checkout_serializer.validated_data
    order_data['store'] = store
    order_data['subtotal'] = Decimal('0.00')
    order_data['shipping_cost'] = Decimal('0.00')
    order_data['tax_amount'] = Decimal('0.00')

    order = Order.objects.create(**order_data)

    subtotal = Decimal('0.00')
    for cart_item in cart_items:
        unit_price = cart_item.product.current_price
        if cart_item.variant:
            unit_price = cart_item.variant.final_price

        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            variant=cart_item.variant,
            quantity=cart_item.quantity,
            unit_price=unit_price,
        )
        subtotal += unit_price * cart_item.quantity

    order.subtotal = subtotal
    order.save()

    cart_items.delete()

    return Response(
        {
            'message': 'Заказ создан и отправлен на оплату',
            'order_number': order.order_number,
            'total_amount': order.total_amount,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsStoreOwnerOrStaff])
def update_order_status(request, store_id, order_id):
    """Обновить статус заказа владельцем магазина."""
    store = get_object_or_404(Store, id=store_id)
    if not (request.user.is_superuser or request.user.is_staff or store.owner_id == request.user.id):
        return Response({'error': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
    order = get_object_or_404(Order, id=order_id, store=store)

    serializer = OrderStatusUpdateSerializer(data=request.data)
    if serializer.is_valid():
        old_status = order.status
        order.status = serializer.validated_data['status']
        order.save()

        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=serializer.validated_data.get('notes', ''),
        )

        return Response(
            {
                'message': f'Статус заказа изменён с "{dict(Order.STATUS_CHOICES).get(old_status)}" на "{dict(Order.STATUS_CHOICES).get(order.status)}"',
                'status': order.status,
            }
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
