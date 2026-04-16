"""
Конфігурація Django додатка для ядра платформи
"""

from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "core"

    def ready(self):
        """Ініціалізація при запуску додатка"""
        import core.signals
        from django.utils.translation import gettext_lazy as _

        # Реєстрація сигналів
        core.signals.ready()

        # Реєструємо ключові моделі в auditlog (хто коли що змінив)
        try:
            from auditlog.registry import auditlog
            from stores.models import Store
            from products.models import Product, Category
            from orders.models import Order
            from pricelists.models import PriceList, PriceListItem
            from accounts.models import User

            for model in (Store, Product, Category, Order, PriceList, PriceListItem, User):
                if not auditlog.contains(model):
                    auditlog.register(model)
        except Exception:
            # Не блокуємо старт якщо auditlog ще не встановлено
            pass
