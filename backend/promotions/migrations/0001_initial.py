from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from decimal import Decimal


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('stores', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('code', models.CharField(db_index=True, max_length=32, verbose_name='Код')),
                ('description', models.CharField(blank=True, max_length=255, verbose_name='Опис')),
                ('discount_type', models.CharField(choices=[('percentage', 'Відсоток'), ('fixed', 'Фіксована сума')], default='percentage', max_length=20, verbose_name='Тип знижки')),
                ('discount_value', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))], verbose_name='Значення знижки')),
                ('min_order_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10, verbose_name='Мінімальна сума замовлення')),
                ('max_uses', models.PositiveIntegerField(blank=True, help_text='Порожнє = без обмежень', null=True, verbose_name='Максимум використань')),
                ('uses_count', models.PositiveIntegerField(default=0, verbose_name='Використано')),
                ('valid_from', models.DateTimeField(blank=True, null=True, verbose_name='Діє з')),
                ('valid_until', models.DateTimeField(blank=True, null=True, verbose_name='Діє до')),
                ('is_active', models.BooleanField(default=True, verbose_name='Активний')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('store', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='coupons', to='stores.store', verbose_name='Магазин')),
            ],
            options={
                'verbose_name': 'Промокод',
                'verbose_name_plural': 'Промокоди',
                'ordering': ['-created_at'],
                'unique_together': {('store', 'code')},
            },
        ),
    ]
