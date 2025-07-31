import pandas as pd
import io
from decimal import Decimal, InvalidOperation
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from typing import Dict, List, Tuple, Optional, Union
import logging

from products.models import Product
from ..models import PriceList, PriceListItem

logger = logging.getLogger(__name__)


class ExcelPriceListHandler:
    """Обробник Excel файлів для прайс-листів"""
    
    # Стандартні назви колонок для розпізнавання
    COLUMN_MAPPINGS = {
        'product_name': ['назва', 'товар', 'name', 'product', 'найменування'],
        'sku': ['sku', 'артикул', 'код товару', 'code'],
        'barcode': ['штрихкод', 'barcode', 'штрих-код'],
        'cost': ['собівартість', 'cost', 'закупочная цена', 'себестоимость'],
        'markup_percentage': ['націнка %', 'markup %', 'наценка %', 'markup', 'націнка'],
        'markup_amount': ['націнка грн', 'markup uah', 'наценка грн'],
        'price': ['ціна', 'price', 'ціна продажу', 'selling price', 'цена'],
        'category': ['категорія', 'category', 'группа', 'категория']
    }
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def detect_column_mapping(self, df: pd.DataFrame) -> Dict[str, str]:
        """Автоматичне визначення відповідності колонок"""
        columns = [col.lower().strip() for col in df.columns]
        mapping = {}
        
        for field, possible_names in self.COLUMN_MAPPINGS.items():
            for col in columns:
                for possible_name in possible_names:
                    if possible_name in col:
                        # Знаходимо оригінальну назву колонки
                        original_col = df.columns[columns.index(col)]
                        mapping[field] = original_col
                        break
                if field in mapping:
                    break
        
        return mapping
    
    def validate_excel_structure(self, df: pd.DataFrame, mapping: Dict[str, str]) -> bool:
        """Валідація структури Excel файлу"""
        self.errors = []
        
        # Перевіряємо обов'язкові колонки
        required_fields = ['product_name']
        for field in required_fields:
            if field not in mapping:
                self.errors.append(f"Не знайдено обов'язкову колонку: {field}")
        
        # Перевіряємо що файл не порожній
        if df.empty:
            self.errors.append("Excel файл порожній")
            return False
        
        # Перевіряємо що є хоча б одна колонка з ціною або собівартістю
        price_related = ['cost', 'price', 'markup_percentage', 'markup_amount']
        has_price_data = any(field in mapping for field in price_related)
        
        if not has_price_data:
            self.errors.append("Не знайдено колонки з ціновою інформацією")
        
        return len(self.errors) == 0
    
    def clean_decimal_value(self, value) -> Optional[Decimal]:
        """Очищення та конвертація значення в Decimal"""
        if pd.isna(value) or value == '':
            return None
        
        try:
            # Видаляємо пробіли та замінюємо кому на крапку
            clean_value = str(value).strip().replace(',', '.').replace(' ', '')
            
            # Видаляємо валютні символи
            clean_value = clean_value.replace('₴', '').replace('грн', '').replace('$', '')
            clean_value = clean_value.replace('%', '')
            
            return Decimal(clean_value)
        except (ValueError, InvalidOperation):
            return None
    
    def import_from_excel(
        self, 
        excel_file, 
        price_list: PriceList,
        mapping: Optional[Dict[str, str]] = None,
        update_existing: bool = True
    ) -> Dict[str, int]:
        """Імпорт даних з Excel файлу"""
        
        try:
            # Читаємо Excel файл
            df = pd.read_excel(excel_file)
            
            # Автоматично визначаємо колонки якщо не передано
            if not mapping:
                mapping = self.detect_column_mapping(df)
            
            # Валідуємо структуру
            if not self.validate_excel_structure(df, mapping):
                return {
                    'success': False,
                    'errors': self.errors,
                    'processed': 0,
                    'created': 0,
                    'updated': 0,
                    'skipped': 0
                }
            
            return self._process_excel_data(df, price_list, mapping, update_existing)
            
        except Exception as e:
            logger.error(f"Error importing Excel file: {e}")
            return {
                'success': False,
                'errors': [f"Помилка читання файлу: {str(e)}"],
                'processed': 0,
                'created': 0,
                'updated': 0,
                'skipped': 0
            }
    
    def _process_excel_data(
        self, 
        df: pd.DataFrame, 
        price_list: PriceList, 
        mapping: Dict[str, str],
        update_existing: bool
    ) -> Dict[str, int]:
        """Обробка даних з Excel"""
        
        processed = 0
        created = 0
        updated = 0
        skipped = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Отримуємо назву товару
                product_name = row.get(mapping.get('product_name', ''), '').strip()
                if not product_name:
                    skipped += 1
                    continue
                
                # Шукаємо товар
                product = self._find_product(row, mapping, price_list.store)
                if not product:
                    errors.append(f"Рядок {index + 2}: Товар '{product_name}' не знайдено")
                    skipped += 1
                    continue
                
                # Перевіряємо чи існує позиція в прайс-листі
                existing_item = PriceListItem.objects.filter(
                    price_list=price_list,
                    product=product
                ).first()
                
                if existing_item and not update_existing:
                    skipped += 1
                    continue
                
                # Отримуємо дані для позиції
                item_data = self._extract_item_data(row, mapping)
                
                if existing_item:
                    # Оновлюємо існуючу позицію
                    self._update_price_list_item(existing_item, item_data)
                    updated += 1
                else:
                    # Створюємо нову позицію
                    self._create_price_list_item(price_list, product, item_data)
                    created += 1
                
                processed += 1
                
            except Exception as e:
                errors.append(f"Рядок {index + 2}: {str(e)}")
                skipped += 1
        
        return {
            'success': True,
            'processed': processed,
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'errors': errors,
            'warnings': self.warnings
        }
    
    def _find_product(self, row: pd.Series, mapping: Dict[str, str], store) -> Optional[Product]:
        """Пошук товару за різними критеріями"""
        
        # Спочатку шукаємо по SKU
        if 'sku' in mapping:
            sku = str(row.get(mapping['sku'], '')).strip()
            if sku:
                product = Product.objects.filter(store=store, sku=sku).first()
                if product:
                    return product
        
        # Потім по штрихкоду
        if 'barcode' in mapping:
            barcode = str(row.get(mapping['barcode'], '')).strip()
            if barcode:
                product = Product.objects.filter(store=store, barcode=barcode).first()
                if product:
                    return product
        
        # Нарешті по назві
        product_name = row.get(mapping.get('product_name', ''), '').strip()
        if product_name:
            # Точний збіг
            product = Product.objects.filter(store=store, name=product_name).first()
            if product:
                return product
            
            # Часткове співпадіння (якщо точний збіг не знайдено)
            product = Product.objects.filter(
                store=store, 
                name__icontains=product_name
            ).first()
            if product:
                return product
        
        return None
    
    def _extract_item_data(self, row: pd.Series, mapping: Dict[str, str]) -> Dict:
        """Витягування даних для позиції прайс-листа"""
        
        data = {}
        
        # Собівартість
        if 'cost' in mapping:
            cost = self.clean_decimal_value(row.get(mapping['cost']))
            if cost is not None:
                data['manual_cost'] = cost
                data['cost_calculation_method'] = 'manual'
        
        # Ціна
        if 'price' in mapping:
            price = self.clean_decimal_value(row.get(mapping['price']))
            if price is not None:
                data['manual_price'] = price
                data['is_manual_override'] = True
        
        # Націнка у відсотках
        if 'markup_percentage' in mapping:
            markup = self.clean_decimal_value(row.get(mapping['markup_percentage']))
            if markup is not None:
                data['markup_type'] = 'percentage'
                data['markup_value'] = markup
        
        # Націнка у гривнях
        elif 'markup_amount' in mapping:
            markup = self.clean_decimal_value(row.get(mapping['markup_amount']))
            if markup is not None:
                data['markup_type'] = 'fixed_amount'
                data['markup_value'] = markup
        
        return data
    
    def _create_price_list_item(self, price_list: PriceList, product: Product, data: Dict):
        """Створення нової позиції прайс-листа"""
        
        item = PriceListItem.objects.create(
            price_list=price_list,
            product=product,
            category=product.category,
            cost_calculation_method=data.get('cost_calculation_method', 'auto'),
            manual_cost=data.get('manual_cost'),
            markup_type=data.get('markup_type', 'percentage'),
            markup_value=data.get('markup_value', price_list.default_markup_percentage),
            manual_price=data.get('manual_price'),
            is_manual_override=data.get('is_manual_override', False)
        )
        
        return item
    
    def _update_price_list_item(self, item: PriceListItem, data: Dict):
        """Оновлення існуючої позиції прайс-листа"""
        
        # Оновлюємо тільки ті поля, які є в даних
        for field, value in data.items():
            if hasattr(item, field) and value is not None:
                setattr(item, field, value)
        
        item.save()
    
    def export_to_excel(self, price_list: PriceList) -> io.BytesIO:
        """Експорт прайс-листа в Excel"""
        
        # Підготовка даних
        data = []
        for item in price_list.items.select_related('product', 'category'):
            data.append({
                'Назва товару': item.product.name,
                'SKU': item.product.sku or '',
                'Штрихкод': item.product.barcode or '',
                'Категорія': item.category.name if item.category else '',
                'Собівартість': float(item.current_cost) if item.current_cost else 0,
                'Тип націнки': item.get_markup_type_display(),
                'Націнка': float(item.markup_value),
                'Розрахована ціна': float(item.calculated_price) if item.calculated_price else 0,
                'Ручна ціна': float(item.manual_price) if item.manual_price else '',
                'Фінальна ціна': float(item.final_price),
                'Рентабельність %': float(item.profit_margin),
                'Прибуток': float(item.profit_amount),
                'Мін. ціна': float(item.min_price) if item.min_price else '',
                'Макс. ціна': float(item.max_price) if item.max_price else '',
                'Ручне перевизначення': 'Так' if item.is_manual_override else 'Ні',
                'Останнє оновлення': item.updated_at.strftime('%d.%m.%Y %H:%M') if item.updated_at else ''
            })
        
        # Створення DataFrame
        df = pd.DataFrame(data)
        
        # Запис в Excel
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Прайс-лист', index=False)
            
            # Налаштування ширини колонок
            worksheet = writer.sheets['Прайс-лист']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        buffer.seek(0)
        return buffer
    
    def generate_template(self) -> io.BytesIO:
        """Генерація шаблону Excel для імпорту"""
        
        # Створюємо приклад даних
        template_data = [
            {
                'Назва товару': 'Приклад товару 1',
                'SKU': 'EXAMPLE001',
                'Штрихкод': '1234567890123',
                'Категорія': 'Категорія 1',
                'Собівартість': 100.00,
                'Націнка %': 25.00,
                'Ціна продажу': 125.00
            },
            {
                'Назва товару': 'Приклад товару 2',
                'SKU': 'EXAMPLE002',
                'Штрихкод': '1234567890124',
                'Категорія': 'Категорія 2',
                'Собівартість': 200.00,
                'Націнка грн': 30.00,
                'Ціна продажу': 230.00
            }
        ]
        
        df = pd.DataFrame(template_data)
        
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Шаблон', index=False)
            
            # Додаємо інструкції на другий лист
            instructions = [
                ['Інструкції для імпорту прайс-листа'],
                [''],
                ['Обов\'язкові колонки:'],
                ['- Назва товару (назва, товар, name, product)'],
                [''],
                ['Додаткові колонки:'],
                ['- SKU (sku, артикул, код товару)'],
                ['- Штрихкод (штрихкод, barcode)'],
                ['- Собівартість (собівартість, cost)'],
                ['- Націнка % (націнка %, markup %)'],
                ['- Націнка грн (націнка грн, markup uah)'],
                ['- Ціна продажу (ціна, price)'],
                ['- Категорія (категорія, category)'],
                [''],
                ['Примітки:'],
                ['1. Товари шукаються спочатку по SKU, потім по штрихкоду, потім по назві'],
                ['2. Якщо вказана ціна продажу - вона буде встановлена як ручна'],
                ['3. Якщо вказана націнка - ціна буде розрахована автоматично'],
                ['4. Десяткові числа можна вказувати як з крапкою, так і з комою']
            ]
            
            instructions_df = pd.DataFrame(instructions, columns=['Інструкції'])
            instructions_df.to_excel(writer, sheet_name='Інструкції', index=False)
        
        buffer.seek(0)
        return buffer