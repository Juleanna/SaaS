from django.urls import path
from .views import (
    telegram_webhook,
    link_telegram_to_account,
    unlink_telegram_account,
    get_telegram_info,
    setup_telegram_webhook,
    get_telegram_webhook_info,
)

urlpatterns = [
    # Webhook для Telegram бота
    path("webhook/", telegram_webhook, name="telegram_webhook"),
    # API endpoints для Telegram
    path("account/link/", link_telegram_to_account, name="link_telegram"),
    path("account/unlink/", unlink_telegram_account, name="unlink_telegram"),
    path("account/info/", get_telegram_info, name="get_telegram_info"),
    # Адмін endpoints
    path("webhook/setup/", setup_telegram_webhook, name="setup_telegram_webhook"),
    path("webhook/info/", get_telegram_webhook_info, name="get_telegram_webhook_info"),
]
