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

# Міграції/static/superuser — тільки якщо RUN_MIGRATIONS=true
# (виставляється в env лише для backend-сервісу).
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo "📦 Applying database migrations..."
    python manage.py migrate --noinput

    mkdir -p /app/media/store_logos /app/media/store_banners /app/media/avatars

    echo "📁 Collecting static files..."
    python manage.py collectstatic --noinput

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
else
    echo "⏭️  Skipping migrations (RUN_MIGRATIONS != true)"
    # Чекаємо щоб backend встиг застосувати міграції
    until python manage.py showmigrations --plan 2>/dev/null | grep -q "\[X\]"; do
        echo "⏳ Waiting for migrations from backend..."
        sleep 2
    done
    echo "✅ Migrations are ready"
fi

echo "🚀 Starting application..."
# Запустити команду, передану в CMD
exec "$@"
