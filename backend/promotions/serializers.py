from rest_framework import serializers

from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description',
            'discount_type', 'discount_value', 'min_order_amount',
            'max_uses', 'uses_count',
            'valid_from', 'valid_until', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uses_count', 'created_at', 'updated_at']


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=32)
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
