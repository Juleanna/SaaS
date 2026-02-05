"""
Stripe платежна інтеграція
"""

import stripe
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Налаштування Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


class StripePaymentHandler:
    """Обробник платежів через Stripe"""

    @staticmethod
    def create_payment_intent(order_id, amount, currency="uah", metadata=None):
        """
        Створити Payment Intent для замовлення
        """
        try:
            from orders.models import Order

            order = Order.objects.get(id=order_id)

            # Перевести суму в найменшу одиницю (копійки)
            amount_cents = int(float(amount) * 100)

            # Налаштування метаданих
            if metadata is None:
                metadata = {}

            metadata.update(
                {
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "store_id": order.store.id,
                    "store_name": order.store.name,
                }
            )

            # Створити Payment Intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                metadata=metadata,
                description=f"Платіж для замовлення {order.order_number}",
                receipt_email=order.customer_email,
            )

            logger.info(
                f"Payment Intent створено: {intent.id} для замовлення {order_id}"
            )

            return {
                "success": True,
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": amount,
                "currency": currency,
            }

        except stripe.error.CardError as e:
            logger.error(f"Помилка картки: {e.user_message}")
            return {"success": False, "error": f"Помилка картки: {e.user_message}"}
        except stripe.error.RateLimitError:
            logger.error("Занадто багато запитів до Stripe")
            return {
                "success": False,
                "error": "Сервіс тимчасово недоступний. Спробуйте пізніше.",
            }
        except stripe.error.InvalidRequestError as e:
            logger.error(f"Некоректний запит Stripe: {e}")
            return {
                "success": False,
                "error": "Помилка обробки платежу. Перевірте дані.",
            }
        except stripe.error.AuthenticationError:
            logger.error("Помилка автентифікації Stripe")
            return {"success": False, "error": "Помилка сервера платежів"}
        except Exception as e:
            logger.error(f"Невідома помилка Stripe: {e}")
            return {"success": False, "error": "Помилка при обробці платежу"}

    @staticmethod
    def confirm_payment(order_id, payment_intent_id):
        """
        Підтвердити платіж через Payment Intent ID
        """
        try:
            from orders.models import Order
            from payments.models import Payment

            order = Order.objects.get(id=order_id)

            # Отримати Payment Intent з Stripe
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)

            if intent.status == "succeeded":
                # Отримати або створити платіж
                payment, created = Payment.objects.get_or_create(
                    order=order,
                    payment_method="stripe",
                    defaults={
                        "amount": Decimal(intent.amount) / 100,
                        "currency": intent.currency.upper(),
                        "external_payment_id": payment_intent_id,
                        "status": "completed",
                        "paid_at": timezone.now(),
                    },
                )

                if created:
                    logger.info(
                        f"Платіж створено: {payment.id} для замовлення {order_id}"
                    )

                # Позначити платіж як завершений
                if payment.status != "completed":
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.save()

                # Оновити статус замовлення
                if order.payment_status != "paid":
                    order.payment_status = "paid"
                    order.save()

                return {
                    "success": True,
                    "message": "Платіж успішно завершено",
                    "payment_id": payment.id,
                }

            elif intent.status == "requires_payment_method":
                return {"success": False, "error": "Платіж вимагає способу оплати"}

            elif intent.status == "requires_action":
                return {
                    "success": False,
                    "error": "Платіж вимагає додаткової дії",
                    "client_secret": intent.client_secret,
                }

            else:
                return {"success": False, "error": f"Платіж в статусі: {intent.status}"}

        except Order.DoesNotExist:
            logger.error(f"Замовлення {order_id} не знайдено")
            return {"success": False, "error": "Замовлення не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при підтвердженні платежу: {e}")
            return {"success": False, "error": "Помилка при обробці платежу"}

    @staticmethod
    def refund_payment(payment_id, amount=None):
        """
        Повернути платіж повністю або частково
        """
        try:
            from payments.models import Payment, Refund
            from orders.models import Order

            payment = Payment.objects.get(id=payment_id, payment_method="stripe")

            # Сума повернення в копійках
            refund_amount = int(float(amount or payment.amount) * 100)

            # Створити повернення через Stripe
            refund = stripe.Refund.create(
                payment_intent=payment.external_payment_id,
                amount=refund_amount if amount else None,  # None = повна сума
            )

            if refund.status == "succeeded":
                # Створити запис про повернення
                refund_obj = Refund.objects.create(
                    payment=payment,
                    amount=Decimal(refund_amount) / 100 if amount else payment.amount,
                    status="completed",
                    external_refund_id=refund.id,
                )

                logger.info(
                    f"Повернення створено: {refund_obj.id} для платежу {payment_id}"
                )

                # Оновити статус платежу
                payment.status = "refunded"
                payment.save()

                # Оновити статус замовлення
                order = payment.order
                if amount is None or amount >= payment.amount:
                    order.status = "refunded"
                    order.payment_status = "refunded"
                order.save()

                return {
                    "success": True,
                    "message": "Платіж успішно повернено",
                    "refund_id": refund_obj.id,
                }
            else:
                return {
                    "success": False,
                    "error": f"Статус повернення: {refund.status}",
                }

        except Payment.DoesNotExist:
            logger.error(f"Платіж {payment_id} не знайдено або не є Stripe платежем")
            return {"success": False, "error": "Платіж не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при повернені платежу: {e}")
            return {"success": False, "error": "Помилка при повернені платежу"}

    @staticmethod
    def handle_webhook(event):
        """
        Обробити webhook від Stripe
        """
        try:
            from payments.models import Payment
            from orders.models import Order

            if event["type"] == "payment_intent.succeeded":
                intent = event["data"]["object"]

                # Отримати замовлення з метаданих
                order_id = intent["metadata"].get("order_id")

                if order_id:
                    order = Order.objects.get(id=order_id)

                    # Отримати або створити платіж
                    payment, created = Payment.objects.get_or_create(
                        order=order,
                        payment_method="stripe",
                        defaults={
                            "amount": Decimal(intent["amount"]) / 100,
                            "currency": intent["currency"].upper(),
                            "external_payment_id": intent["id"],
                            "status": "completed",
                            "paid_at": timezone.now(),
                        },
                    )

                    if payment.status != "completed":
                        payment.status = "completed"
                        payment.paid_at = timezone.now()
                        payment.save()

                    order.payment_status = "paid"
                    order.save()

                    logger.info(f"Webhook: платіж завершено для замовлення {order_id}")

            elif event["type"] == "payment_intent.payment_failed":
                intent = event["data"]["object"]
                order_id = intent["metadata"].get("order_id")

                if order_id:
                    order = Order.objects.get(id=order_id)
                    order.payment_status = "failed"
                    order.save()

                    logger.warning(
                        f"Webhook: платіж не вдався для замовлення {order_id}"
                    )

            elif event["type"] == "charge.refunded":
                charge = event["data"]["object"]
                intent_id = charge.get("payment_intent")

                if intent_id:
                    payment = Payment.objects.filter(
                        external_payment_id=intent_id, payment_method="stripe"
                    ).first()

                    if payment:
                        payment.status = "refunded"
                        payment.save()

                        logger.info(
                            f"Webhook: платіж повернено для платежу {payment.id}"
                        )

            return {"status": "success"}

        except Exception as e:
            logger.error(f"Помилка при обробці webhook: {e}")
            return {"status": "error", "message": str(e)}
