"""
Django сигнали для асинхронної обробки подій
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from core.tasks import (
    send_order_confirmation_email,
    send_order_status_changed_email,
    send_payment_confirmation_email,
    send_seller_notification_email,
    send_telegram_notification,
    send_order_notification_to_seller,
    send_payment_notification_to_seller,
)
from orders.models import Order, OrderItem
from payments.models import Payment
from notifications.models import Notification
import logging

logger = logging.getLogger(__name__)


# ==================== ORDER SIGNALS ====================


@receiver(post_save, sender=Order)
def on_order_created(sender, instance, created, **kwargs):
    """
    Сигнал при створенні нового замовлення
    """
    if created:
        logger.info(f"Замовлення {instance.order_number} створено")

        # Відправити email підтвердження замовлення
        if instance.customer_email:
            send_order_confirmation_email.delay(instance.id)

        # Відправити Telegram сповіщення продавцю
        if instance.store.owner.telegram_chat_id:
            send_order_notification_to_seller.delay(instance.id)

        # Створити сповіщення для продавця
        Notification.objects.create(
            user=instance.store.owner,
            notification_type="order_created",
            title=_("Нове замовлення"),
            message=_(
                "Отримано нове замовлення № %(order_number)s від %(customer_name)s"
            )
            % {
                "order_number": instance.order_number,
                "customer_name": instance.customer_name,
            },
            related_order=instance,
        )


@receiver(pre_save, sender=Order)
def on_order_status_changed(sender, instance, **kwargs):
    """
    Сигнал при зміні статусу замовлення
    """
    try:
        old_instance = Order.objects.get(pk=instance.pk)

        if old_instance.status != instance.status:
            logger.info(
                f"Статус замовлення {instance.order_number} змінено з {old_instance.status} на {instance.status}"
            )

            # Відправити email про зміну статусу
            if instance.customer_email:
                send_order_status_changed_email.delay(instance.id, instance.status)

            # Створити сповіщення для продавця
            Notification.objects.create(
                user=instance.store.owner,
                notification_type="order_status_changed",
                title=_("Статус замовлення змінено"),
                message=_("Статус замовлення № %(order_number)s змінено на %(status)s")
                % {
                    "order_number": instance.order_number,
                    "status": instance.get_status_display(),
                },
                related_order=instance,
            )
    except Order.DoesNotExist:
        pass


# ==================== PAYMENT SIGNALS ====================


@receiver(post_save, sender=Payment)
def on_payment_completed(sender, instance, created, **kwargs):
    """
    Сигнал при завершенні платежу
    """
    # Перевірити, чи статус змінився на 'completed'
    try:
        old_instance = Payment.objects.get(pk=instance.pk)
        status_changed = old_instance.status != instance.status
    except Payment.DoesNotExist:
        status_changed = created

    if instance.status == "completed" and status_changed:
        logger.info(f"Платіж {instance.id} завершено")

        order = instance.order

        # Відправити email про підтвердження платежу
        if order.customer_email:
            send_payment_confirmation_email.delay(instance.id)

        # Відправити Telegram сповіщення продавцю
        if order.store.owner.telegram_chat_id:
            send_payment_notification_to_seller.delay(instance.id)

        # Оновити статус платежу замовлення
        if order.payment_status != "paid":
            order.payment_status = "paid"
            order.save(update_fields=["payment_status"])

        # Створити сповіщення для продавця
        Notification.objects.create(
            user=order.store.owner,
            notification_type="payment_received",
            title=_("Платіж отримано"),
            message=_(
                "Платіж для замовлення № %(order_number)s у розмірі %(amount)s успішно оброблено"
            )
            % {
                "order_number": order.order_number,
                "amount": f"{instance.amount} {instance.currency}",
            },
            related_order=order,
        )


# ==================== NOTIFICATION SIGNALS ====================


@receiver(post_save, sender=Notification)
def on_notification_created(sender, instance, created, **kwargs):
    """
    Сигнал при створенні нового сповіщення
    """
    if created:
        logger.info(
            f"Сповіщення {instance.id} створено для користувача {instance.user.email}"
        )

        # Відправити email сповіщення, якщо користувач увімкнув
        if instance.user.email_notifications and instance.user.email:
            send_seller_notification_email.delay(instance.id)

        # Відправити Telegram сповіщення, якщо користувач увімкнув
        if instance.user.telegram_notifications and instance.user.telegram_chat_id:
            send_telegram_notification.delay(instance.id)


# Реєстрація сигналів
def ready():
    """Реєстрація сигналів при готівці додатка"""
    logger.info("Сигнали успішно зареєстровані")
