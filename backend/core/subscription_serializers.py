"""
Serializers для підписок
"""

from rest_framework import serializers
from .subscription_models import (
    SubscriptionPlan,
    UserSubscription,
    SubscriptionPayment,
    PlanFeature,
    PlanFeatureValue,
)


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer для плану підписки"""

    features_list = serializers.CharField(read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "billing_cycle",
            "max_stores",
            "max_products",
            "max_monthly_orders",
            "has_analytics",
            "has_email_support",
            "has_priority_support",
            "has_custom_domain",
            "has_api_access",
            "has_integrations",
            "commission_percentage",
            "is_active",
            "is_featured",
            "features_list",
        ]
        read_only_fields = fields


class SubscriptionPlanDetailSerializer(serializers.ModelSerializer):
    """Детальний serializer для плану підписки"""

    features_list = serializers.SerializerMethodField()
    feature_values = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionPlan
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price",
            "billing_cycle",
            "max_stores",
            "max_products",
            "max_monthly_orders",
            "has_analytics",
            "has_email_support",
            "has_priority_support",
            "has_custom_domain",
            "has_api_access",
            "has_integrations",
            "commission_percentage",
            "is_active",
            "is_featured",
            "features_list",
            "feature_values",
        ]
        read_only_fields = fields

    def get_features_list(self, obj):
        return obj.features_list

    def get_feature_values(self, obj):
        values = obj.feature_values.all()
        return [
            {
                "feature": v.feature.slug,
                "feature_name": v.feature.name,
                "value": v.value,
            }
            for v in values
        ]


class UserSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer для підписки користувача"""

    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_details = SubscriptionPlanSerializer(source="plan", read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserSubscription
        fields = [
            "id",
            "plan",
            "plan_name",
            "plan_details",
            "status",
            "started_at",
            "expires_at",
            "cancelled_at",
            "next_billing_date",
            "is_active",
            "days_remaining",
        ]
        read_only_fields = ["id", "started_at", "is_active", "days_remaining"]


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    """Serializer для платежу за підписку"""

    user_email = serializers.CharField(source="subscription.user.email", read_only=True)
    plan_name = serializers.CharField(source="subscription.plan.name", read_only=True)

    class Meta:
        model = SubscriptionPayment
        fields = [
            "id",
            "subscription",
            "user_email",
            "plan_name",
            "amount",
            "currency",
            "status",
            "stripe_invoice_id",
            "transaction_id",
            "created_at",
            "paid_at",
        ]
        read_only_fields = fields


class PlanFeatureSerializer(serializers.ModelSerializer):
    """Serializer для особливості плану"""

    class Meta:
        model = PlanFeature
        fields = ["id", "name", "slug", "description", "feature_type"]
        read_only_fields = fields


class PlanFeatureValueSerializer(serializers.ModelSerializer):
    """Serializer для значення особливості плану"""

    feature_name = serializers.CharField(source="feature.name", read_only=True)
    feature_slug = serializers.CharField(source="feature.slug", read_only=True)

    class Meta:
        model = PlanFeatureValue
        fields = ["id", "plan", "feature", "feature_name", "feature_slug", "value"]
        read_only_fields = ["id", "feature_name", "feature_slug"]
