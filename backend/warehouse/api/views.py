from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from warehouse.models import Inventory, InventoryItem
from products.models import Product
from warehouse.api.serializers import InventorySerializer, InventoryItemSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scan_product_for_inventory(request, inventory_id):
    """Сканування товару для інвентаризації по штрихкоду або QR коду"""
    inventory = get_object_or_404(Inventory, id=inventory_id)
    
    # Перевіряємо права доступу
    if not (request.user == inventory.responsible_person or 
            request.user == inventory.created_by or 
            request.user.is_staff):
        return Response({
            'error': 'Недостатньо прав для виконання цієї дії'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Перевіряємо статус інвентаризації
    if inventory.status not in ['draft', 'in_progress']:
        return Response({
            'error': 'Інвентаризація повинна бути в статусі "Чернетка" або "В процесі"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    code = request.data.get('code')
    actual_quantity = request.data.get('actual_quantity')
    
    if not code:
        return Response({
            'error': 'Параметр code є обов\'язковим'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if actual_quantity is None:
        return Response({
            'error': 'Параметр actual_quantity є обов\'язковим'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        actual_quantity = float(actual_quantity)
        if actual_quantity < 0:
            raise ValueError()
    except (ValueError, TypeError):
        return Response({
            'error': 'actual_quantity повинно бути невід\'ємним числом'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Шукаємо товар по коду
    try:
        product = Product.objects.get(
            Q(barcode=code) | Q(qr_code=code),
            is_active=True
        )
        
        # Визначаємо тип сканування
        scan_method = 'barcode' if product.barcode == code else 'qr_code'
        scanned_barcode = code if scan_method == 'barcode' else ''
        scanned_qr_code = code if scan_method == 'qr_code' else ''
        
    except Product.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Товар з таким кодом не знайдено'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Отримуємо основне фасування товару
    packaging = product.packagings.filter(is_default=True).first()
    if not packaging:
        return Response({
            'error': 'У товару відсутнє основне фасування'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Шукаємо або створюємо позицію інвентаризації
    inventory_item, created = InventoryItem.objects.get_or_create(
        inventory=inventory,
        product=product,
        packaging=packaging,
        defaults={
            'expected_quantity': 0,
            'actual_quantity': actual_quantity,
            'scanned_barcode': scanned_barcode,
            'scanned_qr_code': scanned_qr_code,
            'scan_method': scan_method,
            'counted_by': request.user,
            'counted_at': timezone.now()
        }
    )
    
    if not created:
        # Оновлюємо існуючу позицію
        inventory_item.actual_quantity = actual_quantity
        inventory_item.scanned_barcode = scanned_barcode
        inventory_item.scanned_qr_code = scanned_qr_code
        inventory_item.scan_method = scan_method
        inventory_item.counted_by = request.user
        inventory_item.counted_at = timezone.now()
        inventory_item.save()
    
    # Розраховуємо розбіжності
    inventory_item.calculate_discrepancies()
    
    # Оновлюємо статус інвентаризації на "В процесі"
    if inventory.status == 'draft':
        inventory.status = 'in_progress'
        inventory.save(update_fields=['status'])
    
    serializer = InventoryItemSerializer(inventory_item)
    
    return Response({
        'success': True,
        'created': created,
        'scan_method': scan_method,
        'inventory_item': serializer.data,
        'message': 'Товар успішно відсканований та додано до інвентаризації' if created 
                  else 'Дані товару оновлено в інвентаризації'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def inventory_scan_summary(request, inventory_id):
    """Підсумки сканування для інвентаризації"""
    inventory = get_object_or_404(Inventory, id=inventory_id)
    
    # Перевіряємо права доступу
    if not (request.user == inventory.responsible_person or 
            request.user == inventory.created_by or 
            request.user.is_staff):
        return Response({
            'error': 'Недостатньо прав для виконання цієї дії'
        }, status=status.HTTP_403_FORBIDDEN)
    
    items = inventory.inventory_items.all()
    
    summary = {
        'total_items': items.count(),
        'scanned_items': items.filter(scan_method__in=['barcode', 'qr_code']).count(),
        'manual_items': items.filter(scan_method='manual').count(),
        'barcode_scans': items.filter(scan_method='barcode').count(),
        'qr_code_scans': items.filter(scan_method='qr_code').count(),
        'items_with_discrepancies': items.filter(
            Q(shortage_quantity__gt=0) | Q(surplus_quantity__gt=0)
        ).count(),
        'scanning_methods': {
            'barcode': items.filter(scan_method='barcode').count(),
            'qr_code': items.filter(scan_method='qr_code').count(),
            'manual': items.filter(scan_method='manual').count(),
        }
    }
    
    return Response({
        'inventory': {
            'id': inventory.id,
            'number': inventory.number,
            'status': inventory.status,
            'warehouse': inventory.warehouse.name
        },
        'summary': summary
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_scan_products(request, inventory_id):
    """Масове сканування товарів для інвентаризації"""
    inventory = get_object_or_404(Inventory, id=inventory_id)
    
    # Перевіряємо права доступу
    if not (request.user == inventory.responsible_person or 
            request.user == inventory.created_by or 
            request.user.is_staff):
        return Response({
            'error': 'Недостатньо прав для виконання цієї дії'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Перевіряємо статус інвентаризації
    if inventory.status not in ['draft', 'in_progress']:
        return Response({
            'error': 'Інвентаризація повинна бути в статусі "Чернетка" або "В процесі"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    scanned_items = request.data.get('items', [])
    
    if not scanned_items:
        return Response({
            'error': 'Список товарів для сканування не може бути порожнім'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    results = []
    errors = []
    
    for item_data in scanned_items:
        code = item_data.get('code')
        actual_quantity = item_data.get('actual_quantity')
        
        if not code or actual_quantity is None:
            errors.append({
                'item': item_data,
                'error': 'Відсутні обов\'язкові поля code або actual_quantity'
            })
            continue
        
        try:
            actual_quantity = float(actual_quantity)
            if actual_quantity < 0:
                raise ValueError()
        except (ValueError, TypeError):
            errors.append({
                'item': item_data,
                'error': 'actual_quantity повинно бути невід\'ємним числом'
            })
            continue
        
        # Шукаємо товар
        try:
            product = Product.objects.get(
                Q(barcode=code) | Q(qr_code=code),
                is_active=True
            )
            
            scan_method = 'barcode' if product.barcode == code else 'qr_code'
            scanned_barcode = code if scan_method == 'barcode' else ''
            scanned_qr_code = code if scan_method == 'qr_code' else ''
            
            # Отримуємо основне фасування
            packaging = product.packagings.filter(is_default=True).first()
            if not packaging:
                errors.append({
                    'item': item_data,
                    'error': f'У товару {product.name} відсутнє основне фасування'
                })
                continue
            
            # Створюємо або оновлюємо позицію
            inventory_item, created = InventoryItem.objects.get_or_create(
                inventory=inventory,
                product=product,
                packaging=packaging,
                defaults={
                    'expected_quantity': 0,
                    'actual_quantity': actual_quantity,
                    'scanned_barcode': scanned_barcode,
                    'scanned_qr_code': scanned_qr_code,
                    'scan_method': scan_method,
                    'counted_by': request.user,
                    'counted_at': timezone.now()
                }
            )
            
            if not created:
                inventory_item.actual_quantity = actual_quantity
                inventory_item.scanned_barcode = scanned_barcode
                inventory_item.scanned_qr_code = scanned_qr_code
                inventory_item.scan_method = scan_method
                inventory_item.counted_by = request.user
                inventory_item.counted_at = timezone.now()
                inventory_item.save()
            
            inventory_item.calculate_discrepancies()
            
            results.append({
                'code': code,
                'product_name': product.name,
                'scan_method': scan_method,
                'created': created,
                'actual_quantity': actual_quantity
            })
            
        except Product.DoesNotExist:
            errors.append({
                'item': item_data,
                'error': f'Товар з кодом {code} не знайдено'
            })
    
    # Оновлюємо статус інвентаризації
    if inventory.status == 'draft' and results:
        inventory.status = 'in_progress'
        inventory.save(update_fields=['status'])
    
    return Response({
        'success': True,
        'processed': len(results),
        'errors_count': len(errors),
        'results': results,
        'errors': errors,
        'message': f'Оброблено {len(results)} товарів, {len(errors)} помилок'
    })