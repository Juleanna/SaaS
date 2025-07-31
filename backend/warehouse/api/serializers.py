from rest_framework import serializers
from warehouse.models import Inventory, InventoryItem
from products.api.serializers import ProductSerializer


class InventorySerializer(serializers.ModelSerializer):
    """Сериалізатор для інвентаризації"""
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'number', 'warehouse', 'status',
            'start_date', 'end_date', 'description',
            'responsible_person', 'total_items_counted',
            'total_discrepancy_amount', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InventoryItemSerializer(serializers.ModelSerializer):
    """Сериалізатор для позицій інвентаризації"""
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'inventory', 'product', 'product_details', 'packaging',
            'expected_quantity', 'actual_quantity',
            'shortage_quantity', 'surplus_quantity',
            'unit_cost', 'discrepancy_amount', 'notes',
            'counted_by', 'counted_at',
            'scanned_barcode', 'scanned_qr_code', 'scan_method'
        ]
        read_only_fields = [
            'id', 'shortage_quantity', 'surplus_quantity', 
            'discrepancy_amount', 'counted_at'
        ]