from django.urls import path
from .views import (
    StoreListCreateView, StoreDetailView, StorePublicView,
    StoreBlockListCreateView, StoreBlockDetailView,
    StoreSocialLinkListCreateView, StoreSocialLinkDetailView,
    store_by_slug, toggle_store_status
)

urlpatterns = [
    # Основні URL для магазинів
    path('', StoreListCreateView.as_view(), name='store-list-create'),
    path('<int:pk>/', StoreDetailView.as_view(), name='store-detail'),
    path('public/<slug:slug>/', store_by_slug, name='store-by-slug'),
    path('<int:store_id>/toggle-status/', toggle_store_status, name='toggle-store-status'),
    
    # Блоки магазину
    path('<int:store_id>/blocks/', StoreBlockListCreateView.as_view(), name='store-block-list-create'),
    path('<int:store_id>/blocks/<int:pk>/', StoreBlockDetailView.as_view(), name='store-block-detail'),
    
    # Соціальні мережі магазину
    path('<int:store_id>/social-links/', StoreSocialLinkListCreateView.as_view(), name='store-social-link-list-create'),
    path('<int:store_id>/social-links/<int:pk>/', StoreSocialLinkDetailView.as_view(), name='store-social-link-detail'),
] 