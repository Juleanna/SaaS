from rest_framework import serializers
from .models import Payment, PaymentMethod, Refund
from orders.serializers import OrderSerializer


class PaymentSerializer(serializers.ModelSerializer):
    """Серіалізатор для платежів"""
    
    status_display = serializers.CharField(read_only=True)
    payment_method_display = serializers.CharField(read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'amount', 'currency', 
            'payment_method', 'payment_method_display', 'status', 'status_display',
            'external_payment_id', 'transaction_id', 'description', 'metadata',
            'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'paid_at']


class PaymentCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення платежу"""
    
    class Meta:
        model = Payment
        fields = [
            'order', 'payment_method', 'description'
        ]
    
    def create(self, validated_data):
        # Сума беретьcя з замовлення
        order = validated_data['order']
        validated_data['amount'] = order.total_amount
        validated_data['currency'] = order.currency
        return super().create(validated_data)


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Серіалізатор для методів оплати"""
    
    commission_total = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'store', 'method_type', 'is_active', 'display_name', 'description',
            'commission_type', 'commission_percentage', 'commission_fixed', 'commission_total',
            'min_amount', 'max_amount', 'sort_order', 'icon', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_commission_total(self, obj):
        """Розрахувати загальну комісію для тестової суми 1000"""
        test_amount = 1000
        return obj.calculate_commission(test_amount)


class PaymentMethodCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення методу оплати"""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'method_type', 'is_active', 'display_name', 'description',
            'api_credentials', 'commission_type', 'commission_percentage',
            'commission_fixed', 'min_amount', 'max_amount', 'sort_order', 'icon'
        ]
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class RefundSerializer(serializers.ModelSerializer):
    """Серіалізатор для повернень"""
    
    payment_order_number = serializers.CharField(source='payment.order.order_number', read_only=True)
    initiated_by_name = serializers.CharField(source='initiated_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Refund
        fields = [
            'id', 'payment', 'payment_order_number', 'amount', 'reason', 
            'status', 'status_display', 'external_refund_id',
            'initiated_by', 'initiated_by_name', 'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at']


class RefundCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення повернення"""
    
    class Meta:
        model = Refund
        fields = ['payment', 'amount', 'reason']
    
    def validate_amount(self, value):
        """Валідація суми повернення"""
        payment = self.initial_data.get('payment')
        if payment and hasattr(payment, 'amount'):
            if value > payment.amount:
                raise serializers.ValidationError('Сума повернення не може перевищувати суму платежу')
        return value
    
    def create(self, validated_data):
        validated_data['initiated_by'] = self.context['request'].user
        return super().create(validated_data)


class PaymentMethodPublicSerializer(serializers.ModelSerializer):
    """Публічний серіалізатор для методів оплати (для покупців)"""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'method_type', 'display_name', 'description', 
            'min_amount', 'max_amount', 'icon'
        ]


class PaymentStatusUpdateSerializer(serializers.Serializer):
    """Серіалізатор для оновлення статусу платежу"""
    
    status = serializers.ChoiceField(choices=Payment.STATUS_CHOICES)
    external_payment_id = serializers.CharField(required=False, allow_blank=True)
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)