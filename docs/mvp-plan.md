# MVP-план (сервер)

## Скоуп MVP
- Магазин/каталог: CRUD магазинов, категорий, товаров/вариантов, загрузка изображений.
- Витрина: публичные товары по `store_slug`, поиск/фильтры, страницы success/cancel после оплаты.
- Корзина/заказ: создание заказа, гостевой checkout, расчёт итогов, фиксация позиций.
- Оплаты: Stripe Checkout/Payment Intents, вебхуки, идемпотентность, статусы платежей.
- Нотификации: email по заказу (через Celery + SMTP/SendGrid), шаблоны писем.
- Админка/роль: StoreAdmin/Manager/Staff/Viewer, DRF permissions на уровне магазина.
- Инфра: Docker Compose (web/worker/redis/db), healthcheck, базовый лог/метрики, .env.example.

## Вне скоупа (после MVP)
- Telegram-бот, Instagram Shopping, дополнительные платёжки (PayPal/ЮKassa).
- Маркетплейс-подписки/биллинг SaaS, продвинутые складские сценарии.
- A/B-фичи, кастомные темы витрины, сложные промо/скидки.

## Мультитенантность
- MVP: одна БД, все сущности, связанные с магазином, держат `store_id` (жёсткая фильтрация в API по текущему магазину).
- Контекст магазина: slug/host/заголовок `X-Store-Slug` → `request.store`, mixin для queryset/создания `store` автоматически.
- Future: переход на schema-per-tenant (django-tenants), вынос shared (auth/billing) и tenant-данных (каталог/заказы).

## API-контракты (черновик)
- `POST /api/auth/token`, `/refresh`, `/register`, `/profile` — JWT auth/профиль.
- `GET/POST /api/stores/` (создание/список моих), `GET /api/stores/{slug}/public` (публичный профиль).
- `GET/POST /api/stores/{id}/categories|products|variants|images` — CRUD, фильтры/поиск/order.
- `GET /api/catalog/{store_slug}/products` и `/products/{slug}` — публичная витрина.
- `POST /api/orders/` (создать корзину/заказ), `POST /api/payments/stripe/session` (init), `POST /api/payments/stripe/webhook`.
- `POST /api/notifications/email/order-confirmation` (фоновая отправка Celery).

## Данные и права
- Роли: StoreAdmin (полный доступ в магазине), Manager (каталог/заказы), Staff (операции заказов без настроек), Viewer (read-only).
- Все запросы магазиносторонние — обязательная фильтрация по `store` (не доверяем `store_id` из тела).
- Публичные эндпойнты: витрина, product public, Stripe webhooks, health.

## НФТ/безопасность
- Логи: структурированные (JSON), корреляция по `X-Request-ID`.
- Метрики: Prometheus экспортер (план), healthcheck `/api/health/`.
- Безопасность: CORS только dev, HTTPS/HSTS в проде, SECRET_KEY из env, idempotency-key для платежей.

## Ближайшие задачи
1) Каркас мультитенантности (middleware + mixin) и healthcheck.  
2) Минимальные схемы API: orders/payments/notifications маршруты и заглушки.  
3) Docker Compose/ENV актуализация, базовые тесты на scoping.
