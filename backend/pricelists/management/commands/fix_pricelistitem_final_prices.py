from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from pricelists.models import PriceListItem


class Command(BaseCommand):
    help = 'Виправити проблеми з final_price в PriceListItem записах'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Показати що буде змінено без внесення змін',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Знаходимо проблемні записи
        problematic_items = []
        
        for item in PriceListItem.objects.all():
            needs_fix = False
            reason = ""
            
            if not item.final_price or item.final_price <= 0:
                needs_fix = True
                reason = "final_price is None or <= 0"
            
            if needs_fix:
                problematic_items.append((item, reason))
        
        if not problematic_items:
            self.stdout.write(
                self.style.SUCCESS('Не знайдено проблемних записів!')
            )
            return
        
        self.stdout.write(
            f'Знайдено {len(problematic_items)} проблемних записів:'
        )
        
        if dry_run:
            for item, reason in problematic_items:
                self.stdout.write(
                    f'  - {item.product.name} в {item.price_list.name}: {reason}'
                )
        else:
            fixed_count = 0
            
            with transaction.atomic():
                for item, reason in problematic_items:
                    try:
                        # Застосовуємо нашу логіку виправлення
                        old_final_price = item.final_price
                        
                        # Форсуємо перерахунок через save()
                        item.save()
                        
                        if item.final_price and item.final_price > 0:
                            fixed_count += 1
                            self.stdout.write(
                                f'✓ Виправлено {item.product.name}: '
                                f'{old_final_price} → {item.final_price}'
                            )
                        else:
                            self.stdout.write(
                                f'✗ Не вдалося виправити {item.product.name}'
                            )
                    except Exception as e:
                        self.stdout.write(
                            f'✗ Помилка з {item.product.name}: {e}'
                        )
            
            if fixed_count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Успішно виправлено {fixed_count} записів!'
                    )
                )
            else:
                self.stdout.write(
                    self.style.ERROR('Не вдалося виправити жодного запису.')
                )