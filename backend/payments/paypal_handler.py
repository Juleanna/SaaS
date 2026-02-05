"""
PayPal платежна інтеграція
"""

import paypalrestsdk
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Налаштування PayPal
paypalrestsdk.configure(
    {
        "mode": "sandbox" if settings.DEBUG else "live",
        "client_id": settings.PAYPAL_CLIENT_ID,
        "client_secret": settings.PAYPAL_CLIENT_SECRET,
    }
)


class PayPalPaymentHandler:
    """Обробник платежів через PayPal"""

    @staticmethod
    def create_payment(order_id, return_url, cancel_url):
        """
        Створити платіж через PayPal
        """
        try:
            from orders.models import Order

            order = Order.objects.get(id=order_id)

            # Деталі платежу
            payment_items = []
            for item in order.items.all():
                payment_items.append(
                    {
                        "name": item.product.name,
                        "sku": str(item.product.id),
                        "price": str(item.price),
                        "currency": order.currency,
                        "quantity": item.quantity,
                    }
                )

            # Створити платіж
            payment = paypalrestsdk.Payment(
                {
                    "intent": "sale",
                    "payer": {"payment_method": "paypal"},
                    "redirect_urls": {
                        "return_url": return_url,
                        "cancel_url": cancel_url,
                    },
                    "transactions": [
                        {
                            "item_list": {"items": payment_items},
                            "amount": {
                                "total": str(order.total_amount),
                                "currency": order.currency,
                                "details": {
                                    "subtotal": str(order.subtotal),
                                    "tax": str(order.tax_amount),
                                    "shipping": str(order.shipping_cost),
                                },
                            },
                            "description": f"Платіж для замовлення {order.order_number}",
                            "invoice_number": order.order_number,
                            "custom": str(order.id),
                        }
                    ],
                }
            )

            if payment.create():
                logger.info(
                    f"PayPal платіж створено: {payment.id} для замовлення {order_id}"
                )

                # Отримати URL для редиректу
                for link in payment.links:
                    if link.rel == "approval_url":
                        return {
                            "success": True,
                            "payment_id": payment.id,
                            "approval_url": link.href,
                        }
            else:
                logger.error(f"Помилка при створенні PayPal платежу: {payment.error}")
                return {
                    "success": False,
                    "error": payment.error.get("message", "Невідома помилка"),
                }

        except Order.DoesNotExist:
            logger.error(f"Замовлення {order_id} не знайдено")
            return {"success": False, "error": "Замовлення не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при створенні PayPal платежу: {e}")
            return {"success": False, "error": "Помилка при обробці платежу"}

    @staticmethod
    def execute_payment(payment_id, payer_id, order_id):
        """
        Виконати платіж через PayPal
        """
        try:
            from orders.models import Order
            from payments.models import Payment

            order = Order.objects.get(id=order_id)

            # Отримати платіж
            payment = paypalrestsdk.Payment.find(payment_id)

            if payment.execute({"payer_id": payer_id}):
                # Отримати або створити платіж в системі
                payment_obj, created = Payment.objects.get_or_create(
                    order=order,
                    payment_method="paypal",
                    defaults={
                        "amount": order.total_amount,
                        "currency": order.currency,
                        "external_payment_id": payment_id,
                        "transaction_id": payment.id,
                        "status": "completed",
                        "paid_at": timezone.now(),
                    },
                )

                if created:
                    logger.info(
                        f"PayPal платіж завершено: {payment_obj.id} для замовлення {order_id}"
                    )

                # Оновити статус замовлення
                order.payment_status = "paid"
                order.save()

                return {
                    "success": True,
                    "message": "Платіж успішно завершено",
                    "payment_id": payment_obj.id,
                    "transaction_id": payment.id,
                }
            else:
                logger.error(f"Помилка при виконанні PayPal платежу: {payment.error}")
                return {
                    "success": False,
                    "error": payment.error.get("message", "Невідома помилка"),
                }

        except Order.DoesNotExist:
            logger.error(f"Замовлення {order_id} не знайдено")
            return {"success": False, "error": "Замовлення не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при виконанні PayPal платежу: {e}")
            return {"success": False, "error": "Помилка при обробці платежу"}

    @staticmethod
    def refund_payment(payment_id, amount=None):
        """
        Повернути платіж через PayPal
        """
        try:
            from payments.models import Payment, Refund

            payment = Payment.objects.get(id=payment_id, payment_method="paypal")

            # Отримати продаж з PayPal
            paypal_payment = paypalrestsdk.Payment.find(payment.external_payment_id)

            # Отримати ID продажу
            sale_id = None
            if paypal_payment.transactions:
                related_resources = paypal_payment.transactions[0].get(
                    "related_resources", []
                )
                if related_resources and "sale" in related_resources[0]:
                    sale_id = related_resources[0]["sale"].get("id")

            if not sale_id:
                return {
                    "success": False,
                    "error": "Не знайдено ID продажу для повернення",
                }

            # Отримати продаж та повернути
            sale = paypalrestsdk.Sale.find(sale_id)

            refund_amount = str(amount) if amount else None

            if sale.refund(
                {"amount": {"currency": payment.currency, "total": refund_amount}}
                if refund_amount
                else {}
            ):
                # Створити запис про повернення
                refund_obj = Refund.objects.create(
                    payment=payment,
                    amount=Decimal(refund_amount) if refund_amount else payment.amount,
                    status="completed",
                    external_refund_id=sale.refund_id,
                )

                logger.info(
                    f"PayPal повернення створено: {refund_obj.id} для платежу {payment_id}"
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
                logger.error(f"Помилка при повернені PayPal платежу: {sale.error}")
                return {
                    "success": False,
                    "error": sale.error.get("message", "Невідома помилка"),
                }

        except Payment.DoesNotExist:
            logger.error(f"Платіж {payment_id} не знайдено")
            return {"success": False, "error": "Платіж не знайдено"}
        except Exception as e:
            logger.error(f"Помилка при повернені PayPal платежу: {e}")
            return {"success": False, "error": "Помилка при обробці повернення"}
