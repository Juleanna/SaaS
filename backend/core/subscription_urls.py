from django.urls import path
from .subscription_views import (
    SubscriptionPlanListView,
    SubscriptionPlanDetailView,
    CurrentUserSubscriptionView,
    UpgradeSubscriptionView,
    CancelSubscriptionView,
    SubscriptionPaymentListView,
    SubscriptionUsageView,
    SubscriptionComparisonView,
)

urlpatterns = [
    path("plans/", SubscriptionPlanListView.as_view(), name="subscription-plans"),
    path("plans/<slug:slug>/", SubscriptionPlanDetailView.as_view(), name="subscription-plan-detail"),
    path("current/", CurrentUserSubscriptionView.as_view(), name="subscription-current"),
    path("upgrade/", UpgradeSubscriptionView.as_view(), name="subscription-upgrade"),
    path("cancel/", CancelSubscriptionView.as_view(), name="subscription-cancel"),
    path("payments/", SubscriptionPaymentListView.as_view(), name="subscription-payments"),
    path("usage/", SubscriptionUsageView.as_view(), name="subscription-usage"),
    path("compare/", SubscriptionComparisonView.as_view(), name="subscription-compare"),
]
