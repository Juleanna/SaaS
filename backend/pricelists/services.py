from django.db import models, transaction
from django.utils import timezone
from decimal import Decimal
from typing import List, Dict, Optional, Tuple
import pandas as pd
import io
import logging

from .models import PriceList, PriceListItem, BulkPriceUpdate, PriceHistory
from products.models import Product, Category
from warehouse.services import CostCalculationService
from warehouse.models import CostingMethod, Warehouse, Packaging

logger = logging.getLogger(__name__)


class PriceListService:
    """Сервіс для управління прайс-листами та ціноутворенням"""
    
    def __init__(self):
        self.cost_service = CostCalculationService()
    
    def create_price_list_from_products(
        self, 
        store, 
        name: str, 
        user,
        products: Optional[List[Product]] = None,
        categories: Optional[List[Category]] = None,
        pricing_strategy: str = 'cost_plus_markup',
        default_markup: Decimal = Decimal('20.00')
    ) -> PriceList:
        """Створення прайс-листа з існуючих товарів"""
        
        with transaction.atomic():
            # Створюємо прайс-лист
            price_list = PriceList.objects.create(
                store=store,
                name=name,
                pricing_strategy=pricing_strategy,
                default_markup_percentage=default_markup,
                created_by=user
            )
            
            # Визначаємо товари для додавання
            if products:
                products_to_add = products
            elif categories:
                products_to_add = Product.objects.filter(
                    store=store,
                    category__in=categories,
                    is_active=True
                ).distinct()
            else:
                products_to_add = Product.objects.filter(
                    store=store,
                    is_active=True
                )
            
            # Додаємо товари до прайс-листа
            for product in products_to_add:
                self.add_product_to_price_list(price_list, product)
            
            logger.info(f"Created price list '{name}' with {products_to_add.count()} products")
            return price_list
    
    def add_product_to_price_list(
        self, 
        price_list: PriceList, 
        product: Product,
        markup_type: str = 'percentage',
        markup_value: Optional[Decimal] = None
    ) -> PriceListItem:
        """Додавання товару до прайс-листа"""
        
        # Використовуємо націнку за замовчуванням якщо не вказана
        if markup_value is None:
            markup_value = price_list.default_markup_percentage
        
        # Розраховуємо собівартість
        calculated_cost = self.calculate_product_cost(product, price_list.store)
        
        # Створюємо позицію прайс-листа
        item = PriceListItem.objects.create(
            price_list=price_list,
            product=product,
            category=product.category,
            cost_calculation_method='auto',
            calculated_cost=calculated_cost,
            markup_type=markup_type,
            markup_value=markup_value
        )
        
        return item
    
    def calculate_product_cost(
        self, 
        product: Product, 
        store,
        warehouse: Optional[Warehouse] = None,
        costing_method: Optional[str] = None
    ) -> Decimal:
        """Розрахунок собівартості товару через warehouse систему"""
        
        try:
            # Визначаємо склад
            if not warehouse:
                warehouse = Warehouse.objects.filter(
                    # Тут потрібно додати зв'язок між Store та Warehouse
                    is_active=True
                ).first()
            
            if not warehouse:
                logger.warning(f"No warehouse found for product {product.id}")
                return product.base_cost or Decimal('0')
            
            # Отримуємо основне фасування
            packaging = product.packagings.filter(is_default=True).first()
            if not packaging:
                packaging = Packaging.objects.filter(
                    unit__short_name='шт'
                ).first()
            
            if not packaging:
                logger.warning(f"No packaging found for product {product.id}")
                return product.base_cost or Decimal('0')
            
            # Визначаємо метод розрахунку собівартості
            if not costing_method:
                costing_method_obj = product.costing_method
                if not costing_method_obj:
                    costing_method_obj = CostingMethod.objects.filter(
                        is_default=True
                    ).first()
                
                if costing_method_obj:
                    costing_method = costing_method_obj.method
                else:
                    costing_method = 'average'
            
            # Розраховуємо собівартість через warehouse сервіс
            if costing_method == 'fifo':
                cost, _ = self.cost_service.calculate_fifo_cost(
                    warehouse, product, packaging, Decimal('1')
                )
            elif costing_method == 'lifo':
                cost, _ = self.cost_service.calculate_lifo_cost(
                    warehouse, product, packaging, Decimal('1')
                )
            elif costing_method == 'average':
                cost = self.cost_service.calculate_average_cost(
                    warehouse, product, packaging
                )
            else:
                cost = product.base_cost or Decimal('0')
            
            return cost
            
        except Exception as e:
            logger.error(f"Error calculating cost for product {product.id}: {e}")
            return product.base_cost or Decimal('0')
    
    def update_costs_from_warehouse(
        self, 
        price_list: PriceList,
        products: Optional[List[Product]] = None
    ) -> Dict[str, int]:
        """Оновлення собівартості з warehouse системи"""
        
        items_query = price_list.items.filter(
            cost_calculation_method='auto',
            exclude_from_auto_update=False
        )
        
        if products:
            items_query = items_query.filter(product__in=products)
        
        updated_count = 0
        error_count = 0
        
        with transaction.atomic():
            for item in items_query:
                try:
                    old_cost = item.calculated_cost
                    new_cost = self.calculate_product_cost(
                        item.product, 
                        price_list.store
                    )
                    
                    if old_cost != new_cost:
                        item.calculated_cost = new_cost
                        item.last_cost_update = timezone.now()
                        item.save()
                        
                        # Записуємо в історію
                        PriceHistory.objects.create(
                            price_list_item=item,
                            old_cost=old_cost,
                            new_cost=new_cost,
                            old_price=item.final_price,
                            new_price=item.final_price,  # Ціна поки не змінилася
                            change_reason='cost_update',
                            changed_by=price_list.created_by  # Можна передати користувача
                        )
                        
                        updated_count += 1
                        
                except Exception as e:
                    logger.error(f"Error updating cost for item {item.id}: {e}")
                    error_count += 1
            
            # Оновлюємо дату синхронізації
            price_list.last_cost_sync = timezone.now()
            price_list.save(update_fields=['last_cost_sync'])
        
        return {
            'updated': updated_count,
            'errors': error_count,
            'total': items_query.count()
        }
    
    def apply_bulk_markup(
        self, 
        price_list: PriceList,
        user,
        markup_type: str = 'percentage',
        markup_value: Decimal = Decimal('0'),
        filters: Optional[Dict] = None
    ) -> BulkPriceUpdate:
        """Масове застосування націнки"""
        
        # Створюємо запис про масове оновлення
        bulk_update = BulkPriceUpdate.objects.create(
            price_list=price_list,
            name=f"Масова зміна націнки {markup_value}%",
            update_type='markup_adjustment',
            adjustment_type=markup_type,
            adjustment_value=markup_value,
            created_by=user
        )
        
        # Фільтруємо позиції
        items_query = price_list.items.filter(
            exclude_from_auto_update=False,
            is_manual_override=False
        )
        
        if filters:
            if 'categories' in filters:
                items_query = items_query.filter(category__in=filters['categories'])
            if 'min_price' in filters:
                items_query = items_query.filter(final_price__gte=filters['min_price'])
            if 'max_price' in filters:
                items_query = items_query.filter(final_price__lte=filters['max_price'])
            if 'products' in filters:
                items_query = items_query.filter(product__in=filters['products'])
        
        affected_count = 0
        log_entries = []
        
        with transaction.atomic():
            for item in items_query:
                try:
                    old_markup_value = item.markup_value
                    old_price = item.final_price
                    
                    # Застосовуємо нову націнку
                    if markup_type == 'set_markup':
                        item.markup_value = markup_value
                    elif markup_type == 'percentage':
                        # Збільшуємо поточну націнку на відсоток
                        item.markup_value = item.markup_value * (1 + markup_value / 100)
                    elif markup_type == 'fixed_amount':
                        # Додаємо фіксовану суму до націнки
                        item.markup_value = item.markup_value + markup_value
                    
                    # Перераховуємо ціну
                    item.save()
                    
                    # Записуємо в історію
                    PriceHistory.objects.create(
                        price_list_item=item,
                        old_cost=item.calculated_cost,
                        new_cost=item.calculated_cost,
                        old_price=old_price,
                        new_price=item.final_price,
                        change_reason='bulk_update',
                        bulk_update=bulk_update,
                        changed_by=user
                    )
                    
                    affected_count += 1
                    log_entries.append(
                        f"Product {item.product.name}: markup {old_markup_value} -> {item.markup_value}, "
                        f"price {old_price} -> {item.final_price}"
                    )
                    
                except Exception as e:
                    log_entries.append(f"Error updating {item.product.name}: {e}")
            
            # Оновлюємо інформацію про виконання
            bulk_update.is_executed = True
            bulk_update.executed_at = timezone.now()
            bulk_update.affected_items_count = affected_count
            bulk_update.execution_log = '\n'.join(log_entries)
            bulk_update.save()
        
        return bulk_update
    
    def sync_prices_to_products(
        self, 
        price_list: PriceList,
        update_only_changed: bool = True
    ) -> Dict[str, int]:
        """Синхронізація цін з прайс-листа до товарів"""
        
        updated_count = 0
        
        with transaction.atomic():
            for item in price_list.items.all():
                product = item.product
                
                # Перевіряємо чи потрібно оновлювати
                if update_only_changed and product.price == item.final_price:
                    continue
                
                # Оновлюємо ціну товару
                old_price = product.price
                product.price = item.final_price
                product.save(update_fields=['price'])
                
                # Оновлюємо час останнього оновлення ціни
                item.last_price_update = timezone.now()
                item.save(update_fields=['last_price_update'])
                
                updated_count += 1
                
                logger.info(f"Updated product {product.name} price: {old_price} -> {item.final_price}")
        
        return {'updated': updated_count}
    
    def validate_price_list(self, price_list: PriceList) -> Dict[str, List[str]]:
        """Валідація прайс-листа на наявність помилок"""
        
        errors = []
        warnings = []
        
        # Перевіряємо чи є позиції без собівартості
        items_without_cost = price_list.items.filter(
            models.Q(calculated_cost__isnull=True) | models.Q(calculated_cost=0)
        )
        if items_without_cost.exists():
            warnings.append(
                f"Знайдено {items_without_cost.count()} позицій без собівартості"
            )
        
        # Перевіряємо чи є позиції з від'ємною рентабельністю
        negative_margin_items = []
        for item in price_list.items.all():
            if item.current_cost and item.final_price < item.current_cost:
                negative_margin_items.append(item.product.name)
        
        if negative_margin_items:
            warnings.append(
                f"Збиткові товари: {', '.join(negative_margin_items[:5])}"
                + (f" та ще {len(negative_margin_items) - 5}" if len(negative_margin_items) > 5 else "")
            )
        
        # Перевіряємо дублікати товарів
        duplicate_products = price_list.items.values('product').annotate(
            count=models.Count('product')
        ).filter(count__gt=1)
        
        if duplicate_products.exists():
            errors.append("Знайдено дублікати товарів в прайс-листі")
        
        return {
            'errors': errors,
            'warnings': warnings,
            'is_valid': len(errors) == 0
        }
    
    def get_price_comparison(
        self, 
        price_list1: PriceList, 
        price_list2: PriceList
    ) -> Dict:
        """Порівняння двох прайс-листів"""
        
        # Отримуємо товари що є в обох прайс-листах
        products1 = set(price_list1.items.values_list('product_id', flat=True))
        products2 = set(price_list2.items.values_list('product_id', flat=True))
        
        common_products = products1.intersection(products2)
        only_in_first = products1 - products2
        only_in_second = products2 - products1
        
        price_differences = []
        
        for product_id in common_products:
            item1 = price_list1.items.get(product_id=product_id)
            item2 = price_list2.items.get(product_id=product_id)
            
            if item1.final_price != item2.final_price:
                price_differences.append({
                    'product': item1.product.name,
                    'price1': item1.final_price,
                    'price2': item2.final_price,
                    'difference': item2.final_price - item1.final_price,
                    'difference_percentage': (
                        (item2.final_price - item1.final_price) / item1.final_price * 100
                        if item1.final_price > 0 else 0
                    )
                })
        
        return {
            'common_products': len(common_products),
            'only_in_first': len(only_in_first),
            'only_in_second': len(only_in_second),
            'price_differences': price_differences,
            'total_differences': len(price_differences)
        }
    
    def get_profitability_analysis(self, price_list: PriceList) -> Dict:
        """Аналіз рентабельності прайс-листа"""
        
        items_with_cost = price_list.items.exclude(
            models.Q(calculated_cost__isnull=True) | models.Q(calculated_cost=0)
        )
        
        if not items_with_cost.exists():
            return {'error': 'Немає товарів з розрахованою собівартістю'}
        
        margins = []
        total_cost = Decimal('0')
        total_price = Decimal('0')
        
        for item in items_with_cost:
            if item.current_cost and item.final_price:
                margin = item.profit_margin
                margins.append(margin)
                total_cost += item.current_cost
                total_price += item.final_price
        
        if not margins:
            return {'error': 'Неможливо розрахувати рентабельність'}
        
        # Розрахунки
        average_margin = sum(margins) / len(margins)
        min_margin = min(margins)
        max_margin = max(margins)
        overall_margin = ((total_price - total_cost) / total_cost * 100) if total_cost > 0 else 0
        
        # Категорії рентабельності
        high_margin = len([m for m in margins if m > 50])
        medium_margin = len([m for m in margins if 20 <= m <= 50])
        low_margin = len([m for m in margins if 0 <= m < 20])
        negative_margin = len([m for m in margins if m < 0])
        
        return {
            'total_items': len(margins),
            'average_margin': round(average_margin, 2),
            'min_margin': round(min_margin, 2),
            'max_margin': round(max_margin, 2),
            'overall_margin': round(overall_margin, 2),
            'margin_distribution': {
                'high_margin': high_margin,
                'medium_margin': medium_margin,
                'low_margin': low_margin,
                'negative_margin': negative_margin
            },
            'total_cost': total_cost,
            'total_price': total_price,
            'total_profit': total_price - total_cost
        }