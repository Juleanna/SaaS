from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from decimal import Decimal
from stores.models import Store
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem
from .serializers import (
    OrderSerializer, OrderCreateSerializer, OrderUpdateSerializer,
    OrderItemSerializer, OrderItemCreateSerializer,
    CartSerializer, CartItemSerializer, CartItemCreateSerializer,
    OrderStatusUpdateSerializer, CheckoutSerializer
)
from django.db import models


class OrderListCreateView(generics.ListCreateAPIView):
    """View для управління замовленнями магазину"""
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_status', 'source']
    search_fields = ['order_number', 'customer_name', 'customer_email']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Order.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим замовленням"""
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Order.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return OrderUpdateSerializer
        return OrderSerializer


class OrderItemListCreateView(generics.ListCreateAPIView):
    """View для управління товарами замовлення"""
    
    serializer_class = OrderItemSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        order = get_object_or_404(Order, id=self.kwargs['order_id'], store=store)
        return OrderItem.objects.filter(order=order)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderItemCreateSerializer
        return OrderItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        context['order'] = get_object_or_404(Order, id=self.kwargs['order_id'], store=store)
        return context


class CartDetailView(generics.RetrieveAPIView):
    """View для перегляду кошика"""
    
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_object(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        
        cart, created = Cart.objects.get_or_create(
            store=store,
            session_key=session_key
        )
        return cart


class CartItemListCreateView(generics.ListCreateAPIView):
    """View для управління товарами в кошику"""
    
    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        
        cart, created = Cart.objects.get_or_create(
            store=store,
            session_key=session_key
        )
        return CartItem.objects.filter(cart=cart)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CartItemCreateSerializer
        return CartItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        
        cart, created = Cart.objects.get_or_create(
            store=store,
            session_key=session_key
        )
        context['cart'] = cart
        return context


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим товаром в кошику"""
    
    serializer_class = CartItemSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        store = get_object_or_404(Store, slug=self.kwargs['store_slug'], is_active=True)
        session_key = self.request.session.session_key
        if not session_key:
            self.request.session.create()
            session_key = self.request.session.session_key
        
        cart, created = Cart.objects.get_or_create(
            store=store,
            session_key=session_key
        )
        return CartItem.objects.filter(cart=cart)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def checkout(request, store_slug):
    """Оформлення замовлення з кошика"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    session_key = request.session.session_key
    
    if not session_key:
        return Response({'error': 'Кошик порожній'}, status=status.HTTP_400_BAD_REQUEST)
    
    cart = get_object_or_404(Cart, store=store, session_key=session_key)
    cart_items = CartItem.objects.filter(cart=cart)
    
    if not cart_items.exists():
        return Response({'error': 'Кошик порожній'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Валідація даних замовлення
    checkout_serializer = CheckoutSerializer(data=request.data)
    if not checkout_serializer.is_valid():
        return Response(checkout_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    # Створення замовлення
    order_data = checkout_serializer.validated_data
    order_data['store'] = store
    order_data['subtotal'] = Decimal('0.00')
    order_data['shipping_cost'] = Decimal('0.00')
    order_data['tax_amount'] = Decimal('0.00')
    
    order = Order.objects.create(**order_data)
    
    # Додавання товарів до замовлення
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
            unit_price=unit_price
        )
        subtotal += unit_price * cart_item.quantity
    
    # Оновлення суми замовлення
    order.subtotal = subtotal
    order.save()
    
    # Очищення кошика
    cart_items.delete()
    
    return Response({
        'message': 'Замовлення успішно створено',
        'order_number': order.order_number,
        'total_amount': order.total_amount
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def update_order_status(request, store_id, order_id):
    """Оновлення статусу замовлення"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    order = get_object_or_404(Order, id=order_id, store=store)
    
    serializer = OrderStatusUpdateSerializer(data=request.data)
    if serializer.is_valid():
        old_status = order.status
        order.status = serializer.validated_data['status']
        order.save()
        
        # Додавання запису в історію
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=serializer.validated_data.get('notes', '')
        )
        
        return Response({
            'message': f'Статус замовлення змінено з "{dict(Order.STATUS_CHOICES).get(old_status)}" на "{dict(Order.STATUS_CHOICES).get(order.status)}"',
            'status': order.status
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def order_statistics(request, store_id):
    """Статистика замовлень для магазину"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    
    # Загальна статистика
    total_orders = Order.objects.filter(store=store).count()
    total_revenue = Order.objects.filter(store=store, payment_status='paid').aggregate(
        total=models.Sum('total_amount')
    )['total'] or Decimal('0.00')
    
    # Статистика за статусами
    status_stats = {}
    for status_code, status_name in Order.STATUS_CHOICES:
        count = Order.objects.filter(store=store, status=status_code).count()
        status_stats[status_code] = {
            'name': status_name,
            'count': count
        }
    
    # Статистика за джерелами
    source_stats = {}
    for source_code, source_name in Order._meta.get_field('source').choices:
        count = Order.objects.filter(store=store, source=source_code).count()
        source_stats[source_code] = {
            'name': source_name,
            'count': count
        }
    
    return Response({
        'total_orders': total_orders,
        'total_revenue': total_revenue,
        'status_statistics': status_stats,
        'source_statistics': source_stats
    })


@api_view(['GET'])
def recent_orders(request):
    """Отримання останніх замовлень користувача"""
    user_stores = Store.objects.filter(owner=request.user)
    limit = int(request.GET.get('limit', 5))
    
    orders = Order.objects.filter(
        store__in=user_stores
    ).order_by('-created_at')[:limit]
    
    serializer = OrderSerializer(orders, many=True, context={'request': request})
    return Response(serializer.data) 