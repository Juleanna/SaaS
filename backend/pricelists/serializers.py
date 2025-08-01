from rest_framework import serializers
from .models import PriceList, PriceListItem, BulkPriceUpdate, PriceHistory
from products.serializers import ProductPublicSerializer


class PriceListSerializer(serializers.ModelSerializer):
    """Серіалізатор для прайс-листів"""
    
    items_count = serializers.IntegerField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    pricing_strategy_display = serializers.CharField(source='get_pricing_strategy_display', read_only=True)
    update_frequency_display = serializers.CharField(source='get_update_frequency_display', read_only=True)
    
    class Meta:
        model = PriceList
        fields = [
            'id', 'store', 'name', 'description', 'pricing_strategy', 'pricing_strategy_display',
            'default_markup_percentage', 'default_markup_amount', 'is_active', 'is_default',
            'auto_update_from_cost', 'update_frequency', 'update_frequency_display',
            'last_cost_sync', 'valid_from', 'valid_until', 'items_count', 'is_valid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_cost_sync']


class PriceListCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення прайс-листа"""
    
    class Meta:
        model = PriceList
        fields = [
            'name', 'description', 'pricing_strategy', 'default_markup_percentage',
            'default_markup_amount', 'is_active', 'is_default', 'auto_update_from_cost',
            'update_frequency', 'valid_from', 'valid_until'
        ]
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class PriceListItemSerializer(serializers.ModelSerializer):
    """Серіалізатор для позицій прайс-листа"""
    
    product = ProductPublicSerializer(read_only=True)
    current_cost = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    profit_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    markup_type_display = serializers.CharField(source='get_markup_type_display', read_only=True)
    cost_calculation_method_display = serializers.CharField(source='get_cost_calculation_method_display', read_only=True)
    
    class Meta:
        model = PriceListItem
        fields = [
            'id', 'price_list', 'product', 'category', 'cost_calculation_method',
            'cost_calculation_method_display', 'manual_cost', 'calculated_cost', 'current_cost',
            'markup_type', 'markup_type_display', 'markup_value', 'markup_formula',
            'calculated_price', 'manual_price', 'final_price', 'min_price', 'max_price',
            'is_manual_override', 'exclude_from_auto_update', 'profit_margin', 'profit_amount',
            'last_cost_update', 'last_price_update', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'calculated_cost', 'calculated_price', 'last_cost_update', 
            'last_price_update', 'created_at', 'updated_at'
        ]


class PriceListItemCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення позиції прайс-листа"""
    
    class Meta:
        model = PriceListItem
        fields = [
            'product', 'cost_calculation_method', 'manual_cost', 'markup_type',
            'markup_value', 'markup_formula', 'manual_price', 'min_price', 'max_price',
            'is_manual_override', 'exclude_from_auto_update'
        ]
    
    def create(self, validated_data):
        validated_data['price_list'] = self.context['price_list']
        return super().create(validated_data)


class BulkPriceUpdateSerializer(serializers.ModelSerializer):
    """Серіалізатор для масових оновлень цін"""
    
    update_type_display = serializers.CharField(source='get_update_type_display', read_only=True)
    adjustment_type_display = serializers.CharField(source='get_adjustment_type_display', read_only=True)
    
    class Meta:
        model = BulkPriceUpdate
        fields = [
            'id', 'price_list', 'name', 'description', 'update_type', 'update_type_display',
            'adjustment_type', 'adjustment_type_display', 'adjustment_value',
            'categories', 'min_current_price', 'max_current_price', 'selected_products',
            'is_executed', 'executed_at', 'affected_items_count', 'execution_log',
            'created_at'
        ]
        read_only_fields = [
            'id', 'is_executed', 'executed_at', 'affected_items_count', 'execution_log', 'created_at'
        ]
    
    def create(self, validated_data):
        validated_data['price_list'] = self.context['price_list']
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class PriceHistorySerializer(serializers.ModelSerializer):
    """Серіалізатор для історії зміни цін"""
    
    product_name = serializers.CharField(source='price_list_item.product.name', read_only=True)
    change_reason_display = serializers.CharField(source='get_change_reason_display', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    price_change_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = PriceHistory
        fields = [
            'id', 'price_list_item', 'product_name', 'old_cost', 'new_cost',
            'old_price', 'new_price', 'change_reason', 'change_reason_display',
            'bulk_update', 'notes', 'changed_by', 'changed_by_name',
            'changed_at', 'price_change_percentage'
        ]
        read_only_fields = ['id', 'changed_at']


class PriceListSummarySerializer(serializers.ModelSerializer):
    """Упрощенный серіалізатор для списків прайс-листів"""
    
    items_count = serializers.IntegerField(read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = PriceList
        fields = [
            'id', 'name', 'description', 'pricing_strategy', 'is_active', 
            'is_default', 'items_count', 'is_valid', 'created_at'
        ]