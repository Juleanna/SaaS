from rest_framework import serializers
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem
from products.serializers import ProductPublicSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    """Серіалізатор для товарів замовлення"""
    
    product = ProductPublicSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'variant_name', 'variant_value',
            'quantity', 'unit_price', 'total_price', 'product_name', 'product_sku'
        ]


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    """Серіалізатор для історії статусів замовлення"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'status_display', 'notes', 'created_at']


class OrderSerializer(serializers.ModelSerializer):
    """Серіалізатор для замовлень"""
    
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    items_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'store', 'customer_name', 'customer_email', 'customer_phone',
            'shipping_address', 'shipping_city', 'shipping_postal_code', 'status', 'status_display',
            'created_at', 'updated_at', 'subtotal', 'shipping_cost', 'tax_amount', 'total_amount',
            'currency', 'notes', 'tracking_number', 'payment_status', 'payment_status_display',
            'payment_method', 'payment_transaction_id', 'source', 'source_display',
            'items', 'status_history', 'items_count'
        ]
        read_only_fields = ['id', 'order_number', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення замовлення"""
    
    class Meta:
        model = Order
        fields = [
            'customer_name', 'customer_email', 'customer_phone', 'shipping_address',
            'shipping_city', 'shipping_postal_code', 'notes', 'source'
        ]
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Серіалізатор для оновлення замовлення"""
    
    class Meta:
        model = Order
        fields = [
            'status', 'shipping_cost', 'tax_amount', 'notes', 'tracking_number',
            'payment_status', 'payment_method', 'payment_transaction_id'
        ]


class CartItemSerializer(serializers.ModelSerializer):
    """Серіалізатор для товарів у кошику"""
    
    product = ProductPublicSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'variant', 'quantity', 'total_price', 'created_at']


class CartSerializer(serializers.ModelSerializer):
    """Серіалізатор для кошика"""
    
    items = CartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'store', 'session_key', 'items', 'created_at', 'updated_at']


class CartItemCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для додавання товару в кошик"""
    
    class Meta:
        model = CartItem
        fields = ['product', 'variant', 'quantity']
    
    def create(self, validated_data):
        validated_data['cart'] = self.context['cart']
        return super().create(validated_data)


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення товару замовлення"""
    
    class Meta:
        model = OrderItem
        fields = ['product', 'variant', 'quantity', 'unit_price']
    
    def create(self, validated_data):
        validated_data['order'] = self.context['order']
        return super().create(validated_data)


class OrderStatusUpdateSerializer(serializers.Serializer):
    """Серіалізатор для оновлення статусу замовлення"""
    
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
    notes = serializers.CharField(required=False, allow_blank=True)


class CheckoutSerializer(serializers.Serializer):
    """Серіалізатор для оформлення замовлення"""
    
    customer_name = serializers.CharField(max_length=200)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    source = serializers.ChoiceField(choices=Order._meta.get_field('source').choices, default='website') 