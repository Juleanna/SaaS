from django.urls import path, include
from .views import (
    CategoryListCreateView, CategoryDetailView,
    ProductListCreateView, ProductDetailView, ProductPublicView,
    ProductImageListCreateView, ProductImageDetailView,
    ProductVariantListCreateView, ProductVariantDetailView,
    store_products, product_by_slug, toggle_product_status
)

urlpatterns = [
    # Категорії
    path('stores/<int:store_id>/categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('stores/<int:store_id>/categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    
    # Товари
    path('stores/<int:store_id>/products/', ProductListCreateView.as_view(), name='product-list-create'),
    path('stores/<int:store_id>/products/<int:pk>/', ProductDetailView.as_view(), name='product-detail'),
    path('stores/<int:store_id>/products/<int:product_id>/toggle-status/', toggle_product_status, name='toggle-product-status'),
    
    # Зображення товарів
    path('stores/<int:store_id>/products/<int:product_id>/images/', ProductImageListCreateView.as_view(), name='product-image-list-create'),
    path('stores/<int:store_id>/products/<int:product_id>/images/<int:pk>/', ProductImageDetailView.as_view(), name='product-image-detail'),
    
    # Варіанти товарів
    path('stores/<int:store_id>/products/<int:product_id>/variants/', ProductVariantListCreateView.as_view(), name='product-variant-list-create'),
    path('stores/<int:store_id>/products/<int:product_id>/variants/<int:pk>/', ProductVariantDetailView.as_view(), name='product-variant-detail'),
    
    # Публічні URL
    path('public/stores/<slug:store_slug>/products/', store_products, name='store-products'),
    path('public/stores/<slug:store_slug>/products/<slug:product_slug>/', product_by_slug, name='product-by-slug'),
    
    # API для роботи з кодами
    path('api/', include('products.api.urls')),
] 