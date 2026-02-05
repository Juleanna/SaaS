"""
Serializers для сповіщень
"""

from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Повний serializer для сповіщення"""

    notification_type_display = serializers.CharField(
        source="get_notification_type_display", read_only=True
    )
    related_order_number = serializers.CharField(
        source="related_order.order_number", read_only=True, allow_null=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "notification_type_display",
            "title",
            "message",
            "data",
            "is_read",
            "is_sent",
            "email_sent",
            "telegram_sent",
            "related_order",
            "related_order_number",
            "created_at",
            "read_at",
        ]
        read_only_fields = [
            "id",
            "notification_type_display",
            "is_sent",
            "email_sent",
            "telegram_sent",
            "created_at",
            "read_at",
        ]


class NotificationListSerializer(serializers.ModelSerializer):
    """Скорочений serializer для списку сповіщень"""

    notification_type_display = serializers.CharField(
        source="get_notification_type_display", read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "notification_type_display",
            "title",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer для створення сповіщення"""

    class Meta:
        model = Notification
        fields = ["notification_type", "title", "message", "data", "related_order"]
