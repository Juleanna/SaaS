# 🚀 Інструкція з деплою SaaS Mini-Store Platform

## 📋 Зміст

1. [Підготовка до деплою](#-підготовка-до-деплою)
2. [Деплой на VPS (Ubuntu/Debian)](#-деплой-на-vps-ubuntudebian)
3. [Деплой на Heroku](#-деплой-на-heroku)
4. [Деплой через Docker](#-деплой-через-docker)
5. [CI/CD з GitHub Actions](#-cicd-з-github-actions)
6. [Моніторинг та логування](#-моніторинг-та-логування)
7. [Backup та відновлення](#-backup-та-відновлення)
8. [Troubleshooting](#-troubleshooting)

---

## 🔐 Підготовка до деплою

### Checklist перед деплоєм

- [ ] ✅ Всі тести проходять (`pytest`)
- [ ] 🔒 Токени в `.env` змінені (не використовуються dev токени)
- [ ] 🚫 `DEBUG=False` в production
- [ ] 🌐 `ALLOWED_HOSTS` налаштовані
- [ ] 🔑 Сильний `DB_PASSWORD` (16+ символів)
- [ ] 📧 Email settings налаштовані (SMTP)
- [ ] 💳 Stripe keys для production
- [ ] 📱 Telegram Bot створений через @BotFather
- [ ] 📸 Instagram App зареєстрований (production redirect URIs)
- [ ] 🗄️ Backup локальної БД створено

### 1️⃣ Створення production .env

```bash
# Копіюємо шаблон
cd backend
cp env.example .env.production

# Редагуємо production змінні
nano .env.production
```

**Критичні змінні для production:**

```env
# Django
SECRET_KEY=<генеруйте 52-символьний ключ через secrets>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# База даних
DB_NAME=saas_platform_prod
DB_USER=saas_admin
DB_PASSWORD=<сильний пароль 16+ символів>
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Email (приклад для Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=<app password>

# Stripe Production
STRIPE_PUBLIC_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Telegram
TELEGRAM_BOT_TOKEN=<новий production токен>

# Instagram
INSTAGRAM_APP_ID=<production app id>
INSTAGRAM_APP_SECRET=<production app secret>
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/accounts/oauth-callback/

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
```

### 2️⃣ Генерація SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(52))"
```

Скопіюйте результат в `SECRET_KEY`.

---

## 🖥️ Деплой на VPS (Ubuntu/Debian)

### Крок 1: Підключення до VPS

```bash
# Підключитися по SSH
ssh root@your-server-ip

# Оновити систему
apt update && apt upgrade -y
```

### Крок 2: Встановлення залежностей

```bash
# Python 3.11
apt install -y python3.11 python3.11-venv python3-pip

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Redis
apt install -y redis-server

# Nginx
apt install -y nginx

# Git
apt install -y git

# System dependencies
apt install -y build-essential libpq-dev python3.11-dev
```

### Крок 3: Налаштування PostgreSQL

```bash
# Увійти в PostgreSQL
sudo -u postgres psql

# Створити базу та користувача
CREATE DATABASE saas_platform_prod;
CREATE USER saas_admin WITH PASSWORD 'YourSecurePassword2025!';
ALTER ROLE saas_admin SET client_encoding TO 'utf8';
ALTER ROLE saas_admin SET default_transaction_isolation TO 'read committed';
ALTER ROLE saas_admin SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE saas_platform_prod TO saas_admin;

# Вийти
\q
```

**Налаштування pg_hba.conf:**

```bash
nano /etc/postgresql/14/main/pg_hba.conf
```

Додайте:

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   saas_platform_prod  saas_admin                          md5
host    saas_platform_prod  saas_admin      127.0.0.1/32        md5
```

Перезапустіть PostgreSQL:

```bash
systemctl restart postgresql
```

### Крок 4: Створення користувача для додатку

```bash
# Створити користувача (не root!)
adduser saasapp
usermod -aG sudo saasapp

# Перейти на цього користувача
su - saasapp
```

### Крок 5: Клонування репозиторію

```bash
# Клонувати проект
cd /home/saasapp
git clone https://github.com/yourusername/your-repo.git saas-platform
cd saas-platform

# Перейти на production branch (якщо є)
git checkout production
```

### Крок 6: Налаштування Python середовища

```bash
cd /home/saasapp/saas-platform/backend

# Створити virtual environment
python3.11 -m venv venv

# Активувати
source venv/bin/activate

# Встановити залежності
pip install --upgrade pip
pip install -r requirements.txt
```

### Крок 7: Налаштування .env файлу

```bash
# Створити .env з production значеннями
nano .env

# Вставити всі змінні з розділу "Підготовка"
```

### Крок 8: Django міграції та статика

```bash
# Активувати venv
source venv/bin/activate

# Міграції
python manage.py migrate

# Збірка статичних файлів
python manage.py collectstatic --noinput

# Створити суперюзера
python manage.py createsuperuser
```

### Крок 9: Налаштування Gunicorn

```bash
# Встановити Gunicorn
pip install gunicorn

# Створити systemd service
sudo nano /etc/systemd/system/saas-gunicorn.service
```

**Вміст файлу:**

```ini
[Unit]
Description=SaaS Platform Gunicorn daemon
After=network.target

[Service]
User=saasapp
Group=www-data
WorkingDirectory=/home/saasapp/saas-platform/backend
Environment="PATH=/home/saasapp/saas-platform/backend/venv/bin"
EnvironmentFile=/home/saasapp/saas-platform/backend/.env
ExecStart=/home/saasapp/saas-platform/backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/home/saasapp/saas-platform/backend/gunicorn.sock \
          --timeout 120 \
          --access-logfile /var/log/saas/gunicorn-access.log \
          --error-logfile /var/log/saas/gunicorn-error.log \
          core.wsgi:application

[Install]
WantedBy=multi-user.target
```

**Створити директорію для логів:**

```bash
sudo mkdir -p /var/log/saas
sudo chown saasapp:www-data /var/log/saas
```

**Запустити Gunicorn:**

```bash
sudo systemctl start saas-gunicorn
sudo systemctl enable saas-gunicorn

# Перевірити статус
sudo systemctl status saas-gunicorn
```

### Крок 10: Налаштування Celery

**Celery Worker Service:**

```bash
sudo nano /etc/systemd/system/saas-celery.service
```

```ini
[Unit]
Description=SaaS Platform Celery Worker
After=network.target redis.target

[Service]
Type=forking
User=saasapp
Group=www-data
WorkingDirectory=/home/saasapp/saas-platform/backend
Environment="PATH=/home/saasapp/saas-platform/backend/venv/bin"
EnvironmentFile=/home/saasapp/saas-platform/backend/.env
ExecStart=/home/saasapp/saas-platform/backend/venv/bin/celery -A core worker \
          --loglevel=info \
          --logfile=/var/log/saas/celery-worker.log \
          --pidfile=/var/run/celery/worker.pid

[Install]
WantedBy=multi-user.target
```

**Celery Beat Service:**

```bash
sudo nano /etc/systemd/system/saas-celery-beat.service
```

```ini
[Unit]
Description=SaaS Platform Celery Beat
After=network.target redis.target

[Service]
Type=simple
User=saasapp
Group=www-data
WorkingDirectory=/home/saasapp/saas-platform/backend
Environment="PATH=/home/saasapp/saas-platform/backend/venv/bin"
EnvironmentFile=/home/saasapp/saas-platform/backend/.env
ExecStart=/home/saasapp/saas-platform/backend/venv/bin/celery -A core beat \
          --loglevel=info \
          --logfile=/var/log/saas/celery-beat.log \
          --pidfile=/var/run/celery/beat.pid

[Install]
WantedBy=multi-user.target
```

**Створити директорії:**

```bash
sudo mkdir -p /var/run/celery
sudo chown saasapp:www-data /var/run/celery
```

**Запустити Celery:**

```bash
sudo systemctl start saas-celery
sudo systemctl enable saas-celery
sudo systemctl start saas-celery-beat
sudo systemctl enable saas-celery-beat

# Перевірити статус
sudo systemctl status saas-celery
sudo systemctl status saas-celery-beat
```

### Крок 11: Налаштування Nginx

```bash
sudo nano /etc/nginx/sites-available/saas-platform
```

**Вміст конфігурації:**

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/saas-access.log;
    error_log /var/log/nginx/saas-error.log;

    # Client body size (для завантаження зображень)
    client_max_body_size 20M;

    # Static files
    location /static/ {
        alias /home/saasapp/saas-platform/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files
    location /media/ {
        alias /home/saasapp/saas-platform/backend/media/;
        expires 7d;
        add_header Cache-Control "public";
    }

    # Django backend
    location /api/ {
        proxy_pass http://unix:/home/saasapp/saas-platform/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        # Timeouts
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # Django admin
    location /admin/ {
        proxy_pass http://unix:/home/saasapp/saas-platform/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React frontend
    location / {
        root /home/saasapp/saas-platform/frontend/dist;
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public";
    }
}
```

**Активувати конфігурацію:**

```bash
# Створити symlink
sudo ln -s /etc/nginx/sites-available/saas-platform /etc/nginx/sites-enabled/

# Видалити default config
sudo rm /etc/nginx/sites-enabled/default

# Перевірити конфігурацію
sudo nginx -t

# Перезапустити Nginx
sudo systemctl restart nginx
```

### Крок 12: SSL сертифікат (Let's Encrypt)

```bash
# Встановити Certbot
sudo apt install -y certbot python3-certbot-nginx

# Отримати сертифікат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Перевірити авто-оновлення
sudo certbot renew --dry-run
```

**Certbot автоматично:**
- Створить SSL сертифікати
- Оновить Nginx конфігурацію
- Налаштує авто-оновлення (cron)

### Крок 13: Збірка React frontend

```bash
# Встановити Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Перейти в frontend
cd /home/saasapp/saas-platform/frontend

# Встановити залежності
npm install

# Створити production .env
nano .env.production
```

**Frontend .env.production:**

```env
VITE_API_URL=https://yourdomain.com/api
VITE_STRIPE_PUBLIC_KEY=pk_live_xxxxx
```

**Збудувати production build:**

```bash
npm run build
```

Це створить `dist/` директорію зі статичними файлами.

### Крок 14: Перевірка деплою

```bash
# Перевірити всі сервіси
sudo systemctl status saas-gunicorn
sudo systemctl status saas-celery
sudo systemctl status saas-celery-beat
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Перевірити логи
tail -f /var/log/saas/gunicorn-error.log
tail -f /var/log/saas/celery-worker.log
tail -f /var/log/nginx/saas-error.log
```

**Тестові запити:**

```bash
# Health check
curl https://yourdomain.com/api/health/

# Admin panel
# Відкрити в браузері: https://yourdomain.com/admin/

# API Docs
# https://yourdomain.com/api/docs/
```

### Крок 15: Оновлення коду (deploy updates)

Створіть скрипт для швидкого оновлення:

```bash
nano /home/saasapp/saas-platform/deploy.sh
```

```bash
#!/bin/bash

# Deploy script for SaaS Platform
set -e

echo "🚀 Starting deployment..."

# Navigate to project
cd /home/saasapp/saas-platform

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin production

# Backend updates
echo "🐍 Updating backend..."
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Frontend updates
echo "⚛️ Updating frontend..."
cd ../frontend
npm install
npm run build

# Restart services
echo "🔄 Restarting services..."
sudo systemctl restart saas-gunicorn
sudo systemctl restart saas-celery
sudo systemctl restart saas-celery-beat
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Visit: https://yourdomain.com"
```

**Зробити виконуваним:**

```bash
chmod +x /home/saasapp/saas-platform/deploy.sh
```

**Запустити деплой:**

```bash
./deploy.sh
```

---

## ☁️ Деплой на Heroku

### Підготовка

```bash
# Встановити Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Логін
heroku login
```

### Крок 1: Створення додатків

```bash
# Backend
heroku create your-app-backend

# Frontend (опційно, можна хостити на Vercel/Netlify)
heroku create your-app-frontend
```

### Крок 2: Додати додатки (add-ons)

```bash
# PostgreSQL
heroku addons:create heroku-postgresql:mini -a your-app-backend

# Redis
heroku addons:create heroku-redis:mini -a your-app-backend
```

### Крок 3: Налаштувати змінні середовища

```bash
heroku config:set -a your-app-backend \
  SECRET_KEY="your-52-char-secret-key" \
  DEBUG=False \
  ALLOWED_HOSTS="your-app-backend.herokuapp.com" \
  CORS_ALLOWED_ORIGINS="https://your-app-frontend.herokuapp.com" \
  STRIPE_PUBLIC_KEY="pk_live_xxxxx" \
  STRIPE_SECRET_KEY="sk_live_xxxxx" \
  TELEGRAM_BOT_TOKEN="your-token" \
  INSTAGRAM_APP_ID="your-app-id" \
  INSTAGRAM_APP_SECRET="your-secret"
```

### Крок 4: Створити Procfile

```bash
# backend/Procfile
web: gunicorn core.wsgi --bind 0.0.0.0:$PORT --workers 3
worker: celery -A core worker --loglevel=info
beat: celery -A core beat --loglevel=info
```

### Крок 5: Налаштувати runtime

```bash
# backend/runtime.txt
python-3.11.7
```

### Крок 6: Deploy backend

```bash
cd backend

# Ініціалізувати git (якщо ще не)
git init
heroku git:remote -a your-app-backend

# Deploy
git add .
git commit -m "Initial Heroku deployment"
git push heroku main

# Міграції
heroku run python manage.py migrate -a your-app-backend

# Створити суперюзера
heroku run python manage.py createsuperuser -a your-app-backend
```

### Крок 7: Запустити workers

```bash
# Worker
heroku ps:scale worker=1 -a your-app-backend

# Beat
heroku ps:scale beat=1 -a your-app-backend
```

### Крок 8: Логи

```bash
# Переглянути логи
heroku logs --tail -a your-app-backend
```

---

## 🐳 Деплой через Docker

### Крок 1: Створити Docker files

**backend/Dockerfile:**

```dockerfile
FROM python:3.11-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run Gunicorn
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

**frontend/Dockerfile:**

```dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**frontend/nginx.conf:**

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### Крок 2: docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: saas_platform
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - saas-network

  redis:
    image: redis:7-alpine
    networks:
      - saas-network

  backend:
    build: ./backend
    command: gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
    volumes:
      - ./backend:/app
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      - db
      - redis
    networks:
      - saas-network

  celery:
    build: ./backend
    command: celery -A core worker --loglevel=info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - backend
      - redis
    networks:
      - saas-network

  celery-beat:
    build: ./backend
    command: celery -A core beat --loglevel=info
    volumes:
      - ./backend:/app
    env_file:
      - ./backend/.env
    depends_on:
      - backend
      - redis
    networks:
      - saas-network

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - saas-network

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    ports:
      - "443:443"
    depends_on:
      - backend
      - frontend
    networks:
      - saas-network

volumes:
  postgres_data:
  static_volume:
  media_volume:

networks:
  saas-network:
    driver: bridge
```

### Крок 3: Запустити Docker

```bash
# Збудувати образи
docker-compose build

# Запустити контейнери
docker-compose up -d

# Міграції
docker-compose exec backend python manage.py migrate

# Створити суперюзера
docker-compose exec backend python manage.py createsuperuser

# Перегляд логів
docker-compose logs -f
```

### Крок 4: Зупинити/перезапустити

```bash
# Зупинити
docker-compose down

# Перезапустити
docker-compose restart

# Видалити все (включно з volumes)
docker-compose down -v
```

---

## 🔄 CI/CD з GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [main, production]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: test-secret-key-for-ci
          DEBUG: True
        run: |
          cd backend
          pytest --cov=. --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml

  lint:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dev dependencies
        run: |
          cd backend
          pip install -r requirements-dev.txt

      - name: Run Black
        run: |
          cd backend
          black --check .

      - name: Run isort
        run: |
          cd backend
          isort --check-only .

      - name: Run flake8
        run: |
          cd backend
          flake8 .

      - name: Run Bandit (security)
        run: |
          cd backend
          bandit -r . -ll

  deploy:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: [test, lint]
    if: github.ref == 'refs/heads/production' && github.event_name == 'push'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.10
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /home/saasapp/saas-platform
            ./deploy.sh
```

### Налаштування GitHub Secrets

В GitHub репозиторії: **Settings → Secrets → Actions**

Додайте:
- `VPS_HOST` - IP адреса VPS
- `VPS_USER` - користувач (saasapp)
- `VPS_SSH_KEY` - приватний SSH ключ

---

## 📊 Моніторинг та логування

### Крок 1: Sentry для відстеження помилок

```bash
pip install sentry-sdk
```

**settings.py:**

```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration

if not DEBUG:
    sentry_sdk.init(
        dsn="https://your-sentry-dsn@sentry.io/project-id",
        integrations=[
            DjangoIntegration(),
            CeleryIntegration(),
        ],
        traces_sample_rate=0.1,
        send_default_pii=False,
        environment="production",
    )
```

### Крок 2: Prometheus для метрик

```bash
pip install django-prometheus
```

**settings.py:**

```python
INSTALLED_APPS = [
    'django_prometheus',
    # ... інші додатки
]

MIDDLEWARE = [
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # ... інші middleware
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]
```

**urls.py:**

```python
urlpatterns = [
    path('', include('django_prometheus.urls')),
    # ... інші URLs
]
```

### Крок 3: ELK Stack для централізованих логів

**docker-compose.elk.yml:**

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash/config:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

---

## 💾 Backup та відновлення

### Автоматичний backup БД

**scripts/backup.sh:**

```bash
#!/bin/bash

# Configuration
DB_NAME="saas_platform_prod"
DB_USER="saas_admin"
BACKUP_DIR="/home/saasapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

# Створити директорію якщо не існує
mkdir -p $BACKUP_DIR

# Backup
echo "🗄️ Starting database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_FILE

# Перевірити розмір
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup completed: $BACKUP_FILE ($SIZE)"

    # Видалити старі backup (старіші 30 днів)
    find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete
    echo "🗑️ Old backups cleaned up"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Media files backup
echo "📁 Backing up media files..."
tar -czf "$BACKUP_DIR/media_backup_$DATE.tar.gz" /home/saasapp/saas-platform/backend/media/
echo "✅ Media backup completed"
```

**Зробити виконуваним:**

```bash
chmod +x scripts/backup.sh
```

**Додати в cron (щодня о 2:00):**

```bash
crontab -e
```

```
0 2 * * * /home/saasapp/saas-platform/scripts/backup.sh >> /var/log/saas/backup.log 2>&1
```

### Відновлення з backup

```bash
#!/bin/bash

# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh /path/to/backup.sql.gz"
    exit 1
fi

echo "⚠️ WARNING: This will overwrite the current database!"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "🔄 Restoring database from $BACKUP_FILE..."
gunzip < $BACKUP_FILE | PGPASSWORD=$DB_PASSWORD psql -U saas_admin -h localhost saas_platform_prod

echo "✅ Database restored successfully!"
echo "🔄 Restarting services..."
sudo systemctl restart saas-gunicorn
sudo systemctl restart saas-celery
echo "✅ Done!"
```

---

## 🔧 Troubleshooting

### Проблема: Gunicorn не запускається

```bash
# Перевірити логи
sudo journalctl -u saas-gunicorn.service -n 50

# Перевірити права
ls -la /home/saasapp/saas-platform/backend/gunicorn.sock

# Перевірити .env файл
cat /home/saasapp/saas-platform/backend/.env

# Перевірити що venv активований в service
grep Environment /etc/systemd/system/saas-gunicorn.service
```

### Проблема: 502 Bad Gateway

```bash
# Перевірити що Gunicorn працює
sudo systemctl status saas-gunicorn

# Перевірити що socket файл існує
ls -la /home/saasapp/saas-platform/backend/gunicorn.sock

# Перевірити Nginx error log
tail -f /var/log/nginx/saas-error.log

# Перевірити SELinux (якщо є)
sudo setsebool -P httpd_can_network_connect 1
```

### Проблема: Static files не завантажуються

```bash
# Перезібрати статику
cd /home/saasapp/saas-platform/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# Перевірити права
sudo chown -R saasapp:www-data /home/saasapp/saas-platform/backend/staticfiles/

# Перевірити Nginx конфігурацію
sudo nginx -t
```

### Проблема: Celery tasks не виконуються

```bash
# Перевірити Celery worker
sudo systemctl status saas-celery

# Перевірити Redis
redis-cli ping  # Має відповісти PONG

# Перевірити логи
tail -f /var/log/saas/celery-worker.log

# Перезапустити Celery
sudo systemctl restart saas-celery
sudo systemctl restart saas-celery-beat
```

### Проблема: Database connection refused

```bash
# Перевірити що PostgreSQL працює
sudo systemctl status postgresql

# Перевірити з'єднання
psql -U saas_admin -h localhost -d saas_platform_prod

# Перевірити pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Перевірити .env credentials
grep DB_ /home/saasapp/saas-platform/backend/.env
```

### Проблема: Instagram OAuth не працює

```bash
# Перевірити redirect URI в Instagram App Settings
# Має бути: https://yourdomain.com/api/instagram/accounts/oauth-callback/

# Перевірити CORS settings
grep CORS_ALLOWED_ORIGINS /home/saasapp/saas-platform/backend/.env

# Перевірити SSL certificate
curl -I https://yourdomain.com
```

### Проблема: High memory usage

```bash
# Перевірити використання пам'яті
free -h
htop

# Зменшити кількість Gunicorn workers
sudo nano /etc/systemd/system/saas-gunicorn.service
# Змінити --workers 3 на --workers 2

sudo systemctl daemon-reload
sudo systemctl restart saas-gunicorn
```

### Проблема: Migrations не застосовуються

```bash
cd /home/saasapp/saas-platform/backend
source venv/bin/activate

# Перевірити поточний стан
python manage.py showmigrations

# Застосувати міграції
python manage.py migrate

# Якщо помилка - створити фейкову міграцію
python manage.py migrate --fake app_name migration_name

# Перезапустити сервіси
sudo systemctl restart saas-gunicorn
```

---

## ✅ Post-Deployment Checklist

- [ ] ✅ Всі сервіси запущені (Gunicorn, Celery, Nginx, PostgreSQL, Redis)
- [ ] 🌐 Домен відкривається через HTTPS
- [ ] 🔒 SSL сертифікат валідний (Let's Encrypt)
- [ ] 📝 Django Admin доступний (/admin/)
- [ ] 📚 API Documentation доступна (/api/docs/)
- [ ] 🔑 Всі токени змінені на production
- [ ] 🚫 DEBUG=False в .env
- [ ] 📧 Email відправка працює
- [ ] 💳 Stripe payments працюють (test mode → live mode)
- [ ] 📱 Telegram notifications працюють
- [ ] 📸 Instagram OAuth працює
- [ ] 📊 Sentry логує помилки
- [ ] 💾 Автоматичні backups налаштовані
- [ ] 🔄 CI/CD pipeline працює
- [ ] 📈 Моніторинг налаштований
- [ ] 🧪 Production тести пройдені

---

## 📞 Support

**При проблемах:**
1. Перевірте логи: `/var/log/saas/`
2. Перевірте systemctl status для всіх сервісів
3. Перевірте Nginx error log: `/var/log/nginx/saas-error.log`
4. Перевірте Sentry для помилок Django

**Корисні команди:**

```bash
# Перезапустити всі сервіси
sudo systemctl restart saas-gunicorn saas-celery saas-celery-beat nginx

# Перевірити статус всіх сервісів
sudo systemctl status saas-gunicorn saas-celery saas-celery-beat nginx postgresql redis

# Переглянути останні логи
tail -f /var/log/saas/*.log

# Очистити кеш
redis-cli FLUSHALL
```

---

**🎉 Вітаємо! Ваш SaaS Mini-Store Platform успішно задеплоєний!**

**Production URL:** https://yourdomain.com
**Admin Panel:** https://yourdomain.com/admin/
**API Docs:** https://yourdomain.com/api/docs/
