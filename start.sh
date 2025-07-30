#!/bin/bash

echo "🚀 Запуск SaaS Mini-Store Platform..."

# Перевірка наявності Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не встановлений. Будь ласка, встановіть Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не встановлений. Будь ласка, встановіть Docker Compose."
    exit 1
fi

# Створення .env файлу з прикладу
if [ ! -f "backend/.env" ]; then
    echo "📝 Створення .env файлу..."
    cp backend/env.example backend/.env
fi

# Запуск сервісів
echo "🐳 Запуск Docker сервісів..."
docker-compose up -d

# Очікування готовності бази даних
echo "⏳ Очікування готовності бази даних..."
sleep 10

# Виконання міграцій
echo "🗄️ Виконання міграцій..."
docker-compose exec backend python manage.py migrate

# Створення суперкористувача
echo "👤 Створення суперкористувача..."
docker-compose exec backend python manage.py createsuperuser --noinput

# Збір статичних файлів
echo "📦 Збір статичних файлів..."
docker-compose exec backend python manage.py collectstatic --noinput

echo "✅ Проект успішно запущено!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Admin Panel: http://localhost:8000/admin"
echo ""
echo "Для зупинки використовуйте: docker-compose down" 