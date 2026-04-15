"""
API views для системи підписок та тарифних планів
"""

from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django.contrib.auth import get_user_model
from datetime import timedelta

from .subscription_models import (
    SubscriptionPlan,
    UserSubscription,
    SubscriptionPayment,
)
from .subscription_serializers import (
    SubscriptionPlanSerializer,
    SubscriptionPlanDetailSerializer,
    UserSubscriptionSerializer,
    SubscriptionPaymentSerializer,
)
import logging

logger = logging.getLogger(__name__)


class SubscriptionPlanListView(generics.ListAPIView):
    """Отримати список доступних планів підписки"""

    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by("order")
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        return SubscriptionPlanSerializer


class SubscriptionPlanDetailView(generics.RetrieveAPIView):
    """Отримати детальну інформацію про план підписки"""

    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"


class CurrentUserSubscriptionView(generics.RetrieveAPIView):
    """Отримати поточну підписку користувача"""

    serializer_class = UserSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        subscription, created = UserSubscription.objects.get_or_create(
            user=self.request.user,
            defaults={
                "plan": SubscriptionPlan.objects.filter(slug="free").first()
                or SubscriptionPlan.objects.first(),
                "expires_at": timezone.now() + timedelta(days=365),
            },
        )
        return subscription


class UpgradeSubscriptionView(generics.CreateAPIView):
    """Оновити план підписки користувача"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        plan_id = request.data.get("plan_id")
        if not plan_id:
            return Response(
                {"error": "plan_id обов'язково"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {"error": "План не знайдено"}, status=status.HTTP_404_NOT_FOUND
            )

        User = get_user_model()
        period_days = 30 if plan.billing_cycle == "monthly" else 365

        try:
            with transaction.atomic():
                # Блокуємо запис користувача — захист від паралельних списань
                user = User.objects.select_for_update().get(pk=request.user.pk)

                # Перевірка балансу до будь-яких змін
                if plan.price > 0 and user.balance < plan.price:
                    return Response(
                        {
                            "error": "insufficient_balance",
                            "message": f"Недостатньо коштів на рахунку. Поточний баланс: {float(user.balance):.2f} ₴, потрібно: {float(plan.price):.2f} ₴. Будь ласка, поповніть рахунок.",
                            "balance": float(user.balance),
                            "required": float(plan.price),
                            "shortfall": float(plan.price - user.balance),
                        },
                        status=status.HTTP_402_PAYMENT_REQUIRED,
                    )

                subscription, created = UserSubscription.objects.select_for_update().get_or_create(
                    user=user,
                    defaults={
                        "plan": plan,
                        "expires_at": timezone.now() + timedelta(days=period_days),
                    },
                )

                if not created:
                    old_plan = subscription.plan
                    subscription.plan = plan
                    subscription.expires_at = timezone.now() + timedelta(days=period_days)
                    subscription.status = "active"
                    subscription.save()
                    logger.info(
                        "Користувач %s оновив план з %s на %s",
                        user.email, old_plan.name, plan.name,
                    )

                # Синхронізуємо поля User
                user.subscription_plan = plan.slug
                user.is_subscribed = plan.slug != 'free'

                payment = None
                if plan.price > 0:
                    user.balance -= plan.price
                    user.monthly_spending += plan.price
                    user.total_spent += plan.price
                    user.save(update_fields=[
                        'subscription_plan', 'is_subscribed',
                        'balance', 'monthly_spending', 'total_spent',
                    ])

                    payment = SubscriptionPayment.objects.create(
                        subscription=subscription,
                        amount=plan.price,
                        currency="UAH",
                        status="completed",
                        paid_at=timezone.now(),
                    )
                    logger.info(
                        "Списано %s ₴ з балансу %s. Залишок: %s ₴",
                        plan.price, user.email, user.balance,
                    )
                else:
                    user.save(update_fields=['subscription_plan', 'is_subscribed'])
        except Exception:
            logger.exception("Помилка при оновленні плану для користувача %s", request.user.pk)
            return Response(
                {"error": "Помилка при обробці запиту"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response_data = {
            "subscription": UserSubscriptionSerializer(subscription).data,
            "amount": float(plan.price),
            "new_balance": float(user.balance),
        }
        if payment:
            response_data["payment_id"] = payment.id
            response_data["payment_required"] = False
        return Response(response_data, status=status.HTTP_201_CREATED)


class CancelSubscriptionView(generics.CreateAPIView):
    """Скасувати підписку користувача"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            subscription = UserSubscription.objects.get(user=request.user)

            if subscription.status == "cancelled":
                return Response(
                    {"error": "Підписка вже скасована"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subscription.cancel()

            # Синхронізуємо User модель
            request.user.subscription_plan = 'free'
            request.user.is_subscribed = False
            request.user.save(update_fields=['subscription_plan', 'is_subscribed'])

            logger.info(f"Користувач {request.user.email} скасував підписку")

            return Response(
                {"message": "Підписка успішно скасована"}, status=status.HTTP_200_OK
            )

        except UserSubscription.DoesNotExist:
            return Response(
                {"error": "Підписка не знайдена"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Помилка при скасуванні підписки: {e}")
            return Response(
                {"error": "Помилка при обробці запиту"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubscriptionPaymentListView(generics.ListAPIView):
    """Отримати список платежів за підписку користувача"""

    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SubscriptionPayment.objects.filter(
            subscription__user=self.request.user
        ).order_by("-created_at")


class SubscriptionUsageView(APIView):
    """Отримати інформацію про використання плану"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        try:
            subscription = UserSubscription.objects.get(user=request.user)
            plan = subscription.plan

            # Отримати статистику
            stores_count = request.user.store_set.count()

            # Загальна кількість товарів
            from stores.models import Store

            products_count = 0
            for store in request.user.store_set.all():
                products_count += store.products.count()

            # Замовлення за цей місяць
            from orders.models import Order
            from datetime import datetime
            from django.utils import timezone

            current_month_start = timezone.now().replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            orders_count = Order.objects.filter(
                store__owner=request.user, created_at__gte=current_month_start
            ).count()

            usage = {
                "subscription": UserSubscriptionSerializer(subscription).data,
                "limits": {
                    "max_stores": plan.max_stores,
                    "max_products": plan.max_products,
                    "max_monthly_orders": plan.max_monthly_orders,
                },
                "usage": {
                    "stores": stores_count,
                    "products": products_count,
                    "monthly_orders": orders_count,
                },
                "remaining": {
                    "stores": max(0, plan.max_stores - stores_count),
                    "products": max(0, plan.max_products - products_count),
                    "monthly_orders": max(0, plan.max_monthly_orders - orders_count),
                },
                "features": {
                    "analytics": plan.has_analytics,
                    "email_support": plan.has_email_support,
                    "priority_support": plan.has_priority_support,
                    "custom_domain": plan.has_custom_domain,
                    "api_access": plan.has_api_access,
                    "integrations": plan.has_integrations,
                },
            }

            return Response(usage, status=status.HTTP_200_OK)

        except UserSubscription.DoesNotExist:
            return Response(
                {"error": "Підписка не знайдена"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Помилка при отриманні інформації про використання: {e}")
            return Response(
                {"error": "Помилка при обробці запиту"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class SubscriptionComparisonView(generics.ListAPIView):
    """Отримати порівняння планів для відображення у таблиці"""

    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            plans = SubscriptionPlan.objects.filter(is_active=True).order_by("price")

            # Отримати всі особливості
            from .subscription_models import PlanFeature

            features = PlanFeature.objects.all().order_by("order")

            # Побудувати порівняння
            comparison = {
                "plans": SubscriptionPlanDetailSerializer(plans, many=True).data,
                "features": [
                    {
                        "id": feature.id,
                        "name": feature.name,
                        "slug": feature.slug,
                        "description": feature.description,
                    }
                    for feature in features
                ],
            }

            return Response(comparison, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Помилка при отриманні порівняння планів: {e}")
            return Response(
                {"error": "Помилка при обробці запиту"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
