from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from stores.models import Store
from .models import Category, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer, ProductSerializer, ProductCreateSerializer, ProductUpdateSerializer,
    ProductImageSerializer, ProductImageCreateSerializer,
    ProductVariantSerializer, ProductVariantCreateSerializer,
    ProductPublicSerializer
)


class CategoryListCreateView(generics.ListCreateAPIView):
    """View для управління категоріями"""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        print(f"User: {self.request.user}")
        print(f"Is authenticated: {self.request.user.is_authenticated}")
        print(f"Store ID: {self.kwargs.get('store_id')}")
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Category.objects.filter(store=store)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремою категорією"""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Category.objects.filter(store=store)


class ProductListCreateView(generics.ListCreateAPIView):
    """View для управління товарами"""
    
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Product.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим товаром"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return Product.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductUpdateSerializer
        return ProductSerializer


class ProductPublicView(generics.RetrieveAPIView):
    """Публічний view для перегляду товару"""
    
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductImageListCreateView(generics.ListCreateAPIView):
    """View для управління зображеннями товару"""
    
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        product = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return ProductImage.objects.filter(product=product)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductImageCreateSerializer
        return ProductImageSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        context['product'] = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return context


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим зображенням товару"""
    
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        product = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return ProductImage.objects.filter(product=product)


class ProductVariantListCreateView(generics.ListCreateAPIView):
    """View для управління варіантами товару"""
    
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        product = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return ProductVariant.objects.filter(product=product)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductVariantCreateSerializer
        return ProductVariantSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        context['product'] = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return context


class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим варіантом товару"""
    
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        product = get_object_or_404(Product, id=self.kwargs['product_id'], store=store)
        return ProductVariant.objects.filter(product=product)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_products(request, store_slug):
    """Отримання товарів магазину для публічного доступу"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    products = Product.objects.filter(store=store, is_active=True)
    
    # Фільтрація
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    # Пошук
    search = request.GET.get('search')
    if search:
        products = products.filter(name__icontains=search)
    
    # Сортування
    ordering = request.GET.get('ordering', '-created_at')
    products = products.order_by(ordering)
    
    serializer = ProductPublicSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_by_slug(request, store_slug, product_slug):
    """Отримання товару за slug для публічного доступу"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    product = get_object_or_404(Product, store=store, slug=product_slug, is_active=True)
    serializer = ProductPublicSerializer(product)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_product_status(request, store_id, product_id):
    """Перемикання статусу товару"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    product = get_object_or_404(Product, id=product_id, store=store)
    product.is_active = not product.is_active
    product.save()
    
    return Response({
        'message': f'Товар {"активовано" if product.is_active else "деактивовано"}',
        'is_active': product.is_active
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def top_products(request):
    """Отримання топ товарів користувача"""
    user_stores = Store.objects.filter(owner=request.user)
    limit = int(request.GET.get('limit', 5))
    
    from django.db.models import Count
    from orders.models import OrderItem
    
    # Топ товари за кількістю замовлень
    top_products = Product.objects.filter(
        store__in=user_stores,
        is_active=True
    ).annotate(
        order_count=Count('orderitem')
    ).order_by('-order_count')[:limit]
    
    serializer = ProductSerializer(top_products, many=True, context={'request': request})
    return Response(serializer.data) 