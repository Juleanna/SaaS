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
