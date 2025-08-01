from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import models
from decimal import Decimal

from stores.models import Store
from .models import PriceList, PriceListItem, BulkPriceUpdate, PriceHistory
from .serializers import (
    PriceListSerializer, PriceListCreateSerializer, PriceListSummarySerializer,
    PriceListItemSerializer, PriceListItemCreateSerializer,
    BulkPriceUpdateSerializer, PriceHistorySerializer
)


class PriceListListCreateView(generics.ListCreateAPIView):
    """View для управління прайс-листами магазину"""
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['pricing_strategy', 'is_active', 'is_default']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'items_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return PriceList.objects.filter(store=store)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PriceListCreateSerializer
        # Для списку використовуємо спрощений серіалізатор
        if self.request.query_params.get('summary', '').lower() == 'true':
            return PriceListSummarySerializer
        return PriceListSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['store'] = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return context


class PriceListDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремим прайс-листом"""
    
    serializer_class = PriceListSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        return PriceList.objects.filter(store=store)


class PriceListItemListCreateView(generics.ListCreateAPIView):
    """View для управління позиціями прайс-листа"""
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['markup_type', 'cost_calculation_method', 'is_manual_override', 'category']
    search_fields = ['product__name', 'product__sku']
    ordering_fields = ['final_price', 'profit_margin', 'product__name', 'created_at']
    ordering = ['product__name']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        price_list = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return PriceListItem.objects.filter(price_list=price_list).select_related('product', 'category')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PriceListItemCreateSerializer
        return PriceListItemSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        context['price_list'] = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return context


class PriceListItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View для управління окремою позицією прайс-листа"""
    
    serializer_class = PriceListItemSerializer
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        price_list = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return PriceListItem.objects.filter(price_list=price_list)


class BulkPriceUpdateListCreateView(generics.ListCreateAPIView):
    """View для управління масовими оновленнями цін"""
    
    serializer_class = BulkPriceUpdateSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['update_type', 'adjustment_type', 'is_executed']
    ordering_fields = ['created_at', 'executed_at', 'affected_items_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        price_list = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return BulkPriceUpdate.objects.filter(price_list=price_list)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        context['price_list'] = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return context


class PriceHistoryListView(generics.ListAPIView):
    """View для перегляду історії зміни цін"""
    
    serializer_class = PriceHistorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['change_reason', 'bulk_update']
    search_fields = ['price_list_item__product__name', 'notes']
    ordering_fields = ['changed_at']
    ordering = ['-changed_at']
    
    def get_queryset(self):
        store = get_object_or_404(Store, id=self.kwargs['store_id'], owner=self.request.user)
        price_list = get_object_or_404(PriceList, id=self.kwargs['pricelist_id'], store=store)
        return PriceHistory.objects.filter(
            price_list_item__price_list=price_list
        ).select_related('price_list_item__product', 'changed_by')


@api_view(['POST'])
def execute_bulk_update(request, store_id, pricelist_id, bulk_update_id):
    """Виконання масового оновлення цін"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    price_list = get_object_or_404(PriceList, id=pricelist_id, store=store)
    bulk_update = get_object_or_404(BulkPriceUpdate, id=bulk_update_id, price_list=price_list)
    
    if bulk_update.is_executed:
        return Response(
            {'error': 'Це оновлення вже було виконано'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Отримуємо позиції для оновлення
    items_query = PriceListItem.objects.filter(price_list=price_list)
    
    # Застосовуємо фільтри
    if bulk_update.update_type == 'by_category':
        if bulk_update.categories.exists():
            items_query = items_query.filter(category__in=bulk_update.categories.all())
    elif bulk_update.update_type == 'by_selection':
        if bulk_update.selected_products.exists():
            items_query = items_query.filter(product__in=bulk_update.selected_products.all())
    elif bulk_update.update_type == 'price_range':
        if bulk_update.min_current_price:
            items_query = items_query.filter(final_price__gte=bulk_update.min_current_price)
        if bulk_update.max_current_price:
            items_query = items_query.filter(final_price__lte=bulk_update.max_current_price)
    
    # Виключаємо позиції з автооновлення якщо потрібно
    items_query = items_query.filter(exclude_from_auto_update=False)
    
    affected_count = 0
    log_entries = []
    
    try:
        for item in items_query:
            old_price = item.final_price
            
            # Застосовуємо оновлення
            if bulk_update.adjustment_type == 'percentage':
                if bulk_update.adjustment_value >= 0:
                    new_price = old_price * (1 + bulk_update.adjustment_value / 100)
                else:
                    new_price = old_price * (1 + bulk_update.adjustment_value / 100)
            elif bulk_update.adjustment_type == 'fixed_amount':
                new_price = old_price + bulk_update.adjustment_value
            elif bulk_update.adjustment_type == 'set_price':
                new_price = bulk_update.adjustment_value
            elif bulk_update.adjustment_type == 'set_markup':
                if item.current_cost:
                    new_price = item.current_cost * (1 + bulk_update.adjustment_value / 100)
                else:
                    continue
            else:
                continue
            
            # Перевіряємо мін/макс обмеження
            if item.min_price and new_price < item.min_price:
                new_price = item.min_price
            if item.max_price and new_price > item.max_price:
                new_price = item.max_price
            
            # Оновлюємо позицію
            if abs(new_price - old_price) > Decimal('0.01'):  # Оновлюємо тільки якщо є значна різниця
                item.manual_price = new_price
                item.final_price = new_price
                item.is_manual_override = True
                item.last_price_update = timezone.now()
                item.save()
                
                # Створюємо запис в історії
                PriceHistory.objects.create(
                    price_list_item=item,
                    old_price=old_price,
                    new_price=new_price,
                    change_reason='bulk_update',
                    bulk_update=bulk_update,
                    changed_by=request.user,
                    notes=f'Масове оновлення: {bulk_update.name}'
                )
                
                affected_count += 1
                log_entries.append(f'{item.product.name}: {old_price} → {new_price}')
        
        # Оновлюємо статус масового оновлення
        bulk_update.is_executed = True
        bulk_update.executed_at = timezone.now()
        bulk_update.affected_items_count = affected_count
        bulk_update.execution_log = '\n'.join(log_entries[:100])  # Обмежуємо розмір логу
        bulk_update.save()
        
        return Response({
            'message': f'Масове оновлення виконано успішно. Оновлено {affected_count} позицій.',
            'affected_items_count': affected_count
        })
        
    except Exception as e:
        return Response(
            {'error': f'Помилка при виконанні масового оновлення: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def sync_costs_from_warehouse(request, store_id, pricelist_id):
    """Синхронізація собівартості з warehouse системи"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    price_list = get_object_or_404(PriceList, id=pricelist_id, store=store)
    
    updated_count = 0
    items = PriceListItem.objects.filter(
        price_list=price_list,
        cost_calculation_method='auto',
        exclude_from_auto_update=False
    )
    
    try:
        for item in items:
            # Отримуємо актуальну собівартість з warehouse
            new_cost = item.product.get_average_cost()
            
            if new_cost and new_cost != item.calculated_cost:
                old_cost = item.calculated_cost
                item.calculated_cost = new_cost
                item.last_cost_update = timezone.now()
                
                # Пересчитуємо ціну якщо не встановлена вручну
                if not item.is_manual_override:
                    old_price = item.final_price
                    new_price = item.calculate_price()
                    if new_price:
                        item.calculated_price = new_price
                        item.final_price = new_price
                        item.last_price_update = timezone.now()
                        
                        # Створюємо запис в історії
                        PriceHistory.objects.create(
                            price_list_item=item,
                            old_cost=old_cost,
                            new_cost=new_cost,
                            old_price=old_price,
                            new_price=new_price,
                            change_reason='cost_update',
                            changed_by=request.user,
                            notes='Автоматична синхронізація з warehouse'
                        )
                
                item.save()
                updated_count += 1
        
        # Оновлюємо час останньої синхронізації
        price_list.last_cost_sync = timezone.now()
        price_list.save()
        
        return Response({
            'message': f'Синхронізація завершена. Оновлено {updated_count} позицій.',
            'updated_items_count': updated_count
        })
        
    except Exception as e:
        return Response(
            {'error': f'Помилка при синхронізації: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def pricelist_analytics(request, store_id, pricelist_id):
    """Аналітика прайс-листа"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    price_list = get_object_or_404(PriceList, id=pricelist_id, store=store)
    
    items = PriceListItem.objects.filter(price_list=price_list)
    
    # Базова статистика
    total_items = items.count()
    avg_profit_margin = items.aggregate(avg_margin=models.Avg('profit_margin'))['avg_margin'] or Decimal('0')
    total_cost_value = sum(item.current_cost * Decimal('1') for item in items if item.current_cost)
    total_sale_value = sum(item.final_price * Decimal('1') for item in items if item.final_price)
    
    # Статистика по типам націнки
    markup_stats = {}
    for markup_type, _ in PriceListItem.MARKUP_TYPE_CHOICES:
        count = items.filter(markup_type=markup_type).count()
        markup_stats[markup_type] = count
    
    # Статистика по рентабельності
    profitability_ranges = {
        'low': items.filter(profit_margin__lt=10).count(),
        'medium': items.filter(profit_margin__gte=10, profit_margin__lt=30).count(),
        'high': items.filter(profit_margin__gte=30).count(),
    }
    
    return Response({
        'total_items': total_items,
        'average_profit_margin': avg_profit_margin,
        'total_cost_value': total_cost_value,
        'total_sale_value': total_sale_value,
        'markup_type_distribution': markup_stats,
        'profitability_distribution': profitability_ranges,
        'last_sync': price_list.last_cost_sync,
    })


@api_view(['POST'])
def copy_pricelist(request, store_id, pricelist_id):
    """Копіювання прайс-листа"""
    store = get_object_or_404(Store, id=store_id, owner=request.user)
    source_pricelist = get_object_or_404(PriceList, id=pricelist_id, store=store)
    
    new_name = request.data.get('name')
    if not new_name:
        return Response(
            {'error': 'Необхідно вказати назву нового прайс-листа'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Перевіряємо унікальність назви
    if PriceList.objects.filter(store=store, name=new_name).exists():
        return Response(
            {'error': 'Прайс-лист з такою назвою вже існує'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Створюємо копію прайс-листа
        new_pricelist = PriceList.objects.create(
            store=store,
            name=new_name,
            description=f'Копія {source_pricelist.name}',
            pricing_strategy=source_pricelist.pricing_strategy,
            default_markup_percentage=source_pricelist.default_markup_percentage,
            default_markup_amount=source_pricelist.default_markup_amount,
            auto_update_from_cost=source_pricelist.auto_update_from_cost,
            update_frequency=source_pricelist.update_frequency,
            created_by=request.user
        )
        
        # Копіюємо всі позиції
        source_items = PriceListItem.objects.filter(price_list=source_pricelist)
        copied_items = []
        
        for item in source_items:
            copied_item = PriceListItem(
                price_list=new_pricelist,
                product=item.product,
                category=item.category,
                cost_calculation_method=item.cost_calculation_method,
                manual_cost=item.manual_cost,
                calculated_cost=item.calculated_cost,
                markup_type=item.markup_type,
                markup_value=item.markup_value,
                markup_formula=item.markup_formula,
                calculated_price=item.calculated_price,
                manual_price=item.manual_price,
                final_price=item.final_price,
                min_price=item.min_price,
                max_price=item.max_price,
                is_manual_override=item.is_manual_override,
                exclude_from_auto_update=item.exclude_from_auto_update
            )
            copied_items.append(copied_item)
        
        PriceListItem.objects.bulk_create(copied_items)
        
        return Response({
            'message': f'Прайс-лист "{new_name}" успішно створено',
            'pricelist_id': str(new_pricelist.id),
            'items_copied': len(copied_items)
        })
        
    except Exception as e:
        return Response(
            {'error': f'Помилка при копіюванні: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )