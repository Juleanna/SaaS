from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationListView

router = DefaultRouter()
router.register(r"", NotificationViewSet, basename="notification")

urlpatterns = [
    path("", include(router.urls)),
    path("list/", NotificationListView.as_view(), name="notification-list"),
]
