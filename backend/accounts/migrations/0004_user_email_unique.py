from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_user_balance_user_monthly_spending_user_total_spent'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254, unique=True, verbose_name='Email'),
        ),
    ]
