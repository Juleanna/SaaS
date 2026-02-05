"""
Celery завдання для асинхронної обробки операцій
"""

from celery import shared_task
from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils.translation import gettext as _
import logging
import requests

logger = logging.getLogger(__name__)


# ==================== EMAIL TASKS ====================


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id):
    """
    Відправити email підтвердження замовлення
    """
    try:
        from orders.models import Order

        order = Order.objects.get(id=order_id)

        # Підготовка контексту
        context = {
            "order": order,
            "store": order.store,
            "items": order.items.all(),
        }

        # Рендеринг HTML шаблону
        html_message = render_to_string("emails/order_confirmation.html", context)
        plain_message = strip_tags(html_message)

        # Відправка email
        send_mail(
            subject=_("Замовлення #%(order_number)s підтверджено")
            % {"order_number": order.order_number},
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email підтвердження замовлення {order_id} успішно відправлено")
        return True

    except Order.DoesNotExist:
        logger.error(f"Замовлення {order_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(f"Помилка при відправці email для замовлення {order_id}: {exc}")
        # Повторити завдання через 60 секунд
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_status_changed_email(self, order_id, new_status):
    """
    Відправити email про зміну статусу замовлення
    """
    try:
        from orders.models import Order

        order = Order.objects.get(id=order_id)

        # Підготовка контексту
        context = {
            "order": order,
            "store": order.store,
            "new_status": new_status,
            "status_display": dict(Order.STATUS_CHOICES).get(new_status, new_status),
        }

        # Рендеринг HTML шаблону
        html_message = render_to_string("emails/order_status_changed.html", context)
        plain_message = strip_tags(html_message)

        # Відправка email
        send_mail(
            subject=_("Статус замовлення #%(order_number)s змінено")
            % {"order_number": order.order_number},
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(
            f"Email про зміну статусу для замовлення {order_id} успішно відправлено"
        )
        return True

    except Order.DoesNotExist:
        logger.error(f"Замовлення {order_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(f"Помилка при відправці email про зміну статусу {order_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_payment_confirmation_email(self, payment_id):
    """
    Відправити email про підтвердження платежу
    """
    try:
        from payments.models import Payment

        payment = Payment.objects.get(id=payment_id)
        order = payment.order

        # Підготовка контексту
        context = {
            "payment": payment,
            "order": order,
            "store": order.store,
        }

        # Рендеринг HTML шаблону
        html_message = render_to_string("emails/payment_confirmation.html", context)
        plain_message = strip_tags(html_message)

        # Відправка email
        send_mail(
            subject=_("Платіж для замовлення #%(order_number)s успішно оброблено")
            % {"order_number": order.order_number},
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.customer_email],
            html_message=html_message,
            fail_silently=False,
        )

        logger.info(f"Email підтвердження платежу {payment_id} успішно відправлено")
        return True

    except Payment.DoesNotExist:
        logger.error(f"Платіж {payment_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(f"Помилка при відправці email про платіж {payment_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_seller_notification_email(self, notification_id):
    """
    Відправити email сповіщення продавцю
    """
    try:
        from notifications.models import Notification

        notification = Notification.objects.get(id=notification_id)
        user = notification.user

        # Підготовка контексту
        context = {
            "notification": notification,
            "user": user,
        }

        # Рендеринг HTML шаблону
        html_message = render_to_string("emails/seller_notification.html", context)
        plain_message = strip_tags(html_message)

        # Відправка email
        send_mail(
            subject=notification.title,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )

        # Позначити як відправлено
        notification.email_sent = True
        notification.save(update_fields=["email_sent"])

        logger.info(
            f"Email сповіщення {notification_id} успішно відправлено користувачу {user.email}"
        )
        return True

    except Notification.DoesNotExist:
        logger.error(f"Сповіщення {notification_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(f"Помилка при відправці email сповіщення {notification_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


# ==================== TELEGRAM TASKS ====================


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_telegram_notification(self, notification_id):
    """
    Відправити Telegram сповіщення користувачу
    """
    try:
        from notifications.models import Notification

        notification = Notification.objects.get(id=notification_id)
        user = notification.user

        # Перевірити, чи користувач розв'язав Telegram
        if not user.telegram_chat_id:
            logger.warning(f"Користувач {user.email} не має Telegram chat ID")
            return False

        # Підготовка повідомлення
        message = f"<b>{notification.title}</b>\n\n{notification.message}"

        # Відправка через Telegram API
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": user.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML",
        }

        response = requests.post(url, json=payload, timeout=10)

        if response.status_code == 200:
            # Позначити як відправлено
            notification.telegram_sent = True
            notification.save(update_fields=["telegram_sent"])
            logger.info(f"Telegram сповіщення {notification_id} успішно відправлено")
            return True
        else:
            logger.error(f"Помилка Telegram API: {response.text}")
            raise self.retry(countdown=60)

    except Notification.DoesNotExist:
        logger.error(f"Сповіщення {notification_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(
            f"Помилка при відправці Telegram сповіщення {notification_id}: {exc}"
        )
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_notification_to_seller(self, order_id):
    """
    Відправити Telegram сповіщення продавцю про нове замовлення
    """
    try:
        from orders.models import Order

        order = Order.objects.get(id=order_id)
        seller = order.store.owner

        # Перевірити, чи продавець розв'язав Telegram
        if not seller.telegram_chat_id:
            logger.warning(f"Продавець {seller.email} не має Telegram chat ID")
            return False

        # Підготовка повідомлення
        message = (
            f"🔔 <b>Нове замовлення!</b>\n\n"
            f"<b>Номер:</b> {order.order_number}\n"
            f"<b>Клієнт:</b> {order.customer_name}\n"
            f"<b>Телефон:</b> {order.customer_phone}\n"
            f"<b>Сума:</b> {order.total_amount} {order.currency}\n"
            f"<b>Товарів:</b> {order.items.count()}\n"
        )

        # Відправка через Telegram API
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": seller.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML",
        }

        response = requests.post(url, json=payload, timeout=10)

        if response.status_code == 200:
            logger.info(
                f"Telegram сповіщення про замовлення {order_id} успішно відправлено продавцю"
            )
            return True
        else:
            logger.error(f"Помилка Telegram API: {response.text}")
            raise self.retry(countdown=60)

    except Order.DoesNotExist:
        logger.error(f"Замовлення {order_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(
            f"Помилка при відправці Telegram сповіщення продавцю {order_id}: {exc}"
        )
        raise self.retry(exc=exc, countdown=60)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_payment_notification_to_seller(self, payment_id):
    """
    Відправити Telegram сповіщення продавцю про платіж
    """
    try:
        from payments.models import Payment

        payment = Payment.objects.get(id=payment_id)
        order = payment.order
        seller = order.store.owner

        # Перевірити, чи продавець розв'язав Telegram
        if not seller.telegram_chat_id:
            logger.warning(f"Продавець {seller.email} не має Telegram chat ID")
            return False

        # Підготовка повідомлення
        message = (
            f"💰 <b>Платіж отримано!</b>\n\n"
            f"<b>Замовлення:</b> {order.order_number}\n"
            f"<b>Сума:</b> {payment.amount} {payment.currency}\n"
            f"<b>Метод:</b> {payment.get_payment_method_display()}\n"
            f"<b>ID транзакції:</b> {payment.transaction_id}\n"
        )

        # Відправка через Telegram API
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": seller.telegram_chat_id,
            "text": message,
            "parse_mode": "HTML",
        }

        response = requests.post(url, json=payload, timeout=10)

        if response.status_code == 200:
            logger.info(
                f"Telegram сповіщення про платіж {payment_id} успішно відправлено продавцю"
            )
            return True
        else:
            logger.error(f"Помилка Telegram API: {response.text}")
            raise self.retry(countdown=60)

    except Payment.DoesNotExist:
        logger.error(f"Платіж {payment_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(
            f"Помилка при відправці Telegram сповіщення про платіж {payment_id}: {exc}"
        )
        raise self.retry(exc=exc, countdown=60)


# ==================== PERIODIC TASKS ====================


@shared_task
def clean_old_notifications():
    """
    Видалити старі сповіщення (старші за 30 днів)
    """
    from datetime import timedelta
    from django.utils import timezone
    from notifications.models import Notification

    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = Notification.objects.filter(
        created_at__lt=cutoff_date, is_read=True
    ).delete()

    logger.info(f"Видалено {deleted_count} старих сповіщень")
    return deleted_count


@shared_task
def send_daily_seller_summary():
    """
    Відправити щоденне резюме продавцям
    """
    from datetime import timedelta
    from django.utils import timezone
    from accounts.models import User
    from orders.models import Order

    # Отримати всіх продавців з активною підпиской
    sellers = User.objects.filter(is_subscribed=True, is_active=True)

    for seller in sellers:
        try:
            # Отримати замовлення за останній день
            yesterday = timezone.now() - timedelta(days=1)
            orders = Order.objects.filter(
                store__owner=seller, created_at__gte=yesterday
            )

            if orders.exists():
                # Підготовка контексту
                context = {
                    "seller": seller,
                    "orders_count": orders.count(),
                    "total_revenue": sum(o.total_amount for o in orders),
                    "orders": orders[:5],  # Останні 5 замовлень
                }

                # Рендеринг HTML шаблону
                from django.template.loader import render_to_string
                from django.utils.html import strip_tags

                html_message = render_to_string("emails/daily_summary.html", context)
                plain_message = strip_tags(html_message)

                # Відправка email
                send_mail(
                    subject=_("Щоденне резюме продажів"),
                    message=plain_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[seller.email],
                    html_message=html_message,
                    fail_silently=True,
                )

                logger.info(f"Щоденне резюме відправлено {seller.email}")
        except Exception as e:
            logger.error(f"Помилка при відправці резюме для {seller.email}: {e}")


@shared_task
def generate_and_send_invoice(order_id):
    """
    Генерувати та відправити рахунок-фактуру
    """
    try:
        from orders.models import Order
        from django.core.mail import EmailMessage
        from reportlab.pdfgen import canvas
        from io import BytesIO

        order = Order.objects.get(id=order_id)

        # Генерація PDF
        buffer = BytesIO()
        c = canvas.Canvas(buffer)

        # Додати дані рахунку-фактури
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, 750, f"Рахунок-фактура #{order.order_number}")

        c.setFont("Helvetica", 10)
        y = 720
        c.drawString(50, y, f"Дата: {order.created_at.strftime('%d.%m.%Y')}")
        y -= 20
        c.drawString(50, y, f"Клієнт: {order.customer_name}")
        y -= 20
        c.drawString(50, y, f"Email: {order.customer_email}")
        y -= 20
        c.drawString(50, y, f"Телефон: {order.customer_phone}")

        y -= 40
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Товари:")
        y -= 20

        c.setFont("Helvetica", 10)
        for item in order.items.all():
            c.drawString(50, y, f"{item.product.name}")
            c.drawString(350, y, f"{item.quantity}x {item.price}")
            y -= 15

        y -= 20
        c.setFont("Helvetica-Bold", 12)
        c.drawString(350, y, f"Всього: {order.total_amount} {order.currency}")

        c.save()
        buffer.seek(0)

        # Відправка email з PDF
        email = EmailMessage(
            subject=f"Рахунок-фактура #{order.order_number}",
            body="Дякуємо за вашу покупку! Надбання вашого рахунку-фактури.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.customer_email],
        )
        email.attach(
            f"invoice_{order.order_number}.pdf", buffer.getvalue(), "application/pdf"
        )
        email.send(fail_silently=False)

        logger.info(f"Рахунок-фактура для замовлення {order_id} успішно відправлена")
        return True

    except Order.DoesNotExist:
        logger.error(f"Замовлення {order_id} не знайдено")
        return False
    except Exception as exc:
        logger.error(f"Помилка при генеруванні рахунку-фактури {order_id}: {exc}")
        return False
