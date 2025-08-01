"""
API views для управління Feature Flags
"""

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from stores.models import Store
from .feature_flags import feature_flags


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_feature_flags(request):
    """Отримати всі feature flags для поточного користувача"""
    
    flags = feature_flags.get_enabled_flags(user=request.user)
    
    # Додаємо детальну інформацію про кожен flag
    detailed_flags = {}
    for flag_name, enabled in flags.items():
        flag_config = feature_flags._get_flag_config(flag_name)
        if flag_config:
            detailed_flags[flag_name] = {
                'enabled': enabled,
                'description': flag_config.get('description', ''),
                'requires_subscription': flag_config.get('requires_subscription', False),
                'user_types': flag_config.get('user_types', [])
            }
    
    return Response({
        'user_subscription_type': feature_flags.get_user_subscription_type(request.user),
        'feature_flags': detailed_flags
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_store_feature_flags(request, store_id):
    """Отримати feature flags для конкретного магазину"""
    
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    flags = feature_flags.get_enabled_flags(user=request.user, store=store)
    
    # Додаємо детальну інформацію
    detailed_flags = {}
    for flag_name, enabled in flags.items():
        flag_config = feature_flags._get_flag_config(flag_name)
        if flag_config:
            detailed_flags[flag_name] = {
                'enabled': enabled,
                'description': flag_config.get('description', ''),
                'requires_subscription': flag_config.get('requires_subscription', False),
                'user_types': flag_config.get('user_types', [])
            }
    
    return Response({
        'store_id': store.id,
        'store_name': store.name,
        'user_subscription_type': feature_flags.get_user_subscription_type(request.user),
        'feature_flags': detailed_flags
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_feature_flag(request):
    """Перевірити конкретний feature flag"""
    
    flag_name = request.data.get('flag_name')
    store_id = request.data.get('store_id')
    
    if not flag_name:
        return Response(
            {'error': 'flag_name is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    store = None
    if store_id:
        store = get_object_or_404(Store, id=store_id, owner=request.user)
    
    enabled = feature_flags.is_enabled(flag_name, user=request.user, store=store)
    flag_config = feature_flags._get_flag_config(flag_name)
    
    if not flag_config:
        return Response(
            {'error': f'Feature flag "{flag_name}" not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response({
        'flag_name': flag_name,
        'enabled': enabled,
        'description': flag_config.get('description', ''),
        'requires_subscription': flag_config.get('requires_subscription', False),
        'user_types': flag_config.get('user_types', []),
        'user_subscription_type': feature_flags.get_user_subscription_type(request.user)
    })


# Адміністративні endpoints (тільки для суперюзерів)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_enable_flag(request):
    """Тимчасово увімкнути feature flag (тільки для суперюзерів)"""
    
    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flag_name = request.data.get('flag_name')
    user_id = request.data.get('user_id')
    store_id = request.data.get('store_id')
    
    if not flag_name:
        return Response(
            {'error': 'flag_name is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Отримуємо об'єкти якщо передані ID
    user = None
    store = None
    
    if user_id:
        from accounts.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    if store_id:
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response(
                {'error': 'Store not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Увімкнути flag
    feature_flags.enable_flag(flag_name, user=user, store=store)
    
    return Response({
        'message': f'Feature flag "{flag_name}" temporarily enabled',
        'flag_name': flag_name,
        'user_id': user_id,
        'store_id': store_id
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_disable_flag(request):
    """Тимчасово вимкнути feature flag (тільки для суперюзерів)"""
    
    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flag_name = request.data.get('flag_name')
    user_id = request.data.get('user_id')
    store_id = request.data.get('store_id')
    
    if not flag_name:
        return Response(
            {'error': 'flag_name is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Отримуємо об'єкти якщо передані ID
    user = None
    store = None
    
    if user_id:
        from accounts.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    if store_id:
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response(
                {'error': 'Store not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Вимкнути flag
    feature_flags.disable_flag(flag_name, user=user, store=store)
    
    return Response({
        'message': f'Feature flag "{flag_name}" temporarily disabled',
        'flag_name': flag_name,
        'user_id': user_id,
        'store_id': store_id
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def admin_clear_flag_cache(request):
    """Очистити кеш feature flags (тільки для суперюзерів)"""
    
    if not request.user.is_superuser:
        return Response(
            {'error': 'Admin access required'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    flag_name = request.data.get('flag_name')
    user_id = request.data.get('user_id')
    store_id = request.data.get('store_id')
    
    # Отримуємо об'єкти якщо передані ID
    user = None
    store = None
    
    if user_id:
        from accounts.models import User
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    if store_id:
        try:
            store = Store.objects.get(id=store_id)
        except Store.DoesNotExist:
            return Response(
                {'error': 'Store not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    # Очистити кеш
    feature_flags.clear_cache(flag_name=flag_name, user=user, store=store)
    
    return Response({
        'message': 'Feature flags cache cleared successfully',
        'flag_name': flag_name,
        'user_id': user_id,
        'store_id': store_id
    })