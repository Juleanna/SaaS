# Instagram Інтеграція

## Огляд

Модуль Instagram інтеграції дозволяє:

- 📸 Синхронізувати пости з Instagram
- 📊 Відслідковувати статистику (підписники, лайки, коментарі)
- 🤖 Автоматично постити товари
- 💬 Отримувати автовідповіді на DM
- 📈 Аналізувати engagement

## Настройка

### 1. Створити Instagram App

1. Перейти на [Meta Developers](https://developers.facebook.com)
2. Створити новий додаток для Instagram
3. Отримати:
   - `INSTAGRAM_APP_ID`
   - `INSTAGRAM_APP_SECRET`
   - `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`

### 2. Конфігурація .env

```bash
# Instagram
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token
SITE_URL=https://yourdomain.com
```

### 3. Налаштування Webhook

Instagram запитує URL webhook для отримання подій:

```
https://yourdomain.com/api/instagram/webhook/
```

## API Endpoints

### Акаунти

#### Отримати список акаунтів

```bash
GET /api/instagram/accounts/
```

#### Отримати URL для входу

```bash
GET /api/instagram/accounts/oauth_login_url/
```

Повертає:

```json
{
  "login_url": "https://api.instagram.com/oauth/authorize?client_id=..."
}
```

#### OAuth Callback

```bash
POST /api/instagram/accounts/oauth_callback/
Content-Type: application/json

{
  "code": "authorization-code",
  "store_id": 1
}
```

#### Синхронізувати медіа

```bash
POST /api/instagram/accounts/{id}/sync_media/
```

#### Отримати статистику

```bash
GET /api/instagram/accounts/{id}/statistics/
```

#### Відключити акаунт

```bash
POST /api/instagram/accounts/{id}/disconnect/
```

### Пости

#### Отримати пости

```bash
GET /api/instagram/posts/
```

#### Отримати останні пости

```bash
GET /api/instagram/posts/recent/?limit=10
```

### Автопостинг

#### Створити автопост

```bash
POST /api/instagram/auto-posts/
Content-Type: application/json

{
  "account": 1,
  "product": 5,
  "caption_template": "🎁 {product_name} - {product_price}₴\n{hashtags}",
  "scheduled_at": "2024-12-25T10:00:00Z"
}
```

#### Опублікувати негайно

```bash
POST /api/instagram/auto-posts/{id}/publish_now/
```

### DM Ключові слова

#### Створити ключове слово

```bash
POST /api/instagram/dm-keywords/
Content-Type: application/json

{
  "account": 1,
  "keyword": "ціна",
  "response_message": "Дякуємо за запитання! Ціна вказана на сторінці товара.",
  "is_active": true
}
```

## Celery Tasks

### Синхронізація медіа

```python
from core.instagram_tasks import sync_instagram_account_media
sync_instagram_account_media.delay(account_id)
```

### Синхронізація статистики

```python
from core.instagram_tasks import sync_daily_instagram_statistics
sync_daily_instagram_statistics.delay(account_id)
```

### Автопостинг продукту

```python
from core.instagram_tasks import auto_post_product_to_instagram
auto_post_product_to_instagram.delay(auto_post_id)
```

### Обробка DM

```python
from core.instagram_tasks import process_instagram_dm_message
process_instagram_dm_message.delay(message_id)
```

## Scheduled Tasks

Налаштовані в `CELERY_BEAT_SCHEDULE`:

- **sync-all-instagram-accounts** - Кожні 2 години
- **process-scheduled-instagram-posts** - Щогодини
- **cleanup-old-instagram-data** - Щодня о 3:00 ночі

## API Handler

### InstagramAPIHandler

```python
from core.instagram_handler import InstagramAPIHandler

handler = InstagramAPIHandler(access_token)

# Отримати інформацію про користувача
user_info = handler.get_user_info()

# Отримати медіа
media = handler.get_user_media(limit=25)

# Створити пост
result = handler.create_media(
    image_url='https://...',
    caption='Мій новий пост!',
    media_type='IMAGE'
)

# Получить статистику поста
insights = handler.get_media_insights(media_id)

# Отримати коментарі
comments = handler.get_media_comments(media_id)

# Відповісти на коментар
handler.reply_to_comment(comment_id, 'Дякуємо!')

# Отримати DM розмови
conversations = handler.get_conversations()

# Отримати повідомлення з розмови
messages = handler.get_conversation_messages(conversation_id)

# Відправити DM
handler.send_message(recipient_id, 'Привіт!')
```

## Webhook подій

### Структура вебхука

```json
{
  "entry": [
    {
      "messaging": [
        {
          "message": {
            "mid": "message_id",
            "text": "User message"
          },
          "sender": {
            "id": "sender_id"
          }
        }
      ]
    }
  ]
}
```

### Обробка подій

InstagramWebhookHandler автоматично обробляє:

- Створення повідомлень
- Коментарі
- Лайки
- Інші события

## Frontend компонент

### InstagramPage

```jsx
import InstagramPage from "./pages/InstagramPage";

<InstagramPage storeId={1} />;
```

Функції:

- ✅ Підключення/відключення акаунту
- 📊 Перегляд статистики
- 📸 Галерея постів
- 🤖 Налаштування автопостингу
- 💬 Управління DM відповідями

## Приклади використання

### Синхронізувати медіа вручну

```python
from core.instagram_models import InstagramAccount
from core.instagram_tasks import sync_instagram_account_media

account = InstagramAccount.objects.get(id=1)
sync_instagram_account_media.delay(account.id)
```

### Створити автопост для товара

```python
from core.instagram_models import InstagramAutoPost, InstagramAccount
from products.models import Product
from django.utils import timezone
from datetime import timedelta

account = InstagramAccount.objects.get(id=1)
product = Product.objects.get(id=5)

auto_post = InstagramAutoPost.objects.create(
    account=account,
    product=product,
    caption_template="🎁 {product_name}\nЦіна: {product_price}₴\n{hashtags}",
    scheduled_at=timezone.now() + timedelta(hours=24),
    status='pending'
)
```

### Додати DM ключове слово

```python
from core.instagram_models import InstagramDMKeyword

keyword = InstagramDMKeyword.objects.create(
    account=account,
    keyword='доставка',
    response_message='Доставляємо по Україні за 2-3 дні',
    is_active=True
)
```

## Помилки та debugging

### Token expired

Instagram токени можуть закінчитися. При цьому:

1. `account.status` буде `'token_expired'`
2. Потрібно перепідключити акаунт
3. Коли користувач повторно проходить OAuth, токен оновлюється

### Webhook не отримує події

1. Перевіряє URL в конфігурації Meta
2. Перевіряє `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
3. Перевіряє логи Celery для обробки подій
4. Перевіряє, чи `SITE_URL` доступний з інтернету

### Помилки при постингу

Див. `InstagramAutoPost.error_message` для деталей помилки

## Безпека

- Токени зберігаються в БД (обережно в продакшені!)
- Webhook визначається за `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`
- Усі API запити мають `IsAuthenticated` permission
- Користувачі можуть управляти тільки власними акаунтами

## Переліки дозволів

- `instagram_business_basic` - базовий доступ
- `instagram_business_content_publish` - постинг контенту
- `instagram_business_manage_messages` - управління DM
