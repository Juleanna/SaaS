# Инструкция по ключам и токенам (.env)

## Общие правила
- [KEY] Не коммить `.env` в git. Храни локально или в секретах CI.
- [SAFE] Доступ ограничивай: только нужным людям/сервисам.
- [ROTATE] Меняй ключи при утечках и раз в несколько месяцев.

## SECRET_KEY (Django)
- [WHAT] Секрет для подписи JWT/сессий и криптографии Django.
- [GEN] Уже сгенерирован в `backend/.env`. При проде создай новый (например, `python - <<'PY'\nimport secrets\nprint(secrets.token_urlsafe(50))\nPY`).
- [PLACE] Ключ лежит в `SECRET_KEY=...` в `backend/.env`.

## Stripe
- [PANEL] Зайди в Stripe Dashboard → Developers → API keys.
- [SECRET] Скопируй `Secret key`:
  - Тест: `sk_test_...`
  - Прод: `sk_live_...`
- [ENV] Запиши в `backend/.env`:
  - `STRIPE_API_KEY=sk_test_xxx` (или `sk_live_xxx` в проде)
- [WEBHOOK] Подпись вебхука:
  1. Developers → Webhooks → Add endpoint.
  2. URL: `https://your-domain.com/api/stripe/webhook/` (локально через ngrok).
  3. Выбери нужные события (например, `payment_intent.*`).
  4. Сохранить → скопировать Signing secret (`whsec_...`).
  5. В `.env`: `STRIPE_WEBHOOK_SECRET=whsec_xxx`.
- [TEST] Отправь тестовые события из Stripe CLI или Dashboard → Send test webhook.

## Telegram Bot
- [CREATE] В Telegram написать `@BotFather` → `/newbot` → задать имя и username.
- [TOKEN] BotFather выдаст токен вида `123456:ABC-DEF...`.
- [ENV] В `.env`: `TELEGRAM_BOT_TOKEN=123456:ABC-DEF...`.
- [WEBHOOK] (если нужен) через `python manage.py setwebhook` или прямой запрос:
  `https://api.telegram.org/bot<token>/setWebhook?url=https://your-domain.com/telegram/webhook/`
- [TEST] Отправь сообщение боту и проверь логи/ответ.

## Instagram (Basic Display / Graph API)
- [APP] В Meta for Developers: создать приложение → добавить Instagram (Basic Display или Graph API для бизнес-аккаунтов).
- [SETUP] Настроить OAuth redirect URI и клиенские данные.
- [SHORT] Получить short-lived token через OAuth (код → `access_token`).
- [LONG] Обменять на long-lived token:
  `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=<app_secret>&access_token=<short_token>`
- [ENV] Сохранить итоговый токен в `.env`: `INSTAGRAM_ACCESS_TOKEN=<long_lived_token>`.
- [REFRESH] Продлевать long-lived токен до истечения (обычно до 60 дней).

## Резервное копирование и доступ
- [VAULT] Храни прод-ключи в секрет-хранилище (Vault/1Password/Bitwarden/GitHub Actions secrets).
- [LIMIT] Разделяй тестовые и боевые ключи; не используйте тестовые в проде.
- [LOGS] Не выводи ключи в логи и не отправляй в тикеты/чат без маскировки. 
