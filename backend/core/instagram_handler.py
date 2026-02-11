"""
Instagram API Handler
"""

import requests
import logging
from django.utils import timezone
from django.conf import settings
from datetime import datetime
import json

logger = logging.getLogger(__name__)


class InstagramAPIHandler:
    """
    Обробник для Instagram API операцій
    """

    BASE_URL = "https://graph.instagram.com"
    VERSION = "v18.0"

    def __init__(self, access_token):
        self.access_token = access_token
        self.session = requests.Session()

    def _make_request(self, method, endpoint, **kwargs):
        """
        Зробити запит до Instagram API
        """
        url = f"{self.BASE_URL}/{self.VERSION}{endpoint}"
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self.access_token}"

        try:
            if method == "GET":
                response = self.session.get(url, headers=headers, **kwargs)
            elif method == "POST":
                response = self.session.post(url, headers=headers, **kwargs)
            elif method == "DELETE":
                response = self.session.delete(url, headers=headers, **kwargs)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Instagram API error: {str(e)}")
            raise

    # ==================== User Methods ====================

    def get_user_info(self):
        """
        Отримати інформацію про поточного користувача
        """
        data = self._make_request(
            "GET",
            "/me",
            params={
                "fields": "id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count"
            },
        )
        return data

    def get_user_media(self, limit=25):
        """
        Отримати медіа контент користувача
        """
        data = self._make_request(
            "GET",
            "/me/media",
            params={
                "fields": "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
                "limit": limit,
            },
        )
        return data.get("data", [])

    def get_user_insights(self, metric, period="day"):
        """
        Отримати статистику користувача
        Metrics: impressions, reach, profile_views, follower_count
        """
        data = self._make_request(
            "GET", "/me/insights", params={"metric": metric, "period": period}
        )
        return data.get("data", [])

    # ==================== Post Methods ====================

    def create_media(self, image_url, caption="", media_type="IMAGE"):
        """
        Створити контейнер для медіа контенту
        """
        payload = {"image_url": image_url, "caption": caption, "media_type": media_type}

        # Спочатку створюємо контейнер
        container_data = self._make_request("POST", "/me/media", json=payload)

        container_id = container_data.get("id")

        # Потім публікуємо його
        publish_data = self._make_request(
            "POST", "/me/media_publish", json={"creation_id": container_id}
        )

        return publish_data

    def create_carousel(self, items, caption=""):
        """
        Створити carousel пост (кілька зображень)
        items: list of {'media_type': 'IMAGE', 'image_url': '...'} or {'media_type': 'VIDEO', 'video_url': '...'}
        """
        payload = {"media_type": "CAROUSEL", "children": items, "caption": caption}

        # Створити контейнер
        container_data = self._make_request("POST", "/me/media", json=payload)

        container_id = container_data.get("id")

        # Опублікувати
        publish_data = self._make_request(
            "POST", "/me/media_publish", json={"creation_id": container_id}
        )

        return publish_data

    def get_media_insights(self, media_id, metrics=None):
        """
        Отримати статистику конкретного поста
        """
        if metrics is None:
            metrics = "engagement,impressions,reach,saved,video_views"

        data = self._make_request(
            "GET", f"/{media_id}/insights", params={"metric": metrics}
        )
        return data.get("data", [])

    def delete_media(self, media_id):
        """
        Видалити пост
        """
        return self._make_request("DELETE", f"/{media_id}")

    # ==================== Comment Methods ====================

    def get_media_comments(self, media_id, limit=25):
        """
        Отримати коментарі до поста
        """
        data = self._make_request(
            "GET",
            f"/{media_id}/comments",
            params={"fields": "id,from,text,timestamp,hidden", "limit": limit},
        )
        return data.get("data", [])

    def reply_to_comment(self, comment_id, message):
        """
        Відповісти на коментар
        """
        return self._make_request(
            "POST", f"/{comment_id}/replies", json={"message": message}
        )

    def hide_comment(self, comment_id, hidden=True):
        """
        Приховати/показати коментар
        """
        return self._make_request("POST", f"/{comment_id}", json={"hidden": hidden})

    # ==================== DM Methods ====================

    def get_conversations(self, limit=25):
        """
        Отримати список розмов
        """
        data = self._make_request(
            "GET",
            "/me/conversations",
            params={
                "fields": "id,participants,senders,user_id,updated_time",
                "limit": limit,
            },
        )
        return data.get("data", [])

    def get_conversation_messages(self, conversation_id, limit=25):
        """
        Отримати повідомлення з розмови
        """
        data = self._make_request(
            "GET",
            f"/{conversation_id}/messages",
            params={"fields": "id,from,message,type,timestamp,story", "limit": limit},
        )
        return data.get("data", [])

    def send_message(self, recipient_id, message):
        """
        Відправити DM повідомлення
        """
        return self._make_request(
            "POST",
            "/me/messages",
            json={"recipient": {"id": recipient_id}, "message": message},
        )

    # ==================== Hashtag Methods ====================

    def search_hashtag(self, user_id, hashtag_name):
        """
        Пошук хештега для користувача
        """
        data = self._make_request(
            "GET",
            f"/{user_id}/ig_hashtag_search",
            params={"user_id": user_id, "fields": "id,name"},
        )
        return data.get("data", [])

    def get_hashtag_recent_media(self, hashtag_id, limit=25):
        """
        Отримати недавні пости з хештегом
        """
        data = self._make_request(
            "GET",
            f"/{hashtag_id}/recent_media",
            params={
                "fields": "id,caption,media_type,media_url,permalink,timestamp",
                "limit": limit,
            },
        )
        return data.get("data", [])

    # ==================== Follower Methods ====================

    def get_followers(self, limit=25):
        """
        Отримати список підписників
        """
        data = self._make_request(
            "GET",
            "/me/followers",
            params={"fields": "id,username,name,profile_picture_url", "limit": limit},
        )
        return data.get("data", [])

    def get_follows(self, limit=25):
        """
        Отримати список того на кого підписаний
        """
        data = self._make_request(
            "GET",
            "/me/follows",
            params={"fields": "id,username,name,profile_picture_url", "limit": limit},
        )
        return data.get("data", [])

    def refresh_access_token(self):
        """
        Оновити access token

        Instagram довгострокові токени дійсні 60 днів, їх можна оновити
        використовуючи endpoint для обміну токена.

        Returns:
            dict: Новий access token та час життя
        """
        try:
            # Instagram Graph API endpoint для оновлення токена
            response = self._make_request(
                "GET",
                "/access_token",
                params={
                    "grant_type": "ig_refresh_token",
                    "access_token": self.access_token
                }
            )

            return {
                "access_token": response.get("access_token"),
                "token_type": response.get("token_type", "Bearer"),
                "expires_in": response.get("expires_in", 5184000)  # 60 днів за замовчуванням
            }
        except Exception as e:
            logger.error(f"Error refreshing Instagram token: {str(e)}")
            raise


class InstagramWebhookHandler:
    """
    Обробник для Instagram webhook подій
    """

    @staticmethod
    def process_message_create_event(data):
        """
        Обробити подію створення повідомлення
        """
        logger.info(f"Processing message create event: {data}")

        message_id = data.get("id")
        sender_id = data.get("from", {}).get("id")
        message_text = data.get("message")
        timestamp = data.get("timestamp")

        return {
            "message_id": message_id,
            "sender_id": sender_id,
            "message_text": message_text,
            "timestamp": timestamp,
        }

    @staticmethod
    def process_comment_event(data):
        """
        Обробити подію коментаря
        """
        logger.info(f"Processing comment event: {data}")

        comment_id = data.get("id")
        media_id = data.get("media", {}).get("id")
        from_user = data.get("from", {}).get("username")
        comment_text = data.get("text")
        timestamp = data.get("timestamp")

        return {
            "comment_id": comment_id,
            "media_id": media_id,
            "from_user": from_user,
            "comment_text": comment_text,
            "timestamp": timestamp,
        }

    @staticmethod
    def process_like_event(data):
        """
        Обробити подію лайку
        """
        logger.info(f"Processing like event: {data}")

        return {
            "media_id": data.get("media", {}).get("id"),
            "from_user": data.get("from", {}).get("username"),
            "timestamp": data.get("timestamp"),
        }
