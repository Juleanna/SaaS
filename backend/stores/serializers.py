from rest_framework import serializers
from .models import Store, StoreBlock, StoreSocialLink


class StoreBlockSerializer(serializers.ModelSerializer):
    """Серіалізатор для блоків магазину"""
    
    class Meta:
        model = StoreBlock
        fields = ['id', 'title', 'content', 'block_type', 'order', 'is_active']


class StoreSocialLinkSerializer(serializers.ModelSerializer):
    """Серіалізатор для соціальних мереж магазину"""
    
    class Meta:
        model = StoreSocialLink
        fields = ['id', 'social_type', 'url', 'title', 'is_active']


class StoreSerializer(serializers.ModelSerializer):
    """Серіалізатор для магазину"""
    
    blocks = StoreBlockSerializer(many=True, read_only=True)
    social_links = StoreSocialLinkSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.full_name', read_only=True)
    products_count = serializers.IntegerField(read_only=True)
    orders_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'slug', 'description', 'phone', 'email', 'address',
            'logo', 'banner_image', 'primary_color', 'secondary_color', 'accent_color',
            'show_instagram_feed', 'show_telegram_button', 'custom_css',
            'meta_title', 'meta_description', 'is_active', 'is_featured',
            'created_at', 'updated_at', 'owner', 'owner_name',
            'blocks', 'social_links', 'products_count', 'orders_count'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'owner']


class StoreCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення магазину"""
    
    class Meta:
        model = Store
        fields = [
            'name', 'description', 'phone', 'email', 'address',
            'logo', 'banner_image', 'primary_color', 'secondary_color', 'accent_color',
            'show_instagram_feed', 'show_telegram_button', 'custom_css',
            'meta_title', 'meta_description'
        ]
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class StoreUpdateSerializer(serializers.ModelSerializer):
    """Серіалізатор для оновлення магазину"""
    
    class Meta:
        model = Store
        fields = [
            'name', 'description', 'phone', 'email', 'address',
            'logo', 'banner_image', 'primary_color', 'secondary_color', 'accent_color',
            'show_instagram_feed', 'show_telegram_button', 'custom_css',
            'meta_title', 'meta_description', 'is_active'
        ]


class StoreBlockCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення блоку магазину"""
    
    class Meta:
        model = StoreBlock
        fields = ['title', 'content', 'block_type', 'order', 'is_active']
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class StoreSocialLinkCreateSerializer(serializers.ModelSerializer):
    """Серіалізатор для створення соціальної мережі магазину"""
    
    class Meta:
        model = StoreSocialLink
        fields = ['social_type', 'url', 'title', 'is_active']
    
    def create(self, validated_data):
        validated_data['store'] = self.context['store']
        return super().create(validated_data)


class StorePublicSerializer(serializers.ModelSerializer):
    """Публічний серіалізатор для відображення магазину"""
    
    blocks = StoreBlockSerializer(many=True, read_only=True)
    social_links = StoreSocialLinkSerializer(many=True, read_only=True)
    
    class Meta:
        model = Store
        fields = [
            'id', 'name', 'slug', 'description', 'phone', 'email', 'address',
            'logo', 'banner_image', 'primary_color', 'secondary_color', 'accent_color',
            'show_instagram_feed', 'show_telegram_button', 'custom_css',
            'meta_title', 'meta_description', 'blocks', 'social_links'
        ] 