"""
REST API views для Telegram бота та webhook обробка
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.conf import settings
from telegram import Update, Bot
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    MessageHandler,
    filters,
)
import json
import asyncio
import logging

from .models import TelegramBot, TelegramUser
from .handlers import TelegramBotHandlers

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def link_telegram_to_account(request):
    """
    Прив'язати Telegram ID до аккаунту користувача
    """
    try:
        telegram_id = request.data.get("telegram_id")

        if not telegram_id:
            return Response(
                {"error": "telegram_id обов'язково"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Отримати Telegram користувача
        telegram_user = TelegramUser.objects.get(telegram_id=telegram_id)

        # Прив'язати до поточного користувача
        telegram_user.user = request.user
        telegram_user.save()

        # Оновити Telegram chat_id в User моделі
        request.user.telegram_chat_id = str(telegram_id)
        request.user.save()

        logger.info(
            f"Telegram ID {telegram_id} прив'язаний до користувача {request.user.email}"
        )

        return Response(
            {"message": "Telegram успішно прив'язаний до аккаунту"},
            status=status.HTTP_200_OK,
        )

    except TelegramUser.DoesNotExist:
        return Response(
            {"error": "Telegram користувач не знайдено"},
            status=status.HTTP_404_NOT_FOUND,
        )
    except Exception as e:
        logger.error(f"Помилка при прив'язуванні Telegram: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unlink_telegram_account(request):
    """
    Відв'язати Telegram від аккаунту користувача
    """
    try:
        # Отримати Telegram користувача поточного користувача
        telegram_user = TelegramUser.objects.filter(user=request.user).first()

        if not telegram_user:
            return Response(
                {"error": "Telegram не прив'язаний до аккаунту"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Відв'язати
        telegram_user.user = None
        telegram_user.save()

        request.user.telegram_chat_id = ""
        request.user.save()

        logger.info(
            f"Telegram ID {telegram_user.telegram_id} відв'язаний від користувача {request.user.email}"
        )

        return Response(
            {"message": "Telegram відв'язаний від аккаунту"}, status=status.HTTP_200_OK
        )

    except Exception as e:
        logger.error(f"Помилка при відв'язуванні Telegram: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_telegram_info(request):
    """
    Отримати інформацію про прив'язаний Telegram
    """
    try:
        telegram_user = TelegramUser.objects.filter(user=request.user).first()

        if telegram_user:
            return Response(
                {
                    "telegram_id": telegram_user.telegram_id,
                    "username": telegram_user.username,
                    "first_name": telegram_user.first_name,
                    "last_name": telegram_user.last_name,
                    "is_linked": True,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"is_linked": False, "message": "Telegram не прив'язаний"},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"Помилка при отриманні Telegram інформації: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@csrf_exempt
@require_http_methods(["POST"])
def telegram_webhook(request):
    """
    Webhook обробник для Telegram бота
    """
    try:
        # Отримати JSON від Telegram
        data = json.loads(request.body)
        update = Update.de_json(data, None)

        # Запустити обробник асинхронно
        asyncio.run(handle_telegram_update(update))

        return JsonResponse({"ok": True})

    except json.JSONDecodeError:
        logger.error("Некоректний JSON в telegram_webhook")
        return JsonResponse({"ok": False, "error": "Invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Помилка в telegram_webhook: {e}")
        return JsonResponse({"ok": False, "error": str(e)}, status=500)


async def handle_telegram_update(update: Update):
    """
    Обробити Telegram update
    """
    try:
        # Отримати сообщение
        message = update.message
        callback_query = update.callback_query

        if message:
            # Обробити текстове повідомлення або команду
            if message.text:
                if message.text == "/start":
                    await TelegramBotHandlers.start_command(update, None)
                elif message.text == "/help":
                    await TelegramBotHandlers.help_command(update, None)
                # Інші команди...

        elif callback_query:
            # Обробити кнопку
            data = callback_query.data

            if data == "view_stores":
                await TelegramBotHandlers.view_stores(update, None)
            elif data.startswith("store_"):
                store_id = int(data.split("_")[1])
                await TelegramBotHandlers.view_store_products(store_id, update, None)
            elif data.startswith("product_"):
                product_id = int(data.split("_")[1])
                await TelegramBotHandlers.view_product_detail(product_id, update, None)
            elif data.startswith("add_to_cart_"):
                product_id = int(data.split("_")[3])
                await TelegramBotHandlers.add_to_cart(product_id, update, None)
            elif data == "view_cart":
                await TelegramBotHandlers.view_cart(update, None)
            elif data == "link_account":
                await TelegramBotHandlers.link_account(update, None)
            elif data == "help":
                await TelegramBotHandlers.help_command(update, None)

    except Exception as e:
        logger.error(f"Помилка при обробці Telegram update: {e}")


@api_view(["POST"])
@permission_classes([permissions.IsAdminUser])
def setup_telegram_webhook(request):
    """
    Встановити webhook для Telegram бота (тільки для адміністраторів)
    """
    try:
        store_id = request.data.get("store_id")
        bot_token = request.data.get("bot_token")
        webhook_url = request.data.get("webhook_url")

        if not all([store_id, bot_token, webhook_url]):
            return Response(
                {"error": "store_id, bot_token та webhook_url обов'язково"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ініціалізувати бот
        bot = Bot(token=bot_token)

        # Встановити webhook
        result = bot.set_webhook(url=webhook_url)

        if result:
            logger.info(f"Webhook встановлено для бота {bot_token}")
            return Response(
                {"message": "Webhook успішно встановлено"}, status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Помилка при встановленні webhook"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    except Exception as e:
        logger.error(f"Помилка при встановленні webhook: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def get_telegram_webhook_info(request):
    """
    Отримати інформацію про webhook Telegram бота
    """
    try:
        bot_token = request.query_params.get("bot_token")

        if not bot_token:
            return Response(
                {"error": "bot_token обов'язково"}, status=status.HTTP_400_BAD_REQUEST
            )

        bot = Bot(token=bot_token)
        webhook_info = bot.get_webhook_info()

        return Response(
            {
                "url": webhook_info.url,
                "has_custom_certificate": webhook_info.has_custom_certificate,
                "pending_update_count": webhook_info.pending_update_count,
                "ip_address": webhook_info.ip_address,
                "last_error_date": webhook_info.last_error_date,
                "last_error_message": webhook_info.last_error_message,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        logger.error(f"Помилка при отриманні webhook інформації: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
