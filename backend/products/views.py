from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from stores.models import Store
from stores.tenancy import StoreScopedMixin
from stores.permissions import IsStoreOwnerOrStaff
from .models import Category, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer, CategoryCreateSerializer, ProductSerializer, ProductCreateSerializer, ProductUpdateSerializer,
    ProductImageSerializer, ProductImageCreateSerializer,
    ProductVariantSerializer, ProductVariantCreateSerializer,
    ProductPublicSerializer
)


class CategoryListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """View ???>?? ???????????>?-?????? ????'????????-??????"""
    
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_queryset(self):
        return Category.objects.filter(store=self.store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CategoryCreateSerializer
        return CategorySerializer


class CategoryDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """View ???>?? ???????????>?-?????? ???????????? ????'????????-?"??"""
    
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_queryset(self):
        return self.filter_queryset_by_store(Category.objects.all())


class ProductListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """View ???>?? ???????????>?-?????? ?'??????????????"""
    
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return self.filter_queryset_by_store(Product.objects.all())
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductCreateSerializer
        return ProductSerializer


class ProductDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """View ???>?? ???????????>?-?????? ??????????? ?'????????????"""
    
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_queryset(self):
        return self.filter_queryset_by_store(Product.objects.all())
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return ProductUpdateSerializer
        return ProductSerializer


class ProductPublicView(generics.RetrieveAPIView):
    """?????+?>?-?????? view ???>?? ?????????>?????? ?'??????????"""
    
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductPublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class ProductImageListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """View ???>?? ???????????>?-?????? ����?+???��??? ?'??????????"""
    
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_product(self):
        return get_object_or_404(Product, id=self.kwargs['product_id'], store=self.store)
    
    def get_queryset(self):
        return ProductImage.objects.filter(product=self.get_product())
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductImageCreateSerializer
        return ProductImageSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['product'] = self.get_product()
        return context
    
    def perform_create(self, serializer):
        serializer.save(product=self.get_product())


class ProductImageDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """View ???>?? ???????????>?-?????? ??????????? ����?+???��??? ?'??????????"""
    
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_product(self):
        return get_object_or_404(Product, id=self.kwargs['product_id'], store=self.store)
    
    def get_queryset(self):
        return ProductImage.objects.filter(product=self.get_product())


class ProductVariantListCreateView(StoreScopedMixin, generics.ListCreateAPIView):
    """View ???>?? ???????????>?-?????? ???�??-???'??? ?'??????????"""
    
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_product(self):
        return get_object_or_404(Product, id=self.kwargs['product_id'], store=self.store)
    
    def get_queryset(self):
        return ProductVariant.objects.filter(product=self.get_product())
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductVariantCreateSerializer
        return ProductVariantSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['product'] = self.get_product()
        return context
    
    def perform_create(self, serializer):
        serializer.save(product=self.get_product())


class ProductVariantDetailView(StoreScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """View ???>?? ???????????>?-?????? ??????????? ???�??-???'?? ?'??????????"""
    
    serializer_class = ProductVariantSerializer
    permission_classes = [permissions.IsAuthenticated, IsStoreOwnerOrStaff]
    
    def get_product(self):
        return get_object_or_404(Product, id=self.kwargs['product_id'], store=self.store)
    
    def get_queryset(self):
        return ProductVariant.objects.filter(product=self.get_product())


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_products(request, store_slug):
    """???'????????????? ?'?????????-?? ??????????????? ???>?? ?????+?>?-????????? ???????'??????"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    products = Product.objects.filter(store=store, is_active=True)
    
    # ???-?>???'?????o-??
    category_id = request.GET.get('category')
    if category_id:
        products = products.filter(category_id=category_id)
    
    # ??????????
    search = request.GET.get('search')
    if search:
        products = products.filter(name__icontains=search)
    
    # ???????'????????????
    ordering = request.GET.get('ordering', '-created_at')
    products = products.order_by(ordering)
    
    serializer = ProductPublicSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def product_by_slug(request, store_slug, product_slug):
    """???'????????????? ?'?????????? ???? slug ???>?? ?????+?>?-????????? ???????'??????"""
    store = get_object_or_404(Store, slug=store_slug, is_active=True)
    product = get_object_or_404(Product, store=store, slug=product_slug, is_active=True)
    serializer = ProductPublicSerializer(product)
    return Response(serializer.data)
