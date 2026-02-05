"""
REST API endpoints для платежів через Stripe
"""

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
import stripe
import json
import hmac
import hashlib

from orders.models import Order
from .stripe_handler import StripePaymentHandler
from .models import Payment
from .serializers import PaymentSerializer
import logging

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_payment_intent(request):
    """
    Створити Stripe Payment Intent для замовлення
    """
    try:
        order_id = request.data.get("order_id")

        if not order_id:
            return Response(
                {"error": "order_id обов'язково"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Перевірити, що замовлення належить користувачу
        order = Order.objects.get(id=order_id, store__owner=request.user)

        # Перевірити, що замовлення ще не оплачене
        if order.payment_status == "paid":
            return Response(
                {"error": "Замовлення вже оплачене"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Створити Payment Intent
        result = StripePaymentHandler.create_payment_intent(
            order_id=order_id, amount=order.total_amount, currency=order.currency
        )

        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    except Order.DoesNotExist:
        return Response(
            {"error": "Замовлення не знайдено"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Помилка при створенні Payment Intent: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirm_stripe_payment(request):
    """
    Підтвердити платіж через Stripe
    """
    try:
        order_id = request.data.get("order_id")
        payment_intent_id = request.data.get("payment_intent_id")

        if not order_id or not payment_intent_id:
            return Response(
                {"error": "order_id та payment_intent_id обов'язково"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Перевірити, що замовлення належит користувачу
        order = Order.objects.get(id=order_id, store__owner=request.user)

        # Підтвердити платіж
        result = StripePaymentHandler.confirm_payment(order_id, payment_intent_id)

        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    except Order.DoesNotExist:
        return Response(
            {"error": "Замовлення не знайдено"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Помилка при підтвердженні платежу: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refund_stripe_payment(request):
    """
    Повернути платіж через Stripe
    """
    try:
        payment_id = request.data.get("payment_id")
        amount = request.data.get("amount")  # Опціонально, для часткового повернення

        if not payment_id:
            return Response(
                {"error": "payment_id обов'язково"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Перевірити, що платіж належить користувачу
        payment = Payment.objects.get(
            id=payment_id, order__store__owner=request.user, payment_method="stripe"
        )

        # Повернути платіж
        result = StripePaymentHandler.refund_payment(payment_id, amount)

        if result["success"]:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

    except Payment.DoesNotExist:
        return Response(
            {"error": "Платіж не знайдено"}, status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Помилка при повернені платежу: {e}")
        return Response(
            {"error": "Помилка при обробці запиту"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request):
    """
    Обробник webhook від Stripe
    """
    try:
        # Отримати обробник подій
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        # Перевірити підпис webhook
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )

        # Обробити подію
        result = StripePaymentHandler.handle_webhook(event)

        return Response(result, status=status.HTTP_200_OK)

    except ValueError:
        # Некоректний payload
        return Response(
            {"error": "Некоректний payload"}, status=status.HTTP_400_BAD_REQUEST
        )
    except stripe.error.SignatureVerificationError:
        # Некоректний підпис
        return Response(
            {"error": "Некоректний підпис webhook"}, status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        logger.error(f"Помилка при обробці webhook: {e}")
        return Response(
            {"error": "Помилка при обробці webhook"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
