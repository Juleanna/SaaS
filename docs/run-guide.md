# 🚀 Гайд по запуску проекта (backend + frontend)

## 🧰 Предварительные требования
- Git, Docker Desktop (с Docker Compose), Node.js 18+, Python 3.11+ (если нужен локальный запуск без Docker).
- Установленный PostgreSQL (если не используете контейнер из compose).
- Stripe учётка для тестовых ключей.

## 📂 Структура
- `backend/` — Django + DRF, Celery.
- `frontend-vite/` — React (Vite).
- `docker-compose.yml` — сборка web + worker + db + redis.

## 🔑 Переменные окружения
Скопируйте шаблон и заполните:
```bash
cp backend/env.example backend/.env
```
Минимум заполнить:
- `SECRET_KEY` — любой случайный ключ.
- `DB_PASSWORD` — пароль БД (совпадает с docker-compose, если используете контейнер).
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET` — тестовые ключи Stripe.

## 🐳 Запуск через Docker (рекомендуется)
В корне `C:\SaaS`:
```bash
docker compose up --build
```
Контейнеры:
- `backend` — Django (порт 8000).
- `worker` — Celery.
- `redis` — кеш/таски.
- `db` — Postgres.

Проверка:
- API health: http://localhost:8000/api/health/
- Админка: http://localhost:8000/admin/

## 🖥️ Локальный запуск backend (без Docker)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```
Дополнительно для Celery (в отдельном окне):
```bash
celery -A core worker -l info
```

## 🌐 Запуск frontend
```bash
cd frontend-vite
npm install
npm run dev -- --host --port 5173
```
Фронт будет на http://localhost:5173. Убедитесь, что CORS в `backend/core/settings.py` разрешает порт 5173.

## 💳 Stripe: проверка платежей
1) В `.env` прописать `STRIPE_API_KEY` и `STRIPE_WEBHOOK_SECRET` (тестовые).
2) Поднять backend (Docker или локально).
3) Запустить Stripe CLI для вебхуков (если не используете публичный URL):
```bash
stripe listen --forward-to localhost:8000/api/payments/public/stripe/webhook/
```
4) Инициализация сессии:
   - POST на `/api/payments/public/<store_slug>/stripe/session/` с JSON:
   ```json
   {
     "order_number": "ORD-XXXX",
     "success_url": "http://localhost:5173/success",
     "cancel_url": "http://localhost:5173/cancel"
   }
   ```
   - В ответе получить `url` и сделать редирект на фронте.

## ✅ Быстрый чеклист
- [ ] Создан `backend/.env` с ключами (SECRET_KEY, DB, STRIPE).
- [ ] `docker compose up` запущен или backend + db + redis подняты локально.
- [ ] Выполнены миграции `python manage.py migrate`.
- [ ] Создан superuser для админки.
- [ ] Фронт запущен `npm run dev`.
- [ ] Stripe вебхук слушает (Stripe CLI или публичный URL).

## 🛠️ Полезные команды
- Тесты (пример): `cd backend && python manage.py test payments.tests.test_webhook`.
- Создание миграций: `python manage.py makemigrations`.
- Сбор статических (в проде): `python manage.py collectstatic`.

## 📌 Примечания
- Request-ID уже включён: каждый ответ содержит `X-Request-ID`, удобно для логов и вебхуков.
- Публичные эндпоинты (витрина) на `/api/public/...`, приватные — под `/api/stores/<id>/...` и требуют JWT.
