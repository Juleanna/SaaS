#!/bin/bash

# Entrypoint script for Django backend
set -e

echo "🐳 Starting Django Backend..."

# Чекати на доступність PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
  sleep 0.5
done
echo "✅ PostgreSQL is ready!"

# Чекати на доступність Redis
echo "⏳ Waiting for Redis..."
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  sleep 0.5
done
echo "✅ Redis is ready!"

# Застосувати міграції БД
echo "📦 Applying database migrations..."
python manage.py migrate --noinput

# Забезпечити права на media директорію
mkdir -p /app/media/store_logos /app/media/store_banners /app/media/avatars

# Зібрати статичні файли
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Створити суперюзера якщо потрібно (тільки для development)
if [ "$CREATE_SUPERUSER" = "true" ]; then
    echo "👤 Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(username='${DJANGO_SUPERUSER_USERNAME:-admin}').exists():
    User.objects.create_superuser(
        '${DJANGO_SUPERUSER_USERNAME:-admin}',
        '${DJANGO_SUPERUSER_EMAIL:-admin@example.com}',
        '${DJANGO_SUPERUSER_PASSWORD:-admin}'
    );
    print('✅ Superuser created!')
else:
    print('ℹ️  Superuser already exists')
"
fi

echo "🚀 Starting application..."
# Запустити команду, передану в CMD
exec "$@"
