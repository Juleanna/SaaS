from django.db import transaction
from django.utils import timezone
from django.db.models import Sum, Q, F
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Optional, Tuple
from .models import (
    Warehouse, Stock, StockBatch, StockMovement, CostingMethod, 
    CostingRule, CostCalculation, Supply, SupplyItem
)


class CostCalculationService:
    """Сервіс для розрахунку собівартості товарів"""
    
    def __init__(self):
        self.precision = Decimal('0.01')  # Точність до копійок
    
    def get_costing_method(self, warehouse, product) -> CostingMethod:
        """Отримати метод розрахунку для конкретного товару та складу"""
        # Шукаємо правило для конкретного товару
        rule = CostingRule.objects.filter(
            warehouse=warehouse,
            product=product,
            is_active=True
        ).first()
        
        if rule:
            return rule.costing_method
        
        # Шукаємо правило для категорії товару
        if hasattr(product, 'category') and product.category:
            rule = CostingRule.objects.filter(
                warehouse=warehouse,
                category=product.category,
                is_active=True
            ).first()
            
            if rule:
                return rule.costing_method
        
        # Використовуємо метод за замовчуванням
        default_method = CostingMethod.objects.filter(
            is_default=True,
            is_active=True
        ).first()
        
        if default_method:
            return default_method
        
        # Якщо нічого не знайдено, використовуємо середньозважену
        method, _ = CostingMethod.objects.get_or_create(
            method='average',
            defaults={
                'name': 'Середньозважена собівартість',
                'is_default': True,
                'description': 'Автоматично створений метод за замовчуванням'
            }
        )
        return method
    
    def calculate_fifo_cost(self, warehouse, product, packaging, quantity: Decimal) -> Tuple[Decimal, List[Dict]]:
        """Розрахунок собівартості за методом FIFO"""
        batches = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('received_date', 'id')
        
        total_cost = Decimal('0')
        remaining_to_allocate = quantity
        used_batches = []
        
        for batch in batches:
            if remaining_to_allocate <= 0:
                break
            
            available_quantity = min(batch.remaining_quantity, remaining_to_allocate)
            batch_cost = available_quantity * batch.unit_cost
            
            used_batches.append({
                'batch': batch,
                'quantity_used': available_quantity,
                'unit_cost': batch.unit_cost,
                'total_cost': batch_cost
            })
            
            total_cost += batch_cost
            remaining_to_allocate -= available_quantity
        
        if remaining_to_allocate > 0:
            # Недостатньо товару на складі
            raise ValueError(f"Недостатньо товару на складі. Потрібно: {quantity}, доступно: {quantity - remaining_to_allocate}")
        
        average_cost = total_cost / quantity if quantity > 0 else Decimal('0')
        return average_cost.quantize(self.precision, rounding=ROUND_HALF_UP), used_batches
    
    def calculate_lifo_cost(self, warehouse, product, packaging, quantity: Decimal) -> Tuple[Decimal, List[Dict]]:
        """Розрахунок собівартості за методом LIFO"""
        batches = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            remaining_quantity__gt=0,
            is_active=True
        ).order_by('-received_date', '-id')  # Зворотний порядок для LIFO
        
        total_cost = Decimal('0')
        remaining_to_allocate = quantity
        used_batches = []
        
        for batch in batches:
            if remaining_to_allocate <= 0:
                break
            
            available_quantity = min(batch.remaining_quantity, remaining_to_allocate)
            batch_cost = available_quantity * batch.unit_cost
            
            used_batches.append({
                'batch': batch,
                'quantity_used': available_quantity,
                'unit_cost': batch.unit_cost,
                'total_cost': batch_cost
            })
            
            total_cost += batch_cost
            remaining_to_allocate -= available_quantity
        
        if remaining_to_allocate > 0:
            raise ValueError(f"Недостатньо товару на складі. Потрібно: {quantity}, доступно: {quantity - remaining_to_allocate}")
        
        average_cost = total_cost / quantity if quantity > 0 else Decimal('0')
        return average_cost.quantize(self.precision, rounding=ROUND_HALF_UP), used_batches
    
    def calculate_average_cost(self, warehouse, product, packaging) -> Decimal:
        """Розрахунок середньозваженої собівартості"""
        batches = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            remaining_quantity__gt=0,
            is_active=True
        )
        
        total_quantity = sum(batch.remaining_quantity for batch in batches)
        total_cost = sum(batch.remaining_quantity * batch.unit_cost for batch in batches)
        
        if total_quantity <= 0:
            return Decimal('0')
        
        average_cost = total_cost / total_quantity
        return average_cost.quantize(self.precision, rounding=ROUND_HALF_UP)
    
    def calculate_cost_by_method(self, warehouse, product, packaging, method: CostingMethod, quantity: Decimal = None) -> Dict:
        """Розрахунок собівартості за вказаним методом"""
        result = {
            'method': method.method,
            'unit_cost': Decimal('0'),
            'total_cost': Decimal('0'),
            'batches_used': [],
            'calculation_date': timezone.now()
        }
        
        if method.method == 'fifo':
            if quantity is None:
                raise ValueError("Для FIFO потрібно вказати кількість")
            unit_cost, batches = self.calculate_fifo_cost(warehouse, product, packaging, quantity)
            result['unit_cost'] = unit_cost
            result['total_cost'] = unit_cost * quantity
            result['batches_used'] = batches
            
        elif method.method == 'lifo':
            if quantity is None:
                raise ValueError("Для LIFO потрібно вказати кількість")
            unit_cost, batches = self.calculate_lifo_cost(warehouse, product, packaging, quantity)
            result['unit_cost'] = unit_cost
            result['total_cost'] = unit_cost * quantity
            result['batches_used'] = batches
            
        elif method.method == 'average':
            unit_cost = self.calculate_average_cost(warehouse, product, packaging)
            result['unit_cost'] = unit_cost
            if quantity:
                result['total_cost'] = unit_cost * quantity
            
        elif method.method == 'specific':
            # Для конкретної ідентифікації потрібно додаткові параметри
            # Поки що використовуємо середню собівартість
            unit_cost = self.calculate_average_cost(warehouse, product, packaging)
            result['unit_cost'] = unit_cost
            if quantity:
                result['total_cost'] = unit_cost * quantity
        
        return result
    
    @transaction.atomic
    def process_stock_movement(self, warehouse, product, packaging, movement_type: str, 
                             quantity: Decimal, user, reference_document: str = '', 
                             reference_id: int = None, supply_item: SupplyItem = None) -> StockMovement:
        """Обробка руху товарів з урахуванням партійного обліку"""
        
        movement = StockMovement.objects.create(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            movement_type=movement_type,
            quantity=quantity,
            reference_document=reference_document,
            reference_id=reference_id,
            movement_date=timezone.now(),
            created_by=user
        )
        
        if movement_type == 'in' and supply_item:
            # Надходження - створюємо нову партію
            self._create_batch_from_supply(supply_item, movement)
            
        elif movement_type in ['out', 'transfer_out', 'writeoff']:
            # Витрата - списуємо з існуючих партій
            self._process_outgoing_movement(warehouse, product, packaging, quantity, movement, user)
        
        # Оновлюємо загальні залишки
        self._update_stock_quantity(warehouse, product, packaging)
        
        return movement
    
    def _create_batch_from_supply(self, supply_item: SupplyItem, movement: StockMovement):
        """Створення партії з постачання"""
        batch_number = f"SUP-{supply_item.supply.number}-{supply_item.id}"
        
        batch = StockBatch.objects.create(
            warehouse=supply_item.supply.warehouse,
            product=supply_item.product,
            packaging=supply_item.packaging,
            batch_number=batch_number,
            initial_quantity=supply_item.received_quantity,
            remaining_quantity=supply_item.received_quantity,
            unit_cost=supply_item.unit_price,
            received_date=timezone.now(),
            supplier=supply_item.supply.supplier,
            supply=supply_item.supply
        )
        
        movement.batch = batch
        movement.unit_cost = supply_item.unit_price
        movement.save()
    
    def _process_outgoing_movement(self, warehouse, product, packaging, quantity: Decimal, 
                                 movement: StockMovement, user):
        """Обробка витратного руху товарів"""
        costing_method = self.get_costing_method(warehouse, product)
        
        if costing_method.method in ['fifo', 'lifo']:
            try:
                unit_cost, used_batches = (
                    self.calculate_fifo_cost(warehouse, product, packaging, quantity) 
                    if costing_method.method == 'fifo' 
                    else self.calculate_lifo_cost(warehouse, product, packaging, quantity)
                )
                
                # Списуємо товар з партій
                for batch_info in used_batches:
                    batch = batch_info['batch']
                    quantity_used = batch_info['quantity_used']
                    
                    batch.remaining_quantity -= quantity_used
                    batch.save()
                    
                    # Створюємо окремий рух для кожної партії
                    if len(used_batches) > 1:
                        StockMovement.objects.create(
                            warehouse=warehouse,
                            product=product,
                            packaging=packaging,
                            batch=batch,
                            movement_type=movement.movement_type,
                            quantity=-quantity_used,  # Негативна для витрати
                            unit_cost=batch_info['unit_cost'],
                            reference_document=movement.reference_document,
                            reference_id=movement.reference_id,
                            movement_date=movement.movement_date,
                            created_by=user,
                            notes=f"Частина руху {movement.id}"
                        )
                
                movement.unit_cost = unit_cost
                movement.quantity = -abs(quantity)  # Негативна для витрати
                
            except ValueError as e:
                # Недостатньо товару - записуємо як є
                movement.notes = f"Помилка: {str(e)}"
                movement.unit_cost = self.calculate_average_cost(warehouse, product, packaging)
                movement.quantity = -abs(quantity)
        else:
            # Для середньої собівартості
            unit_cost = self.calculate_average_cost(warehouse, product, packaging)
            movement.unit_cost = unit_cost
            movement.quantity = -abs(quantity)
        
        movement.save()
    
    def _update_stock_quantity(self, warehouse, product, packaging):
        """Оновлення загальних залишків на основі партій"""
        total_quantity = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            is_active=True
        ).aggregate(
            total=Sum('remaining_quantity')
        )['total'] or Decimal('0')
        
        stock, created = Stock.objects.get_or_create(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            defaults={'quantity': Decimal('0')}
        )
        
        stock.quantity = total_quantity
        
        # Оновлюємо середню собівартість
        average_cost = self.calculate_average_cost(warehouse, product, packaging)
        stock.cost_price = average_cost
        
        stock.save()
    
    def create_cost_calculation_report(self, warehouse, product, packaging) -> CostCalculation:
        """Створення звіту з розрахунком собівартості всіма методами"""
        
        # Отримуємо всі методи
        methods = CostingMethod.objects.filter(is_active=True)
        current_method = self.get_costing_method(warehouse, product)
        
        # Загальна кількість на складі
        total_quantity = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            remaining_quantity__gt=0,
            is_active=True
        ).aggregate(total=Sum('remaining_quantity'))['total'] or Decimal('0')
        
        batches_count = StockBatch.objects.filter(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            remaining_quantity__gt=0,
            is_active=True
        ).count()
        
        # Розраховуємо собівартість різними методами
        average_cost = self.calculate_average_cost(warehouse, product, packaging)
        
        fifo_cost = None
        lifo_cost = None
        
        if total_quantity > 0:
            try:
                fifo_cost, _ = self.calculate_fifo_cost(warehouse, product, packaging, Decimal('1'))
            except:
                pass
            
            try:
                lifo_cost, _ = self.calculate_lifo_cost(warehouse, product, packaging, Decimal('1'))
            except:
                pass
        
        # Створюємо звіт
        calculation = CostCalculation.objects.create(
            warehouse=warehouse,
            product=product,
            packaging=packaging,
            costing_method=current_method,
            calculation_date=timezone.now(),
            total_quantity=total_quantity,
            average_cost=average_cost,
            fifo_cost=fifo_cost,
            lifo_cost=lifo_cost,
            total_value=total_quantity * average_cost,
            batches_count=batches_count
        )
        
        return calculation
    
    def cleanup_empty_batches(self, warehouse=None):
        """Очищення порожніх партій"""
        query = StockBatch.objects.filter(remaining_quantity__lte=0)
        if warehouse:
            query = query.filter(warehouse=warehouse)
        
        empty_batches = query.update(is_active=False)
        return empty_batches