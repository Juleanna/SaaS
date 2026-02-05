"""
Instagram URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.instagram_views import (
    InstagramAccountViewSet,
    InstagramPostViewSet,
    InstagramAutoPostViewSet,
    InstagramDMKeywordViewSet,
    instagram_webhook,
)

# Маршрути для ViewSets
router = DefaultRouter()
router.register(r"accounts", InstagramAccountViewSet, basename="instagram-account")
router.register(r"posts", InstagramPostViewSet, basename="instagram-post")
router.register(r"auto-posts", InstagramAutoPostViewSet, basename="instagram-auto-post")
router.register(
    r"dm-keywords", InstagramDMKeywordViewSet, basename="instagram-dm-keyword"
)

urlpatterns = [
    # API endpoints
    path("", include(router.urls)),
    # Webhook для отримання подій з Instagram
    path("webhook/", instagram_webhook, name="instagram-webhook"),
]
