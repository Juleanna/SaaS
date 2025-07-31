from rest_framework import serializers
from products.models import Product, ProductImage, ProductVariant, Category


class ProductSerializer(serializers.ModelSerializer):
    """Сериалізатор для товарів"""
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'sale_price', 'current_price', 'currency',
            'product_type', 'barcode', 'qr_code',
            'sku', 'weight', 'dimensions',
            'is_active', 'is_featured',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'current_price', 'created_at', 'updated_at']