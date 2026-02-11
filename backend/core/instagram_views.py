"""
Instagram Integration Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.http import csrf_exempt
from django.views.decorators.csrf import csrf_exempt as csrf_exempt_decorator
from django.http import JsonResponse
from django.conf import settings
import requests
import json
import logging

from core.instagram_models import (
    InstagramAccount,
    InstagramPost,
    InstagramAutoPost,
    InstagramDMKeyword,
    InstagramDMMessage,
)
from core.instagram_handler import InstagramAPIHandler, InstagramWebhookHandler
from core.instagram_serializers import (
    InstagramAccountSerializer,
    InstagramPostSerializer,
    InstagramAutoPostSerializer,
    InstagramDMKeywordSerializer,
)
from core.instagram_tasks import (
    sync_instagram_account_media,
    sync_daily_instagram_statistics,
    auto_post_product_to_instagram,
)

logger = logging.getLogger(__name__)


class InstagramAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління Instagram акаунтами
    """

    serializer_class = InstagramAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstagramAccount.objects.filter(user=self.request.user)

    @action(detail=False, methods=["get"])
    def oauth_login_url(self, request):
        """
        Отримати URL для OAuth входу на Instagram
        """
        redirect_uri = f"{settings.SITE_URL}/api/instagram/oauth-callback/"
        client_id = settings.INSTAGRAM_APP_ID
        scope = "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages"

        login_url = (
            f"https://api.instagram.com/oauth/authorize"
            f"?client_id={client_id}"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scope}"
            f"&response_type=code"
        )

        return Response({"login_url": login_url})

    @action(detail=False, methods=["post"])
    def oauth_callback(self, request):
        """
        Обробити OAuth callback від Instagram
        """
        code = request.data.get("code")
        store_id = request.data.get("store_id")

        if not code:
            return Response(
                {"error": "Missing authorization code"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # SECURITY: Валідація store_id
        if not store_id:
            return Response(
                {"error": "Missing store_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # SECURITY: Перевірка прав доступу до магазину
        from stores.models import Store
        try:
            store = Store.objects.get(id=store_id, owner=request.user)
        except Store.DoesNotExist:
            return Response(
                {"error": "Store not found or access denied"},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            # Обміняти код на токен
            token_response = requests.post(
                "https://graph.instagram.com/v18.0/access_token",
                data={
                    "client_id": settings.INSTAGRAM_APP_ID,
                    "client_secret": settings.INSTAGRAM_APP_SECRET,
                    "grant_type": "authorization_code",
                    "redirect_uri": f"{settings.SITE_URL}/api/instagram/oauth-callback/",
                    "code": code,
                },
            )
            token_response.raise_for_status()
            token_data = token_response.json()

            access_token = token_data["access_token"]
            user_id = token_data["user_id"]

            # Отримати інформацію про користувача
            handler = InstagramAPIHandler(access_token)
            user_info = handler.get_user_info()

            # Створити або оновити акаунт
            account, created = InstagramAccount.objects.get_or_create(
                user=request.user,
                instagram_user_id=user_id,
                defaults={
                    "store": store,  # Використати перевірений store об'єкт
                    "access_token": access_token,
                    "instagram_username": user_info.get("username"),
                    "instagram_name": user_info.get("name"),
                    "followers_count": user_info.get("followers_count", 0),
                    "profile_picture_url": user_info.get("profile_picture_url", ""),
                    "bio": user_info.get("biography", ""),
                    "status": "connected",
                },
            )

            if not created:
                # SECURITY: Перевірка прав при оновленні існуючого акаунту
                if account.store.owner != request.user:
                    return Response(
                        {"error": "Access denied to update this account"},
                        status=status.HTTP_403_FORBIDDEN,
                    )

                account.store = store
                account.access_token = access_token
                account.status = "connected"
                account.instagram_username = user_info.get("username")
                account.instagram_name = user_info.get("name")
                account.followers_count = user_info.get("followers_count", 0)
                account.profile_picture_url = user_info.get("profile_picture_url", "")
                account.bio = user_info.get("biography", "")
                account.save()

            # Синхронізувати медіа
            sync_instagram_account_media.delay(account.id)

            return Response(InstagramAccountSerializer(account).data)

        except Exception as e:
            logger.error(f"Instagram OAuth error: {str(e)}")
            return Response(
                {"error": f"OAuth failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["post"])
    def disconnect(self, request, pk=None):
        """
        Відключити Instagram акаунт
        """
        account = self.get_object()
        account.status = "disconnected"
        account.access_token = ""
        account.save()

        return Response({"status": "disconnected"})

    @action(detail=True, methods=["post"])
    def sync_media(self, request, pk=None):
        """
        Синхронізувати медіа контент вручну
        """
        account = self.get_object()
        sync_instagram_account_media.delay(account.id)

        return Response({"status": "Синхронізація розпочата"})

    @action(detail=True, methods=["get"])
    def statistics(self, request, pk=None):
        """
        Отримати статистику акаунту
        """
        account = self.get_object()

        # Отримати останні 30 днів статистики
        from core.instagram_models import InstagramStatistics
        from django.utils import timezone
        from datetime import timedelta

        last_30_days = timezone.now() - timedelta(days=30)
        stats = InstagramStatistics.objects.filter(
            account=account, date__gte=last_30_days
        ).order_by("date")

        return Response(
            {
                "account": InstagramAccountSerializer(account).data,
                "statistics": [
                    {
                        "date": s.date,
                        "followers": s.total_followers,
                        "new_followers": s.new_followers,
                        "engagement_rate": s.engagement_rate,
                    }
                    for s in stats
                ],
            }
        )


class InstagramPostViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для перегляду Instagram постів
    """

    serializer_class = InstagramPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstagramPost.objects.filter(account__user=self.request.user).order_by(
            "-posted_at"
        )

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """
        Отримати останні пости
        """
        limit = int(request.query_params.get("limit", 10))
        posts = self.get_queryset()[:limit]

        return Response(InstagramPostSerializer(posts, many=True).data)


class InstagramAutoPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління автопостингом
    """

    serializer_class = InstagramAutoPostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstagramAutoPost.objects.filter(account__user=self.request.user)

    def perform_create(self, serializer):
        account_id = self.request.data.get("account_id")
        account = InstagramAccount.objects.get(id=account_id)
        serializer.save(account=account)

    @action(detail=True, methods=["post"])
    def publish_now(self, request, pk=None):
        """
        Опублікувати пост негайно
        """
        auto_post = self.get_object()
        auto_post_product_to_instagram.delay(auto_post.id)

        return Response({"status": "Постинг розпочатий"})


class InstagramDMKeywordViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управління DM ключовими словами
    """

    serializer_class = InstagramDMKeywordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InstagramDMKeyword.objects.filter(account__user=self.request.user)


@csrf_exempt_decorator
def instagram_webhook(request):
    """
    Webhook для отримання подій з Instagram
    """
    if request.method == "GET":
        # Verification dari Instagram
        verify_token = request.GET.get("hub.verify_token")
        challenge = request.GET.get("hub.challenge")

        if verify_token == settings.INSTAGRAM_WEBHOOK_VERIFY_TOKEN:
            return JsonResponse({"hub.challenge": challenge})

        return JsonResponse({"error": "Invalid verify token"}, status=403)

    elif request.method == "POST":
        try:
            data = json.loads(request.body)

            for entry in data.get("entry", []):
                for messaging_event in entry.get("messaging", []):
                    if messaging_event.get("message"):
                        # Обробити DM повідомлення
                        sender_id = messaging_event.get("sender", {}).get("id")
                        message_data = messaging_event.get("message", {})

                        message_text = message_data.get("text", "")
                        message_id = message_data.get("mid")

                        if message_text:
                            # Знайти Instagram акаунт
                            try:
                                from core.instagram_models import (
                                    InstagramAccount,
                                    InstagramDMMessage,
                                )
                                from django.utils import timezone

                                # Знайти акаунт за instagram_user_id з entry
                                recipient_id = entry.get("id")

                                try:
                                    account = InstagramAccount.objects.get(
                                        instagram_user_id=recipient_id,
                                        status="connected"
                                    )
                                except InstagramAccount.DoesNotExist:
                                    logger.error(f"Instagram account with user_id {recipient_id} not found")
                                    continue

                                # Дедуплікація: перевірити чи повідомлення вже існує
                                if InstagramDMMessage.objects.filter(
                                    instagram_message_id=message_id
                                ).exists():
                                    logger.info(f"Message {message_id} already processed, skipping")
                                    continue

                                dm_message = InstagramDMMessage.objects.create(
                                    account=account,
                                    instagram_message_id=message_id,
                                    sender_username=sender_id,
                                    sender_id=sender_id,
                                    message_text=message_text,
                                    received_at=timezone.now(),
                                )

                                # Обробити асинхронно
                                from core.instagram_tasks import (
                                    process_instagram_dm_message,
                                )

                                process_instagram_dm_message.delay(dm_message.id)

                            except Exception as e:
                                logger.error(f"Error processing DM message: {str(e)}")

            return JsonResponse({"status": "ok"})

        except Exception as e:
            logger.error(f"Webhook error: {str(e)}")
            return JsonResponse({"error": str(e)}, status=400)
