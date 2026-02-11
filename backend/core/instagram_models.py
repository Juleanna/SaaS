"""
Instagram Integration Models
"""

from django.db import models
from django.contrib.auth.models import User
from stores.models import Store
import requests
import json
from django.utils import timezone


class InstagramAccount(models.Model):
    """
    Модель для зберігання даних Instagram акаунту
    """

    ACCOUNT_TYPES = [
        ("personal", "Особистий"),
        ("business", "Бізнес"),
    ]

    STATUS_CHOICES = [
        ("connected", "Підключено"),
        ("disconnected", "Відключено"),
        ("token_expired", "Токен закінчився"),
    ]

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="instagram_account"
    )
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name="instagram_accounts"
    )

    # Instagram данные
    instagram_user_id = models.CharField(max_length=100, unique=True)
    instagram_username = models.CharField(max_length=150)
    instagram_name = models.CharField(max_length=150)

    # Токены доступу
    access_token = models.TextField()  # Long-lived token
    refresh_token = models.TextField(blank=True, null=True)
    token_expires_at = models.DateTimeField(blank=True, null=True)

    # Статус та тип
    account_type = models.CharField(
        max_length=20, choices=ACCOUNT_TYPES, default="personal"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="disconnected"
    )

    # Профіль інформація
    followers_count = models.IntegerField(default=0)
    profile_picture_url = models.URLField(blank=True)
    bio = models.TextField(blank=True)

    # Налаштування
    auto_post_products = models.BooleanField(default=False)  # Автопостинг товарів
    hashtags = models.CharField(max_length=500, blank=True)  # Хештеги для постів
    auto_respond_enabled = models.BooleanField(default=False)  # Автовідповіді на DM

    # Статистика
    last_sync = models.DateTimeField(blank=True, null=True)  # Остання синхронізація
    total_posts = models.IntegerField(default=0)
    total_interactions = models.IntegerField(default=0)

    # Часові мітки
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instagram_accounts"
        verbose_name = "Instagram Акаунт"
        verbose_name_plural = "Instagram Акаунти"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.instagram_username} ({self.user.username})"

    def is_token_valid(self):
        """Перевірити чи токен ще дійсний"""
        if self.token_expires_at:
            return timezone.now() < self.token_expires_at
        return True

    def refresh_token_if_needed(self):
        """
        Оновити токен якщо він збирається закінчитися

        Перевіряє чи токен закінчується менш ніж через 7 днів
        і автоматично оновлює його через Instagram API.

        Returns:
            bool: True якщо токен оновлено, False якщо ні або помилка
        """
        from datetime import timedelta
        import logging

        logger = logging.getLogger(__name__)

        # Якщо токен закінчується менш ніж через 7 днів
        if self.token_expires_at:
            days_until_expiry = (self.token_expires_at - timezone.now()).days

            if days_until_expiry < 7:
                try:
                    from core.instagram_handler import InstagramAPIHandler

                    handler = InstagramAPIHandler(self.access_token)
                    token_data = handler.refresh_access_token()

                    # Оновити токен
                    self.access_token = token_data["access_token"]
                    self.token_expires_at = timezone.now() + timedelta(
                        seconds=token_data.get("expires_in", 5184000)
                    )
                    self.status = "connected"
                    self.save()

                    logger.info(f"Successfully refreshed token for {self.instagram_username}")
                    return True

                except Exception as e:
                    logger.error(f"Failed to refresh token for {self.instagram_username}: {str(e)}")
                    self.status = "token_expired"
                    self.save()
                    return False

        return False


class InstagramPost(models.Model):
    """
    Модель для зберігання постів з Instagram
    """

    POST_TYPES = [
        ("image", "Зображення"),
        ("video", "Відео"),
        ("carousel", "Карусель"),
    ]

    account = models.ForeignKey(
        InstagramAccount, on_delete=models.CASCADE, related_name="posts"
    )
    store = models.ForeignKey(
        Store, on_delete=models.CASCADE, related_name="instagram_posts"
    )

    # Instagram данные
    instagram_id = models.CharField(max_length=100, unique=True)
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    media_url = models.URLField()
    caption = models.TextField(blank=True)
    permalink = models.URLField()

    # Статистика
    likes_count = models.IntegerField(default=0)
    comments_count = models.IntegerField(default=0)
    shares_count = models.IntegerField(default=0)

    # Пов'язані товари
    related_products = models.ManyToManyField(
        "products.Product", blank=True, related_name="instagram_posts"
    )

    # Даты
    posted_at = models.DateTimeField()
    synced_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instagram_posts"
        verbose_name = "Instagram Пост"
        verbose_name_plural = "Instagram Пости"
        ordering = ["-posted_at"]

    def __str__(self):
        return f"Post by {self.account.instagram_username} - {self.posted_at}"


class InstagramAutoPost(models.Model):
    """
    Модель для автоматичного постингу товарів на Instagram
    """

    account = models.ForeignKey(
        InstagramAccount, on_delete=models.CASCADE, related_name="auto_posts"
    )
    product = models.ForeignKey("products.Product", on_delete=models.CASCADE)

    # Текст поста
    caption_template = models.TextField()

    # Статус
    STATUSES = [
        ("pending", "На розгляді"),
        ("posted", "Опубліковано"),
        ("failed", "Помилка"),
    ]
    status = models.CharField(max_length=20, choices=STATUSES, default="pending")

    # Результат постингу
    instagram_post_id = models.CharField(max_length=100, blank=True)
    error_message = models.TextField(blank=True)

    # Дати
    scheduled_at = models.DateTimeField()
    posted_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instagram_auto_posts"
        verbose_name = "Instagram Автопост"
        verbose_name_plural = "Instagram Автопости"
        ordering = ["scheduled_at"]

    def __str__(self):
        return f"Auto post: {self.product.name}"


class InstagramDMKeyword(models.Model):
    """
    Модель для налаштування автовідповідей на ключові слова в DM
    """

    account = models.ForeignKey(
        InstagramAccount, on_delete=models.CASCADE, related_name="dm_keywords"
    )

    keyword = models.CharField(max_length=100)
    response_message = models.TextField()
    is_active = models.BooleanField(default=True)

    # Статистика
    times_triggered = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instagram_dm_keywords"
        verbose_name = "Instagram DM Ключове слово"
        verbose_name_plural = "Instagram DM Ключові слова"

    def __str__(self):
        return f"Keyword: {self.keyword}"


class InstagramDMMessage(models.Model):
    """
    Модель для зберігання DM повідомлень з Instagram
    """

    account = models.ForeignKey(
        InstagramAccount, on_delete=models.CASCADE, related_name="dm_messages"
    )

    # Message данные
    instagram_message_id = models.CharField(max_length=100, unique=True)
    sender_username = models.CharField(max_length=150)
    sender_id = models.CharField(max_length=100)
    message_text = models.TextField()

    # Обробка
    is_processed = models.BooleanField(default=False)
    auto_response_sent = models.BooleanField(default=False)

    received_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "instagram_dm_messages"
        verbose_name = "Instagram DM Повідомлення"
        verbose_name_plural = "Instagram DM Повідомлення"
        ordering = ["-received_at"]

    def __str__(self):
        return f"DM from {self.sender_username}"


class InstagramStatistics(models.Model):
    """
    Модель для зберігання статистики по дням
    """

    account = models.ForeignKey(
        InstagramAccount, on_delete=models.CASCADE, related_name="statistics"
    )

    date = models.DateField()

    # Статистика по дням
    new_followers = models.IntegerField(default=0)
    total_followers = models.IntegerField(default=0)
    total_likes = models.IntegerField(default=0)
    total_comments = models.IntegerField(default=0)
    posts_published = models.IntegerField(default=0)

    # Engagement
    engagement_rate = models.FloatField(default=0.0)  # У відсотках

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "instagram_statistics"
        verbose_name = "Instagram Статистика"
        verbose_name_plural = "Instagram Статистики"
        unique_together = ("account", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"Stats for {self.account.instagram_username} on {self.date}"
