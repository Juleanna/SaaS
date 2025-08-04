from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    """Серіалізатор для категорій"""
    
    products_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'slug', 'image', 'order', 'is_active', 'products_count']


class ProductImageSerializer(serializers.ModelSerializer):
    """Серіалізатор для зображень товару"""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    """Серіалізатор для варіантів товару"""
    
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'value', 'price_adjustment', 'is_active', 'final_price']


class ProductSerializer(serializers.ModelSerializer):
    """Серіалізатор для товарів"""
    
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    store = serializers.SerializerMethodField()
    order_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'sale_price', 'currency', 'current_price',
            'stock_quantity', 'is_featured', 'is_active',
            'weight', 'dimensions', 'sku', 'created_at', 'updated_at',
            'category', 'images', 'variants', 'discount_percentage', 'is_on_sale',
            'store', 'order_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
    
    def get_stock_quantity(self, obj):
        """Отримати кількість на складі"""
        return obj.get_stock_quantity()
    
    def get_store(self, obj):
        """Отримати інформацію про магазин"""
        return {
            'id': obj.store.id,
            'name': obj.store.name,
            'slug': obj.store.slug
        }


class ProductCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення товару"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'short_description', 'price', 'sale_price',
            'currency', 'is_featured', 'weight', 'dimensions', 'sku', 'category'
        ]
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class ProductUpdateSerializer(serializers.ModelSerializer):
    """Серіалізатор для оновлення товару"""
    
    class Meta:
        model = Product
        fields = [
            'name', 'description', 'short_description', 'price', 'sale_price',
            'currency', 'is_featured', 'is_active',
            'weight', 'dimensions', 'sku', 'category'
        ]


class ProductImageCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення зображення товару"""
    
    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text', 'is_primary', 'order']
    
    def create(self, validated_data):
        validated_data['product'] = self.context['product']
        return super().create(validated_data)


class ProductVariantCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення варіанту товару"""
    
    class Meta:
        model = ProductVariant
        fields = ['name', 'value', 'price_adjustment', 'is_active']
    
    def create(self, validated_data):
        validated_data['product'] = self.context['product']
        return super().create(validated_data)


class ProductPublicSerializer(serializers.ModelSerializer):
    """Публічний серіалізатор для відображення товару"""
    
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    discount_percentage = serializers.IntegerField(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    stock_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description',
            'price', 'sale_price', 'currency', 'current_price',
            'stock_quantity', 'is_featured',
            'weight', 'dimensions', 'sku', 'created_at',
            'category', 'images', 'variants', 'discount_percentage', 'is_on_sale'
        ]
    
    def get_stock_quantity(self, obj):
        """Отримати кількість на складі"""
        return obj.get_stock_quantity() 