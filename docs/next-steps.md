# Ближайший фронт работ

## Backend
- Checkout API: `POST /api/orders/` (валидация корзины, тоталы), `GET/POST /api/orders/{id}` статусы.
- Stripe: endpoint init (Checkout/PaymentIntent), webhook handler, idempotency-key, сохранение payment intents.
- Email: Celery-задача `send_order_email`, шаблон письма, конфиг SMTP/SendGrid в `.env`.
- Permissions: матрица ролей StoreAdmin/Manager/Staff/Viewer в DRF permissions + seeds.
- Health/observability: добавить Request-ID middleware + структурные логи.

## Frontend
- Витрина: список/карточка товара по `store_slug`, корзина, страницы success/cancel.
- Кабинет магазина: CRUD товаров/категорий с использованием нового store context.

## Инфра
- Docker Compose актуализация (web/worker/redis/db), переменные окружения под Stripe/SMTP.
- Минимальные тесты: scoping по store, happy-path checkout, webhook signature.
