from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from products.models import Product
from products.api.serializers import ProductSerializer


@api_view(['GET'])
def search_by_barcode(request):
    """Пошук товару по штрихкоду"""
    barcode = request.GET.get('barcode')
    
    if not barcode:
        return Response({
            'error': 'Параметр barcode є обов\'язковим'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        product = Product.objects.get(barcode=barcode, is_active=True)
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'success': True,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Товар з таким штрихкодом не знайдено'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def search_by_qr_code(request):
    """Пошук товару по QR коду"""
    qr_code = request.GET.get('qr_code')
    
    if not qr_code:
        return Response({
            'error': 'Параметр qr_code є обов\'язковим'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        product = Product.objects.get(qr_code=qr_code, is_active=True)
        serializer = ProductSerializer(product, context={'request': request})
        return Response({
            'success': True,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Товар з таким QR кодом не знайдено'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def search_by_code(request):
    """Універсальний пошук товару по штрихкоду або QR коду"""
    code = request.GET.get('code')
    
    if not code:
        return Response({
            'error': 'Параметр code є обов\'язковим'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Спочатку шукаємо по штрихкоду, потім по QR коду
    try:
        product = Product.objects.get(
            Q(barcode=code) | Q(qr_code=code),
            is_active=True
        )
        serializer = ProductSerializer(product, context={'request': request})
        
        # Визначаємо тип знайденого коду
        code_type = 'barcode' if product.barcode == code else 'qr_code'
        
        return Response({
            'success': True,
            'code_type': code_type,
            'product': serializer.data
        })
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Товар з таким кодом не знайдено'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def generate_barcode(request, product_id):
    """Генерація нового штрихкоду для товару"""
    product = get_object_or_404(Product, id=product_id)
    
    # Перевіряємо права доступу до товару
    if request.user != product.store.owner:
        return Response({
            'error': 'Недостатньо прав для виконання цієї дії'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Генеруємо новий штрихкод
        new_barcode = product.generate_barcode()
        product.barcode = new_barcode
        product.save(update_fields=['barcode'])
        
        return Response({
            'success': True,
            'barcode': new_barcode,
            'message': 'Штрихкод успішно згенеровано'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Помилка генерації штрихкоду: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def generate_qr_code(request, product_id):
    """Генерація нового QR коду для товару"""
    product = get_object_or_404(Product, id=product_id)
    
    # Перевіряємо права доступу до товару
    if request.user != product.store.owner:
        return Response({
            'error': 'Недостатньо прав для виконання цієї дії'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Генеруємо новий QR код
        new_qr_code = product.generate_qr_code()
        product.qr_code = new_qr_code
        product.save(update_fields=['qr_code'])
        
        return Response({
            'success': True,
            'qr_code': new_qr_code,
            'message': 'QR код успішно згенеровано'
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': f'Помилка генерації QR коду: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)