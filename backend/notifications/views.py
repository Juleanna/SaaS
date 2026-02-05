"""
API views для управління сповіщеннями
"""

from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Notification
from .serializers import NotificationSerializer, NotificationListSerializer
import logging

logger = logging.getLogger(__name__)


class NotificationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet для управління сповіщеннями користувача"""

    serializer_class = NotificationSerializer
    pagination_class = NotificationPagination
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["notification_type", "is_read", "is_sent"]
    search_fields = ["title", "message"]
    ordering_fields = ["created_at", "is_read"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Отримати сповіщення поточного користувача"""
        return Notification.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return NotificationListSerializer
        return NotificationSerializer

    @action(detail=True, methods=["patch"])
    def mark_as_read(self, request, pk=None):
        """Позначити сповіщення як прочитане"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()

        return Response(
            NotificationSerializer(notification).data, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"])
    def mark_as_unread(self, request, pk=None):
        """Позначити сповіщення як непрочитане"""
        notification = self.get_object()
        notification.is_read = False
        notification.read_at = None
        notification.save()

        return Response(
            NotificationSerializer(notification).data, status=status.HTTP_200_OK
        )

    @action(detail=False, methods=["patch"])
    def mark_all_as_read(self, request):
        """Позначити всі сповіщення як прочитані"""
        queryset = self.get_queryset().filter(is_read=False)
        updated_count = queryset.update(is_read=True, read_at=timezone.now())

        return Response(
            {"message": f"{updated_count} сповіщень позначено як прочитані"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        """Отримати кількість непрочитаних сповіщень"""
        unread_count = self.get_queryset().filter(is_read=False).count()

        return Response({"unread_count": unread_count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def recent(self, request):
        """Отримати останні сповіщення"""
        queryset = self.get_queryset()[:10]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["delete"])
    def delete_all_read(self, request):
        """Видалити всі прочитані сповіщення"""
        deleted_count, _ = self.get_queryset().filter(is_read=True).delete()

        return Response(
            {"message": f"{deleted_count} прочитаних сповіщень видалено"},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["delete"])
    def delete_notification(self, request, pk=None):
        """Видалити окреме сповіщення"""
        notification = self.get_object()
        notification.delete()

        return Response(
            {"message": "Сповіщення видалено"}, status=status.HTTP_204_NO_CONTENT
        )


class NotificationListView(generics.ListAPIView):
    """Простий список сповіщень"""

    serializer_class = NotificationListSerializer
    pagination_class = NotificationPagination
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["notification_type", "is_read"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
