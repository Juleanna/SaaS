from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .models import Store, StoreBlock, StoreSocialLink
from .serializers import (
    StoreSerializer, StoreCreateSerializer, StoreUpdateSerializer,
    StoreBlockSerializer, StoreBlockCreateSerializer,
    StoreSocialLinkSerializer, StoreSocialLinkCreateSerializer,
    StorePublicSerializer
)


class StoreListCreateView(generics.ListCreateAPIView):
    """View для створення та перегляду магазинів користувача"""
    
    def get_queryset(self):
        return Store.objects.filter(owner=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoreCreateSerializer
        return StoreSerializer
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class StoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для перегляду, оновлення та видалення магазину"""
    
    def get_queryset(self):
        return Store.objects.filter(owner=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return StoreUpdateSerializer
        return StoreSerializer


class StorePublicView(generics.RetrieveAPIView):
    """Публічний view для перегляду магазину"""
    
    queryset = Store.objects.filter(is_active=True)
    serializer_class = StorePublicSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class StoreBlockListCreateView(generics.ListCreateAPIView):
    """View для управління блоками магазину"""
    
    serializer_class = StoreBlockSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return StoreBlock.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoreBlockCreateSerializer
        return StoreBlockSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class StoreBlockDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим блоком магазину"""
    
    serializer_class = StoreBlockSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return StoreBlock.objects.filter(store=store)


class StoreSocialLinkListCreateView(generics.ListCreateAPIView):
    """View для управління соціальними мережами магазину"""
    
    serializer_class = StoreSocialLinkSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return StoreSocialLink.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StoreSocialLinkCreateSerializer
        return StoreSocialLinkSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class StoreSocialLinkDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремою соціальною мережею магазину"""
    
    serializer_class = StoreSocialLinkSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return StoreSocialLink.objects.filter(store=store)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def store_by_slug(request, slug):
    """Отримання магазину за slug"""
    store = get_object_or_404(Store, slug=slug, is_active=True)
    serializer = StorePublicSerializer(store)
    return Response(serializer.data)


@api_view(['POST'])
def toggle_store_status(request, store_id):
    """Перемикання статусу магазину"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    store.is_active = not store.is_active
    store.save()
    
    return Response({
        'message': f'Магазин {"активовано" if store.is_active else "деактивовано"}',
        'is_active': store.is_active
    }) 