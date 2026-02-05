"""
Instagram Serializers
"""

from rest_framework import serializers
from core.instagram_models import (
    InstagramAccount,
    InstagramPost,
    InstagramAutoPost,
    InstagramDMKeyword,
    InstagramDMMessage,
    InstagramStatistics,
)


class InstagramAccountSerializer(serializers.ModelSerializer):
    """
    Serializer для Instagram акаунту
    """

    class Meta:
        model = InstagramAccount
        fields = [
            "id",
            "instagram_user_id",
            "instagram_username",
            "instagram_name",
            "followers_count",
            "profile_picture_url",
            "bio",
            "account_type",
            "status",
            "auto_post_products",
            "hashtags",
            "auto_respond_enabled",
            "last_sync",
            "total_posts",
            "total_interactions",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "instagram_user_id",
            "followers_count",
            "profile_picture_url",
            "bio",
            "last_sync",
            "total_posts",
            "total_interactions",
            "created_at",
            "updated_at",
        ]


class InstagramStatisticsSerializer(serializers.ModelSerializer):
    """
    Serializer для статистики Instagram
    """

    class Meta:
        model = InstagramStatistics
        fields = [
            "id",
            "date",
            "new_followers",
            "total_followers",
            "total_likes",
            "total_comments",
            "posts_published",
            "engagement_rate",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class InstagramPostSerializer(serializers.ModelSerializer):
    """
    Serializer для Instagram поста
    """

    account_username = serializers.CharField(
        source="account.instagram_username", read_only=True
    )

    class Meta:
        model = InstagramPost
        fields = [
            "id",
            "instagram_id",
            "account_username",
            "post_type",
            "media_url",
            "caption",
            "permalink",
            "likes_count",
            "comments_count",
            "shares_count",
            "posted_at",
            "synced_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "instagram_id",
            "likes_count",
            "comments_count",
            "shares_count",
            "posted_at",
            "synced_at",
            "updated_at",
        ]


class InstagramAutoPostSerializer(serializers.ModelSerializer):
    """
    Serializer для автопосту
    """

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_image = serializers.ImageField(source="product.image", read_only=True)

    class Meta:
        model = InstagramAutoPost
        fields = [
            "id",
            "account",
            "product",
            "product_name",
            "product_image",
            "caption_template",
            "status",
            "instagram_post_id",
            "error_message",
            "scheduled_at",
            "posted_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "instagram_post_id",
            "error_message",
            "posted_at",
            "created_at",
        ]


class InstagramDMKeywordSerializer(serializers.ModelSerializer):
    """
    Serializer для DM ключового слова
    """

    class Meta:
        model = InstagramDMKeyword
        fields = [
            "id",
            "account",
            "keyword",
            "response_message",
            "is_active",
            "times_triggered",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "times_triggered", "created_at", "updated_at"]


class InstagramDMMessageSerializer(serializers.ModelSerializer):
    """
    Serializer для DM повідомлення
    """

    class Meta:
        model = InstagramDMMessage
        fields = [
            "id",
            "account",
            "instagram_message_id",
            "sender_username",
            "sender_id",
            "message_text",
            "is_processed",
            "auto_response_sent",
            "received_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "instagram_message_id",
            "is_processed",
            "auto_response_sent",
            "received_at",
            "created_at",
        ]


class InstagramAccountDetailSerializer(InstagramAccountSerializer):
    """
    Детальний serializer для Instagram акаунту з вкладеною статистикою
    """

    statistics = serializers.SerializerMethodField()
    recent_posts = serializers.SerializerMethodField()
    auto_posts_count = serializers.SerializerMethodField()
    dm_keywords = InstagramDMKeywordSerializer(many=True, read_only=True)

    def get_statistics(self, obj):
        """Отримати останні 30 днів статистики"""
        from django.utils import timezone
        from datetime import timedelta

        last_30_days = timezone.now() - timedelta(days=30)
        stats = InstagramStatistics.objects.filter(
            account=obj, date__gte=last_30_days
        ).order_by("date")

        return InstagramStatisticsSerializer(stats, many=True).data

    def get_recent_posts(self, obj):
        """Отримати останні 10 постів"""
        posts = InstagramPost.objects.filter(account=obj).order_by("-posted_at")[:10]
        return InstagramPostSerializer(posts, many=True).data

    def get_auto_posts_count(self, obj):
        """Отримати кількість заплановних постів"""
        return InstagramAutoPost.objects.filter(
            account=obj, status__in=["pending", "posted"]
        ).count()

    class Meta:
        model = InstagramAccount
        fields = InstagramAccountSerializer.Meta.fields + [
            "statistics",
            "recent_posts",
            "auto_posts_count",
            "dm_keywords",
        ]


class InstagramDashboardSerializer(serializers.Serializer):
    """
    Serializer для Instagram дашборду
    """

    account = InstagramAccountSerializer()
    statistics = InstagramStatisticsSerializer(many=True)
    recent_posts = InstagramPostSerializer(many=True)
    pending_auto_posts = InstagramAutoPostSerializer(many=True)
    total_followers = serializers.IntegerField()
    total_likes = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    engagement_rate = serializers.FloatField()
    last_sync = serializers.DateTimeField()
