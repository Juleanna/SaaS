"""
ЮKassa платежна інтеграція (для РФ та інших країн СНД)
"""

from yookassa import Configuration, Payment as YooKassaPayment
from yookassa.domain.common.payment_status import PaymentStatus
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import uuid
import logging

logger = logging.getLogger(__name__)

# Налаштування ЮKassa
Configuration.account_id = settings.YOOKASSA_SHOP_ID
Configuration.secret_key = settings.YOOKASSA_SECRET_KEY


class YooKassaPaymentHandler:
    """Обробник платежів через ЮKassa"""

    @staticmethod
    def create_payment(order_id, return_url):
        """
        Створити платіж через ЮKassa
        """
        try:
            from orders.models import Order

            order = Order.objects.get(id=order_id)

            # Деталь платежу
            payment_data = {
                "amount": {
                    "value": str(order.total_amount),
                    "currency": order.currency,
                },
                "payment_method_data": {"type": "bank_card"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "receipt": {
                    "customer": {
                        "full_name": order.customer_name,
                        "email": order.customer_email,
                        "phone": order.customer_phone,
                    },
                    "items": [],
                },
                "metadata": {
                    "order_id": str(order.id),
                    "order_number": order.order_number,
                },
                "capture": True,
                "description": f"Платіж для замовлення {order.order_number}",
            }

            # Додати товари до квитанції
            for item in order.items.all():
                payment_data["receipt"]["items"].append(
                    {
                        "description": item.product.name,
                        "quantity": str(item.quantity),
                        "amount": {
                            "value": str(item.price * item.quantity),
                            "currency": order.currency,
                        },
                        "vat_code": 1,  # БЕЗ ПДВ
                    }
                )

            # Створити платіж
            payment = YooKassaPayment.create(payment_data, str(uuid.uuid4()))

            logger.info(
                f"ЮKassa платіж створено: {payment.id} для замовлення {order_id}"
            )

            return {
                "success": True,
                "payment_id": payment.id,
                "confirmation_url": payment.confirmation.confirmation_url,
            }

        except Order.DoesNotExist:
            logger.error(f"Замовлення {order_id} не знайдено")
            return {"success": False, "error": "Замовлення не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при створенні ЮKassa платежу: {e}")
            return {"success": False, "error": str(e)}

    @staticmethod
    def get_payment_status(payment_id, order_id):
        """
        Отримати статус платежу від ЮKassa
        """
        try:
            from orders.models import Order
            from payments.models import Payment

            order = Order.objects.get(id=order_id)

            # Отримати платіж з ЮKassa
            payment = YooKassaPayment.find_one(payment_id)

            if payment.status == PaymentStatus.SUCCEEDED:
                # Отримати або створити платіж в системі
                payment_obj, created = Payment.objects.get_or_create(
                    order=order,
                    payment_method="yookassa",
                    defaults={
                        "amount": order.total_amount,
                        "currency": order.currency,
                        "external_payment_id": payment_id,
                        "transaction_id": payment_id,
                        "status": "completed",
                        "paid_at": timezone.now(),
                    },
                )

                if created:
                    logger.info(
                        f"ЮKassa платіж завершено: {payment_obj.id} для замовлення {order_id}"
                    )

                # Оновити статус замовлення
                order.payment_status = "paid"
                order.save()

                return {
                    "success": True,
                    "status": "completed",
                    "message": "Платіж успішно завершено",
                    "payment_id": payment_obj.id,
                }

            elif payment.status == PaymentStatus.PENDING:
                return {
                    "success": True,
                    "status": "pending",
                    "message": "Платіж в обробці",
                }

            elif payment.status == PaymentStatus.CANCELED:
                return {
                    "success": False,
                    "status": "cancelled",
                    "error": "Платіж скасовано",
                }

            else:
                return {
                    "success": False,
                    "status": payment.status,
                    "error": f"Невідомий статус: {payment.status}",
                }

        except Order.DoesNotExist:
            logger.error(f"Замовлення {order_id} не знайдено")
            return {"success": False, "error": "Замовлення не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при отриманні статусу ЮKassa платежу: {e}")
            return {"success": False, "error": "Помилка при обробці запиту"}

    @staticmethod
    def refund_payment(payment_id, amount=None):
        """
        Повернути платіж через ЮKassa
        """
        try:
            from payments.models import Payment, Refund

            payment = Payment.objects.get(id=payment_id, payment_method="yookassa")

            # Дані для повернення
            refund_data = {
                "payment_id": payment.external_payment_id,
            }

            if amount:
                refund_data["amount"] = {
                    "value": str(amount),
                    "currency": payment.currency,
                }

            # Створити повернення
            from yookassa import Refund as YooKassaRefund

            refund = YooKassaRefund.create(refund_data, str(uuid.uuid4()))

            if refund.status == PaymentStatus.SUCCEEDED:
                # Створити запис про повернення
                refund_obj = Refund.objects.create(
                    payment=payment,
                    amount=Decimal(amount) if amount else payment.amount,
                    status="completed",
                    external_refund_id=refund.id,
                )

                logger.info(
                    f"ЮKassa повернення створено: {refund_obj.id} для платежу {payment_id}"
                )

                # Оновити статус платежу
                payment.status = "refunded"
                payment.save()

                return {
                    "success": True,
                    "message": "Платіж успішно повернено",
                    "refund_id": refund_obj.id,
                }
            else:
                return {
                    "success": False,
                    "error": f"Помилка повернення: {refund.status}",
                }

        except Payment.DoesNotExist:
            logger.error(f"Платіж {payment_id} не знайдено")
            return {"success": False, "error": "Платіж не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при повернені ЮKassa платежу: {e}")
            return {"success": False, "error": "Помилка при обробці повернення"}

    @staticmethod
    def handle_webhook(request_data):
        """
        Обробити webhook від ЮKassa
        """
        try:
            from orders.models import Order
            from payments.models import Payment

            event_type = request_data.get("event")
            payment_data = request_data.get("object")

            if event_type == "payment.succeeded":
                payment_id = payment_data.get("id")
                order_id = payment_data.get("metadata", {}).get("order_id")

                if order_id:
                    order = Order.objects.get(id=order_id)

                    # Отримати або створити платіж
                    payment, created = Payment.objects.get_or_create(
                        order=order,
                        payment_method="yookassa",
                        defaults={
                            "amount": Decimal(payment_data["amount"]["value"]),
                            "currency": payment_data["amount"]["currency"],
                            "external_payment_id": payment_id,
                            "transaction_id": payment_id,
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

                    logger.info(
                        f"Webhook: ЮKassa платіж завершено для замовлення {order_id}"
                    )

            elif event_type == "payment.canceled":
                order_id = payment_data.get("metadata", {}).get("order_id")

                if order_id:
                    order = Order.objects.get(id=order_id)
                    order.payment_status = "failed"
                    order.save()

                    logger.warning(
                        f"Webhook: ЮKassa платіж скасовано для замовлення {order_id}"
                    )

            return {"status": "success"}

        except Exception as e:
            logger.error(f"Помилка при обробці ЮKassa webhook: {e}")
            return {"status": "error", "message": str(e)}
