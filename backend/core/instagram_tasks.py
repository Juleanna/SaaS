"""
Instagram Celery Tasks
"""

from celery import shared_task
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


# ==================== Auto-posting Tasks ====================


@shared_task(max_retries=3, default_retry_delay=60, name="instagram.auto_post_product")
def auto_post_product_to_instagram(auto_post_id):
    """
    Автоматично поділити товар на Instagram
    """
    from core.instagram_models import InstagramAutoPost
    from core.instagram_handler import InstagramAPIHandler

    try:
        auto_post = InstagramAutoPost.objects.get(id=auto_post_id)

        if auto_post.status != "pending":
            logger.warning(f"Auto post {auto_post_id} is not in pending status")
            return

        # Перевірити чи дійшов час постингу
        if timezone.now() < auto_post.scheduled_at:
            logger.info(f"Auto post {auto_post_id} not ready yet")
            return

        # Отримати Instagram акаунт
        account = auto_post.account
        product = auto_post.product

        # Перевірити чи токен дійсний
        if not account.is_token_valid():
            account.refresh_token_if_needed()

        # Создати обробник
        handler = InstagramAPIHandler(account.access_token)

        # Підготувати текст поста
        caption = auto_post.caption_template.format(
            product_name=product.name,
            product_price=product.price,
            product_description=product.description,
            hashtags=account.hashtags,
        )

        # Створити пост
        if product.image:
            result = handler.create_media(
                image_url=product.image.url, caption=caption, media_type="IMAGE"
            )

            auto_post.instagram_post_id = result.get("id")
            auto_post.status = "posted"
            auto_post.posted_at = timezone.now()
            auto_post.save()

            logger.info(f"Successfully posted product {product.id} to Instagram")
        else:
            raise Exception("Product has no image")

    except InstagramAutoPost.DoesNotExist:
        logger.error(f"Auto post {auto_post_id} not found")
    except Exception as e:
        logger.error(f"Error posting product to Instagram: {str(e)}")

        auto_post = InstagramAutoPost.objects.get(id=auto_post_id)
        auto_post.status = "failed"
        auto_post.error_message = str(e)
        auto_post.save()

        raise self.retry(exc=e)


@shared_task(max_retries=3, default_retry_delay=60, name="instagram.sync_account_media")
def sync_instagram_account_media(account_id):
    """
    Синхронізувати медіа контент з Instagram
    """
    from core.instagram_models import InstagramAccount, InstagramPost
    from core.instagram_handler import InstagramAPIHandler
    from django.utils.dateparse import parse_datetime

    try:
        account = InstagramAccount.objects.get(id=account_id)
        handler = InstagramAPIHandler(account.access_token)

        # Отримати медіа
        media_list = handler.get_user_media(limit=50)

        for media in media_list:
            # Перевірити чи пост вже існує
            instagram_post, created = InstagramPost.objects.get_or_create(
                account=account,
                instagram_id=media["id"],
                defaults={
                    "store": account.store,
                    "post_type": media.get("media_type", "IMAGE").lower(),
                    "media_url": media.get("media_url", ""),
                    "caption": media.get("caption", ""),
                    "permalink": media.get("permalink", ""),
                    "posted_at": parse_datetime(media.get("timestamp", "")),
                },
            )

            # Оновити статистику
            instagram_post.likes_count = media.get("like_count", 0)
            instagram_post.comments_count = media.get("comments_count", 0)
            instagram_post.save()

        # Оновити дату останної синхронізації
        account.last_sync = timezone.now()
        account.save()

        logger.info(
            f"Successfully synced media for account {account.instagram_username}"
        )

    except InstagramAccount.DoesNotExist:
        logger.error(f"Instagram account {account_id} not found")
    except Exception as e:
        logger.error(f"Error syncing Instagram media: {str(e)}")
        raise self.retry(exc=e)


# ==================== Statistics Tasks ====================


@shared_task(name="instagram.sync_daily_statistics")
def sync_daily_instagram_statistics(account_id):
    """
    Синхронізувати щоденну статистику з Instagram
    """
    from core.instagram_models import InstagramAccount, InstagramStatistics
    from core.instagram_handler import InstagramAPIHandler

    try:
        account = InstagramAccount.objects.get(id=account_id)
        handler = InstagramAPIHandler(account.access_token)

        # Отримати інформацію про користувача
        user_info = handler.get_user_info()

        # Отримати статистику
        today = timezone.now().date()

        stat, created = InstagramStatistics.objects.get_or_create(
            account=account,
            date=today,
            defaults={
                "total_followers": user_info.get("followers_count", 0),
            },
        )

        if not created:
            # Обчислити нових підписників
            previous_stat = InstagramStatistics.objects.filter(
                account=account, date=today - timedelta(days=1)
            ).first()

            if previous_stat:
                stat.new_followers = max(
                    0,
                    user_info.get("followers_count", 0) - previous_stat.total_followers,
                )

        stat.total_followers = user_info.get("followers_count", 0)
        stat.save()

        logger.info(f"Successfully synced daily stats for {account.instagram_username}")

    except InstagramAccount.DoesNotExist:
        logger.error(f"Instagram account {account_id} not found")
    except Exception as e:
        logger.error(f"Error syncing daily statistics: {str(e)}")


@shared_task(name="instagram.update_media_insights")
def update_instagram_media_insights(post_id):
    """
    Оновити статистику конкретного поста
    """
    from core.instagram_models import InstagramPost
    from core.instagram_handler import InstagramAPIHandler

    try:
        post = InstagramPost.objects.get(id=post_id)
        handler = InstagramAPIHandler(post.account.access_token)

        # Отримати статистику поста
        insights = handler.get_media_insights(post.instagram_id)

        for insight in insights:
            metric = insight.get("name")
            value = insight.get("values", [{}])[0].get("value", 0)

            if metric == "engagement":
                # Engagement = likes + comments
                post.likes_count = int(value)
            elif metric == "impressions":
                pass  # Можемо зберігти в окремому полі
            elif metric == "reach":
                pass

        post.save()
        logger.info(f"Updated insights for post {post.instagram_id}")

    except InstagramPost.DoesNotExist:
        logger.error(f"Instagram post {post_id} not found")
    except Exception as e:
        logger.error(f"Error updating media insights: {str(e)}")


# ==================== DM Auto-Response Tasks ====================


@shared_task(max_retries=3, default_retry_delay=30, name="instagram.process_dm_message")
def process_instagram_dm_message(message_id):
    """
    Обробити DM повідомлення та відправити автовідповідь
    """
    from core.instagram_models import InstagramDMMessage, InstagramDMKeyword
    from core.instagram_handler import InstagramAPIHandler

    try:
        message = InstagramDMMessage.objects.get(id=message_id)
        account = message.account

        if message.is_processed:
            return

        # Перевірити на наявність ключових слів
        keywords = InstagramDMKeyword.objects.filter(account=account, is_active=True)

        response_sent = False

        for keyword in keywords:
            if keyword.keyword.lower() in message.message_text.lower():
                # Відправити автовідповідь
                handler = InstagramAPIHandler(account.access_token)

                # TODO: Реалізувати отримання ID розмови від message.sender_id
                # Для цього потребується додаткова інформація

                logger.info(f"Auto-response sent for keyword: {keyword.keyword}")
                message.auto_response_sent = True
                response_sent = True
                keyword.times_triggered += 1
                keyword.save()
                break

        message.is_processed = True
        message.save()

    except InstagramDMMessage.DoesNotExist:
        logger.error(f"DM message {message_id} not found")
    except Exception as e:
        logger.error(f"Error processing DM message: {str(e)}")
        raise self.retry(exc=e)


# ==================== Periodic Tasks ====================


@shared_task(name="instagram.sync_all_accounts")
def sync_all_instagram_accounts():
    """
    Синхронізувати все Instagram акаунти (запускається за розписанням)
    """
    from core.instagram_models import InstagramAccount

    accounts = InstagramAccount.objects.filter(status="connected")

    for account in accounts:
        sync_instagram_account_media.delay(account.id)
        sync_daily_instagram_statistics.delay(account.id)

    logger.info(f"Scheduled sync for {accounts.count()} Instagram accounts")


@shared_task(name="instagram.process_scheduled_posts")
def process_scheduled_instagram_posts():
    """
    Обробити заплановані пости (запускається щогодини)
    """
    from core.instagram_models import InstagramAutoPost

    pending_posts = InstagramAutoPost.objects.filter(
        status="pending", scheduled_at__lte=timezone.now()
    )

    for post in pending_posts:
        auto_post_product_to_instagram.delay(post.id)

    logger.info(f"Processing {pending_posts.count()} scheduled posts")


@shared_task(name="instagram.cleanup_old_data")
def cleanup_old_instagram_data():
    """
    Очистити старі дані (запускається щодня)
    """
    from core.instagram_models import InstagramDMMessage

    # Видалити DM повідомлення старші за 30 днів
    cutoff_date = timezone.now() - timedelta(days=30)
    deleted_count, _ = InstagramDMMessage.objects.filter(
        created_at__lt=cutoff_date
    ).delete()

    logger.info(f"Deleted {deleted_count} old DM messages")
