# 🐳 Docker Guide - SaaS Mini-Store Platform

## 📋 Зміст

1. [Вступ](#-вступ)
2. [Вимоги та встановлення](#-вимоги-та-встановлення)
3. [Структура Docker файлів](#-структура-docker-файлів)
4. [Перший запуск (Development)](#-перший-запуск-development)
5. [Робота під час розробки](#-робота-під-час-розробки)
6. [Production Deployment](#-production-deployment)
7. [Docker команди](#-docker-команди)
8. [Troubleshooting](#-troubleshooting)
9. [Monitoring та Logs](#-monitoring-та-logs)
10. [Backup та Restore](#-backup-та-restore)
11. [Best Practices](#-best-practices)
12. [FAQ](#-faq)

---

## 🎯 Вступ

Цей посібник надає **повну інструкцію** по роботі з Docker для SaaS Mini-Store Platform. Docker дозволяє запускати проект у ізольованому середовищі з усіма необхідними залежностями.

### Переваги використання Docker:

✅ **Ізоляція** - Повна ізоляція від хост-системи
✅ **Відтворюваність** - Однакове середовище на всіх машинах
✅ **Швидкий старт** - Запуск проекту однією командою
✅ **Масштабованість** - Легко масштабувати сервіси
✅ **Портативність** - Працює на будь-якій ОС з Docker

### Архітектура проекту в Docker:

```
┌─────────────────────────────────────────────────────────────────┐
│                    🌐 Docker Network (saas-network)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  🐘 PostgreSQL│  │  📦 Redis    │  │  🌸 Flower   │          │
│  │  Port: 5432  │  │  Port: 6379  │  │  Port: 5555  │          │
│  │  Volume: DB  │  │  Volume: Cache│  │  (Monitor)   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                  │
│         └────────┬────────┴──────────────────┘                  │
│                  │                                              │
│         ┌────────┴────────┐                                     │
│         │                 │                                     │
│  ┌──────▼──────┐   ┌──────▼──────┐   ┌──────────────┐          │
│  │ 🔧 Backend  │   │ 👷 Celery   │   │ ⏰ Celery    │          │
│  │ Django API  │   │ Worker      │   │ Beat         │          │
│  │ Port: 8000  │   │ (Tasks)     │   │ (Scheduler)  │          │
│  └──────┬──────┘   └─────────────┘   └──────────────┘          │
│         │                                                       │
│  ┌──────▼──────┐                                                │
│  │ ⚛️  Frontend │                                                │
│  │ React+Vite  │                                                │
│  │ Port: 3000  │                                                │
│  └─────────────┘                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💻 Вимоги та встановлення

### Системні вимоги:

| Компонент | Мінімум | Рекомендовано |
|-----------|---------|---------------|
| **RAM** | 4 GB | 8 GB+ |
| **CPU** | 2 cores | 4+ cores |
| **Диск** | 10 GB | 20 GB+ |
| **ОС** | Windows 10/11, macOS 10.15+, Linux | Будь-яка сучасна |

### 🪟 Встановлення Docker на Windows

#### Крок 1: Завантаження Docker Desktop

```
┌────────────────────────────────────────┐
│  1. Відкрити браузер                   │
│  2. Перейти: docker.com/products       │
│  3. Натиснути "Download for Windows"   │
│  4. Зберегти інсталятор                │
└────────────────────────────────────────┘
```

📥 **Посилання**: https://www.docker.com/products/docker-desktop

#### Крок 2: Запуск інсталятора

```
┌──────────────────────────────────────────┐
│   Docker Desktop Setup Wizard            │
├──────────────────────────────────────────┤
│                                          │
│  ⬜ Configuration Options:               │
│                                          │
│  ☑️ Enable WSL 2 (Рекомендовано!)       │
│     ↳ Швидша робота на Windows          │
│                                          │
│  ☑️ Add shortcut to desktop             │
│     ↳ Швидкий доступ до Docker          │
│                                          │
│  [ Install ]  [ Cancel ]                 │
└──────────────────────────────────────────┘
```

1. ✅ **Обов'язково** увімкніть WSL 2
2. ✅ Дозвольте створити ярлик
3. Натисніть **Install** та зачекайте 5-10 хвилин
4. **Перезавантажте комп'ютер** після встановлення

#### Крок 3: Перший запуск

```
┌──────────────────────────────────────────┐
│  🐳 Docker Desktop                       │
├──────────────────────────────────────────┤
│                                          │
│  ✅ Docker Engine is running            │
│                                          │
│  📊 Resources:                           │
│     • CPU: 2 cores                       │
│     • Memory: 2 GB                       │
│     • Disk: 20 GB                        │
│                                          │
│  🟢 Status: Ready                        │
└──────────────────────────────────────────┘
```

#### Крок 4: Перевірка встановлення

Відкрити **PowerShell** або **Command Prompt**:

```powershell
# Перевірити версію Docker
docker --version
```

**Очікуваний вивід**:
```
Docker version 24.0.7, build afdd53b
```

```powershell
# Перевірити Docker Compose
docker-compose --version
```

**Очікуваний вивід**:
```
Docker Compose version v2.23.0
```

```powershell
# Запустити тестовий контейнер
docker run hello-world
```

**Очікуваний вивід**:
```
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

✅ **Якщо бачите ці повідомлення - встановлення успішне!**

### 🍎 Встановлення Docker на macOS

#### Крок 1: Завантаження

1. Відкрийте https://www.docker.com/products/docker-desktop
2. Виберіть версію:
   - **Intel chip**: Docker Desktop for Mac (Intel)
   - **Apple Silicon (M1/M2/M3)**: Docker Desktop for Mac (Apple Silicon)

#### Крок 2: Встановлення

```bash
# 1. Відкрийте завантажений .dmg файл
# 2. Перетягніть Docker.app в папку Applications

# 3. Запустіть Docker Desktop з Applications
# 4. При першому запуску підтвердіть привілеї адміністратора
```

#### Крок 3: Перевірка

```bash
docker --version
docker-compose --version
docker run hello-world
```

### 🐧 Встановлення Docker на Linux (Ubuntu/Debian)

#### Повна інструкція

```bash
# Крок 1: Видалити старі версії
sudo apt-get remove docker docker-engine docker.io containerd runc

# Крок 2: Встановити залежності
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Крок 3: Додати GPG ключ Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Крок 4: Додати репозиторій
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Крок 5: Встановити Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Крок 6: Додати користувача в групу docker
sudo usermod -aG docker $USER

# Крок 7: Застосувати зміни (або перелогінитись)
newgrp docker

# Крок 8: Увімкнути автозапуск
sudo systemctl enable docker
sudo systemctl start docker

# Перевірка
docker run hello-world
```

---

## 📁 Структура Docker файлів

### Файлова структура проекту:

```
d:\SaaS\
├── 🐳 docker-compose.yml              # Development конфігурація
├── 🐳 docker-compose.prod.yml         # Production конфігурація
├── 📖 DOCKER_GUIDE.md                 # Цей документ
│
├── backend/
│   ├── 🐳 Dockerfile                  # Backend Docker image
│   ├── 📝 docker-entrypoint.sh        # Ініціалізаційний скрипт
│   ├── 🚫 .dockerignore               # Виключення файлів з build
│   ├── 📦 requirements.txt            # Python залежності
│   ├── ⚙️  .env                       # Environment variables (створити!)
│   └── manage.py
│
└── frontend-vite/
    ├── 🐳 Dockerfile                  # Frontend Docker image (multi-stage)
    ├── 🌐 nginx.conf                  # Nginx для production
    ├── 🚫 .dockerignore               # Виключення з build
    ├── 📦 package.json                # Node залежності
    └── vite.config.js
```

### Детальний огляд файлів:

#### 1️⃣ `docker-compose.yml` - Development конфігурація

**Призначення**: Локальна розробка з hot reload

**Сервіси**:

| Сервіс | Образ | Порт | Призначення |
|--------|-------|------|-------------|
| **db** | postgres:15-alpine | 5432 | База даних |
| **redis** | redis:7-alpine | 6379 | Кеш + Celery broker |
| **backend** | ./backend | 8000 | Django API |
| **frontend** | ./frontend-vite | 3000 | React додаток |
| **celery-worker** | ./backend | - | Фонові задачі |
| **celery-beat** | ./backend | - | Планувальник задач |
| **flower** | ./backend | 5555 | Моніторинг Celery |

**Ключові особливості**:

```yaml
backend:
  command: python manage.py runserver 0.0.0.0:8000  # ⚡ Dev server
  volumes:
    - ./backend:/app  # 🔥 Live code reload!
  environment:
    - DEBUG=True      # 🐛 Debug mode
    - CREATE_SUPERUSER=true  # 👤 Auto-create admin
```

**Health Checks**: Всі критичні сервіси мають health checks для перевірки готовності

#### 2️⃣ `docker-compose.prod.yml` - Production конфігурація

**Відмінності від dev**:

| Параметр | Development | Production |
|----------|-------------|------------|
| **Server** | runserver | Gunicorn (4 workers) |
| **Debug** | True | False |
| **Volumes** | Bind mount (live reload) | Named volumes (статика) |
| **Restart** | unless-stopped | always |
| **Nginx** | ❌ Немає | ✅ Reverse proxy |
| **Logging** | Console | JSON files (ротація) |
| **Resources** | Без лімітів | CPU/Memory limits |

**Додатковий сервіс у Production**:

```yaml
nginx:
  image: nginx:1.25-alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    - static_volume:/app/staticfiles:ro
    - media_volume:/app/media:ro
```

#### 3️⃣ `backend/Dockerfile` - Backend образ

**Multi-layer структура**:

```
┌─────────────────────────────────────────┐
│  Layer 1: Base Image                    │
│  FROM python:3.11-slim                  │
│  Size: ~150 MB                          │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  Layer 2: System Dependencies           │
│  RUN apt-get install libpq-dev ...      │
│  Size: ~100 MB                          │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  Layer 3: Python Packages               │
│  COPY requirements.txt                  │
│  RUN pip install -r requirements.txt    │
│  Size: ~200 MB (кешується!)             │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  Layer 4: Application Code              │
│  COPY . /app                            │
│  Size: ~50 MB                           │
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│  Layer 5: Security & Entrypoint         │
│  RUN useradd django (non-root!)         │
│  ENTRYPOINT ["/docker-entrypoint.sh"]   │
└─────────────────────────────────────────┘
```

**Чому саме така структура?**

✅ **Кешування**: requirements.txt копіюється перед кодом - якщо код змінюється, але залежності ні, Layer 3 береться з кешу
✅ **Безпека**: Non-root user (django) з UID 1000
✅ **Ініціалізація**: Entrypoint чекає на БД, робить міграції, збирає статику

#### 4️⃣ `backend/docker-entrypoint.sh` - Ініціалізація

**Що відбувається при старті контейнера**:

```
┌──────────────────────────────────────────┐
│  🐳 Container Starting...                │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  ⏳ Step 1: Wait for PostgreSQL          │
│  Checking db:5432 ...                    │
│  ● ● ● ● ● ✅ Connected!                 │
│  Duration: 3 seconds                     │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  ⏳ Step 2: Wait for Redis               │
│  Checking redis:6379 ...                 │
│  ● ● ✅ Connected!                        │
│  Duration: 1 second                      │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  📦 Step 3: Apply Migrations             │
│  Running: python manage.py migrate       │
│  Operations to perform:                  │
│    Applying auth.0001_initial... OK      │
│    Applying accounts.0001_initial... OK  │
│    ... (15 migrations)                   │
│  ✅ All migrations applied!               │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  📁 Step 4: Collect Static Files         │
│  Running: collectstatic --noinput        │
│  124 static files copied to staticfiles/ │
│  ✅ Static files collected!               │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  👤 Step 5: Create Superuser (if needed) │
│  Username: admin                         │
│  Email: admin@example.com                │
│  Password: admin                         │
│  ✅ Superuser created!                    │
└──────────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────────┐
│  🚀 Step 6: Start Application            │
│  Executing: python manage.py runserver   │
│  Django version 5.2.4                    │
│  Starting server at http://0.0.0.0:8000/ │
│  🟢 Backend is ready!                     │
└──────────────────────────────────────────┘
```

**Код скрипта** (`backend/docker-entrypoint.sh`):

```bash
#!/bin/bash
set -e

echo "🐳 Starting Django Backend..."

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z ${DB_HOST:-db} ${DB_PORT:-5432}; do
  sleep 0.5
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis
echo "⏳ Waiting for Redis..."
while ! nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  sleep 0.5
done
echo "✅ Redis is ready!"

# Apply migrations
echo "📦 Applying database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create superuser (dev only)
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
exec "$@"
```

#### 5️⃣ `frontend-vite/Dockerfile` - Multi-stage build

**Stage 1: Builder** (тільки для збірки):

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# Встановити залежності
COPY package*.json ./
RUN npm ci

# Зібрати production build
COPY . .
RUN npm run build
# Результат: /app/dist/ (~2 MB оптимізованих файлів)
```

**Stage 2: Production** (фінальний образ):

```dockerfile
FROM nginx:1.25-alpine
# Копіювати ТІЛЬКИ build з попереднього stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Переваги multi-stage**:

| Параметр | Single-stage | Multi-stage |
|----------|--------------|-------------|
| **Розмір** | ~1.2 GB | ~50 MB |
| **Безпека** | node_modules в образі | Тільки статика |
| **Швидкість** | Повільніше | Швидше |

#### 6️⃣ `.dockerignore` файли

**Чому важливо**:

✅ **Швидша збірка**: Менше файлів копіюється
✅ **Менший образ**: Виключення зайвих файлів
✅ **Безпека**: .env не потрапляє в образ

**`backend/.dockerignore`**:

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/

# Django
*.log
db.sqlite3
staticfiles/
media/

# Environment
.env
.env.local

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
*.swp
```

**`frontend-vite/.dockerignore`**:

```
# Node
node_modules/
npm-debug.log
yarn-error.log

# Build
dist/
build/
.cache/

# Environment
.env
.env.local
.env.production

# Git
.git/
.gitignore

# IDE
.vscode/
.idea/
```

---

## 🚀 Перший запуск (Development)

### Передумови

✅ Docker Desktop встановлено і запущено
✅ Клоновано репозиторій проекту
✅ Термінал відкрито в кореневій папці проекту

### Крок 1: Створення .env файлу

**Windows (PowerShell)**:

```powershell
# Перейти в папку backend
cd backend

# Створити .env файл
New-Item -Path ".env" -ItemType File

# Відкрити в блокноті
notepad .env
```

**macOS/Linux**:

```bash
cd backend
touch .env
nano .env  # або vim, code, etc.
```

**Вставити наступний вміст**:

```bash
# Django Core
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production-min-50-chars
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database (автоматично з docker-compose)
DB_HOST=db
DB_PORT=5432
DB_NAME=saas_platform
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (автоматично з docker-compose)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# Auto-create superuser (dev only)
CREATE_SUPERUSER=true
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@example.com
DJANGO_SUPERUSER_PASSWORD=admin

# Instagram (опціонально - залиште пустим якщо не використовуєте)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
INSTAGRAM_REDIRECT_URI=http://localhost:8000/api/instagram/oauth/callback

# Telegram (опціонально)
TELEGRAM_BOT_TOKEN=
```

**Зберегти файл** (Ctrl+S) та **повернутись в корінь проекту**:

```bash
cd ..
```

### Крок 2: Перевірка структури

```bash
# Windows (PowerShell)
Get-ChildItem -Recurse -Include "Dockerfile","docker-compose.yml",".dockerignore"

# macOS/Linux
find . -name "Dockerfile" -o -name "docker-compose.yml" -o -name ".dockerignore"
```

**Має знайти**:
```
✅ ./docker-compose.yml
✅ ./docker-compose.prod.yml
✅ ./backend/Dockerfile
✅ ./backend/.dockerignore
✅ ./backend/docker-entrypoint.sh
✅ ./frontend-vite/Dockerfile
✅ ./frontend-vite/.dockerignore
```

### Крок 3: Збірка Docker images

```bash
docker-compose build
```

**Процес збірки** (займе 5-10 хвилин при першому запуску):

```
[+] Building 456.2s (32/32) FINISHED

 => [backend internal] load build definition from Dockerfile         0.1s
 => [backend internal] load .dockerignore                           0.0s
 => [backend internal] load metadata for docker.io/library/python   2.3s

 => [backend 1/8] FROM docker.io/library/python:3.11-slim          15.4s
 => [backend 2/8] RUN apt-get update && apt-get install...         67.8s
 => [backend 3/8] COPY requirements.txt .                           0.3s
 => [backend 4/8] RUN pip install -r requirements.txt             234.5s
    ⬇️ Downloading packages...
    📦 Installing Django 5.2.4
    📦 Installing djangorestframework 3.14.0
    📦 Installing celery 5.3.4
    ... (45 packages total)
 => [backend 5/8] COPY . /app                                       2.1s
 => [backend 6/8] RUN mkdir -p /app/staticfiles                     0.4s
 => [backend 7/8] RUN useradd -m -u 1000 django                     0.6s
 => [backend 8/8] COPY docker-entrypoint.sh                         0.2s
 => [backend] exporting layers                                      5.3s
 => [backend] writing image sha256:abc123...                        0.1s
 => [backend] naming to docker.io/library/saas-backend             0.0s

 => [frontend builder] FROM docker.io/library/node:20-alpine        8.2s
 => [frontend builder] COPY package*.json ./                        0.2s
 => [frontend builder] RUN npm ci                                  89.3s
    ⬇️ Downloading packages...
    📦 Installing react 19.1.0
    📦 Installing vite 5.0.8
    ... (256 packages total)
 => [frontend builder] COPY . .                                     1.8s
 => [frontend builder] RUN npm run build                           12.4s
    🔨 Building production bundle...
    ✅ Build complete: dist/ (2.3 MB)
 => [frontend] FROM nginx:1.25-alpine                               3.1s
 => [frontend] COPY --from=builder /app/dist                        1.2s
 => [frontend] exporting layers                                     2.1s
 => [frontend] naming to docker.io/library/saas-frontend           0.0s

✅ Build complete!
```

**Перевірити створені images**:

```bash
docker images | grep saas
```

**Вивід**:
```
REPOSITORY          TAG       SIZE      CREATED
saas-backend        latest    580 MB    2 minutes ago
saas-frontend       latest    48 MB     2 minutes ago
```

### Крок 4: Запуск сервісів

```bash
docker-compose up
```

**Що відбувається** (перший запуск займе 1-2 хвилини):

```
[+] Running 7/7
 ✔ Network saas_saas-network      Created                          0.2s
 ✔ Volume "saas_postgres_data"    Created                          0.0s
 ✔ Volume "saas_redis_data"       Created                          0.0s
 ✔ Volume "saas_static_volume"    Created                          0.0s
 ✔ Volume "saas_media_volume"     Created                          0.0s

🐘 Starting saas_db...
saas_db      | PostgreSQL init process complete
saas_db      | PostgreSQL is ready to accept connections

📦 Starting saas_redis...
saas_redis   | Redis 7.2.3 (00000000/0) 64 bit
saas_redis   | Server initialized
saas_redis   | Ready to accept connections

🔧 Starting saas_backend...
saas_backend | 🐳 Starting Django Backend...
saas_backend | ⏳ Waiting for PostgreSQL...
saas_backend | ✅ PostgreSQL is ready!
saas_backend | ⏳ Waiting for Redis...
saas_backend | ✅ Redis is ready!
saas_backend | 📦 Applying database migrations...
saas_backend | Operations to perform:
saas_backend |   Apply all migrations: admin, auth, contenttypes, sessions, accounts, stores, products, orders, core
saas_backend | Running migrations:
saas_backend |   Applying contenttypes.0001_initial... OK
saas_backend |   Applying auth.0001_initial... OK
saas_backend |   Applying accounts.0001_initial... OK
saas_backend |   ... (applying 23 migrations total)
saas_backend | 📁 Collecting static files...
saas_backend | 124 static files copied to '/app/staticfiles'.
saas_backend | 👤 Creating superuser...
saas_backend | ✅ Superuser created!
saas_backend | 🚀 Starting application...
saas_backend | Django version 5.2.4, using settings 'core.settings'
saas_backend | Starting development server at http://0.0.0.0:8000/
saas_backend | Quit the server with CONTROL-C.

⚛️  Starting saas_frontend...
saas_frontend |
saas_frontend |   VITE v5.0.8  ready in 892 ms
saas_frontend |
saas_frontend |   ➜  Local:   http://localhost:3000/
saas_frontend |   ➜  Network: http://172.25.0.6:3000/

👷 Starting saas_celery_worker...
saas_celery_worker | celery@worker ready.

⏰ Starting saas_celery_beat...
saas_celery_beat | celery beat v5.3.4 is starting.

🌸 Starting saas_flower...
saas_flower | [I] Flower is running on http://0.0.0.0:5555
```

### Крок 5: Перевірка роботи

**5.1. Статус контейнерів**:

```bash
docker-compose ps
```

**Очікуваний вивід**:

```
┌──────────────────────┬─────────────────┬──────────┬─────────────────────┐
│ NAME                 │ IMAGE           │ STATUS   │ PORTS               │
├──────────────────────┼─────────────────┼──────────┼─────────────────────┤
│ saas_backend         │ saas-backend    │ Up 1 min │ 0.0.0.0:8000->8000  │
│ saas_celery_beat     │ saas-backend    │ Up 1 min │                     │
│ saas_celery_worker   │ saas-backend    │ Up 1 min │                     │
│ saas_db              │ postgres:15     │ Up 1 min │ 0.0.0.0:5432->5432  │
│ saas_flower          │ saas-backend    │ Up 1 min │ 0.0.0.0:5555->5555  │
│ saas_frontend        │ saas-frontend   │ Up 1 min │ 0.0.0.0:3000->3000  │
│ saas_redis           │ redis:7         │ Up 1 min │ 0.0.0.0:6379->6379  │
└──────────────────────┴─────────────────┴──────────┴─────────────────────┘
```

✅ Всі сервіси мають статус **"Up"**!

**5.2. Доступність endpoints**:

Відкрити браузер та перевірити:

```
┌────────────────────────────────────────────────────┐
│  📍 Доступні URL:                                  │
├────────────────────────────────────────────────────┤
│  ⚛️  Frontend:      http://localhost:3000          │
│  🔧 Backend API:   http://localhost:8000/api       │
│  👤 Admin Panel:   http://localhost:8000/admin     │
│  📖 API Docs:      http://localhost:8000/api/docs  │
│  🌸 Flower:        http://localhost:5555           │
└────────────────────────────────────────────────────┘
```

**Тест 1: Backend Health Check**

```bash
curl http://localhost:8000/api/health/
```

Очікується: `{"status": "ok"}`

**Тест 2: Frontend**

Відкрити http://localhost:3000 - має завантажитись React додаток

**Тест 3: Admin Panel**

Відкрити http://localhost:8000/admin

```
┌──────────────────────────────────────┐
│  🔐 Django Administration            │
├──────────────────────────────────────┤
│                                      │
│  Username: admin                     │
│  ┌────────────────────────────────┐  │
│  │ admin                          │  │
│  └────────────────────────────────┘  │
│                                      │
│  Password: admin                     │
│  ┌────────────────────────────────┐  │
│  │ ••••••••                       │  │
│  └────────────────────────────────┘  │
│                                      │
│  [ Log in ]                          │
└──────────────────────────────────────┘
```

Логін: `admin` / Пароль: `admin`

**Тест 4: API Documentation**

Відкрити http://localhost:8000/api/docs - Swagger UI з документацією API

**Тест 5: Flower (Celery Monitoring)**

Відкрити http://localhost:5555

```
┌──────────────────────────────────────────────┐
│  🌸 Flower - Celery Monitoring               │
├──────────────────────────────────────────────┤
│  📊 Dashboard                                │
│                                              │
│  👷 Workers: 1 online                        │
│     • celery@worker (active)                │
│     • Concurrency: 2                        │
│                                              │
│  📋 Tasks:                                   │
│     • Succeeded: 0                          │
│     • Failed: 0                             │
│     • Queued: 0                             │
└──────────────────────────────────────────────┘
```

### Крок 6: Зупинка сервісів

**Зупинити (Ctrl+C в терміналі де запущено docker-compose up)**:

```
Gracefully stopping... (press Ctrl+C again to force)
[+] Stopping 7/7
 ✔ Container saas_flower          Stopped                          2.3s
 ✔ Container saas_celery_beat     Stopped                          2.1s
 ✔ Container saas_celery_worker   Stopped                          2.4s
 ✔ Container saas_frontend        Stopped                          1.2s
 ✔ Container saas_backend         Stopped                          2.8s
 ✔ Container saas_redis           Stopped                          0.5s
 ✔ Container saas_db              Stopped                          1.1s
```

**Або зупинити у фоні**:

```bash
docker-compose down
```

**Зупинити та видалити volumes** (⚠️ **УВАГА**: Видалить дані БД!):

```bash
docker-compose down -v
```

---

## 🛠️ Робота під час розробки

### Запуск у фоновому режимі

```bash
# Запустити у фоні (detached mode)
docker-compose up -d
```

**Переваги**:
- ✅ Термінал вільний для інших команд
- ✅ Процес не зупиняється при закритті терміналу
- ✅ Можна одночасно працювати з кількома проектами

**Перевірити статус**:

```bash
docker-compose ps
```

**Подивитись логи**:

```bash
# Логи всіх сервісів
docker-compose logs

# Логи конкретного сервісу
docker-compose logs backend

# Логи в реальному часі (follow)
docker-compose logs -f backend

# Останні 100 рядків
docker-compose logs --tail=100 backend

# З timestamp
docker-compose logs -t backend
```

### Live Reload (Hot Reload)

#### Backend (Django)

Django runserver **автоматично перезавантажується** при зміні `.py` файлів:

```python
# Змінити backend/accounts/views.py
def my_view(request):
    return Response({"message": "Updated!"})  # Додати новий код
```

**У логах одразу побачите**:

```
saas_backend | Watching for file changes with StatReloader
saas_backend | /app/accounts/views.py changed, reloading.
saas_backend | Performing system checks...
saas_backend | System check identified no issues (0 silenced).
saas_backend | Starting development server at http://0.0.0.0:8000/
```

⚡ **Зміни застосовуються за 1-2 секунди!**

#### Frontend (Vite)

Vite має **миттєвий HMR** (Hot Module Replacement):

```jsx
// Змінити frontend-vite/src/App.jsx
function App() {
  return <div>Updated content!</div>  // Змінити текст
}
```

**У логах**:

```
saas_frontend | 10:23:45 [vite] hmr update /src/App.jsx
saas_frontend | 10:23:45 [vite] page reload src/App.jsx
```

⚡ **Браузер оновлюється МИТТЄВО без перезавантаження сторінки!**

### Виконання команд у контейнерах

#### Django Management Commands

```bash
# Синтаксис
docker-compose exec backend python manage.py <command>

# Приклади:

# Створити міграції
docker-compose exec backend python manage.py makemigrations

# Застосувати міграції
docker-compose exec backend python manage.py migrate

# Створити суперюзера
docker-compose exec backend python manage.py createsuperuser

# Django shell
docker-compose exec backend python manage.py shell

# Запустити тести
docker-compose exec backend python manage.py test

# Створити додаток
docker-compose exec backend python manage.py startapp myapp

# Collect static
docker-compose exec backend python manage.py collectstatic
```

#### Приклад: Створення нової міграції

```bash
# 1. Змінити models.py
# backend/products/models.py
class Product(models.Model):
    # ...
    featured = models.BooleanField(default=False)  # Додано нове поле

# 2. Створити міграцію
docker-compose exec backend python manage.py makemigrations

# Вивід:
# Migrations for 'products':
#   products/migrations/0002_product_featured.py
#     - Add field featured to product

# 3. Застосувати міграцію
docker-compose exec backend python manage.py migrate

# Вивід:
# Operations to perform:
#   Apply all migrations: products
# Running migrations:
#   Applying products.0002_product_featured... OK
```

#### Bash в контейнері

```bash
# Зайти в bash backend контейнера
docker-compose exec backend bash

# Тепер ви всередині контейнера:
django@abc123:/app$ ls
manage.py  core/  accounts/  products/  ...

django@abc123:/app$ python manage.py shell
>>> from products.models import Product
>>> Product.objects.count()
42

# Вийти
django@abc123:/app$ exit
```

#### NPM команди (Frontend)

```bash
# Встановити новий пакет
docker-compose exec frontend npm install axios

# Оновити залежності
docker-compose exec frontend npm update

# Запустити lint
docker-compose exec frontend npm run lint

# Build production
docker-compose exec frontend npm run build
```

#### PostgreSQL команди

```bash
# Зайти в PostgreSQL CLI
docker-compose exec db psql -U postgres -d saas_platform

# Всередині psql:
saas_platform=# \dt                    # Список таблиць
saas_platform=# \d products_product    # Структура таблиці

# SQL запит
saas_platform=# SELECT id, name, price FROM products_product LIMIT 5;

# Вийти
saas_platform=# \q
```

#### Redis команди

```bash
# Зайти в Redis CLI
docker-compose exec redis redis-cli

# Всередині redis-cli:
127.0.0.1:6379> KEYS *              # Всі ключі
127.0.0.1:6379> GET my_key          # Отримати значення
127.0.0.1:6379> FLUSHALL            # Очистити весь кеш (обережно!)
127.0.0.1:6379> exit
```

#### Celery команди

```bash
# Перевірити статус worker
docker-compose exec celery-worker celery -A core inspect active

# Список зареєстрованих tasks
docker-compose exec celery-worker celery -A core inspect registered

# Статистика worker
docker-compose exec celery-worker celery -A core inspect stats

# Очистити чергу задач
docker-compose exec backend python manage.py shell
>>> from celery import current_app
>>> current_app.control.purge()
```

### Перезапуск сервісів

```bash
# Перезапустити всі сервіси
docker-compose restart

# Перезапустити конкретний сервіс
docker-compose restart backend

# Перезапустити декілька сервісів
docker-compose restart backend celery-worker

# Зупинити та знову запустити
docker-compose stop backend
docker-compose start backend

# Пересворити контейнер (якщо змінився Dockerfile)
docker-compose up -d --force-recreate backend
```

### Моніторинг ресурсів

```bash
# Використання CPU/RAM/Network в реальному часі
docker stats
```

**Вивід**:

```
CONTAINER ID   NAME                  CPU %   MEM USAGE / LIMIT     MEM %   NET I/O
abc123def456   saas_backend          2.5%    180MiB / 8GiB         2.27%   1.2MB / 890kB
def456ghi789   saas_frontend         0.1%    45MiB / 8GiB          0.57%   450kB / 320kB
ghi789jkl012   saas_db               1.2%    250MiB / 8GiB         3.15%   2.3MB / 1.8MB
jkl012mno345   saas_redis            0.3%    15MiB / 8GiB          0.19%   340kB / 280kB
mno345pqr678   saas_celery_worker    1.8%    120MiB / 8GiB         1.51%   670kB / 540kB
```

**Використання диску**:

```bash
docker system df
```

**Вивід**:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          5         5         2.1GB     0B (0%)
Containers      7         7         450MB     0B (0%)
Local Volumes   4         4         1.5GB     0B (0%)
Build Cache     12        0         850MB     850MB (100%)
```

### Debugging

#### Python Debugging (ipdb)

```python
# backend/accounts/views.py
def login_view(request):
    import ipdb; ipdb.set_trace()  # 🔴 Breakpoint
    username = request.data.get('username')
    ...
```

**Запустити backend з прикріпленим TTY**:

```bash
# Зупинити detached backend
docker-compose stop backend

# Запустити з підключенням до stdin/stdout
docker-compose run --rm --service-ports backend

# Тепер при виклику цієї функції з'явиться ipdb prompt:
> /app/accounts/views.py(15)login_view()
     14     import ipdb; ipdb.set_trace()
---> 15     username = request.data.get('username')
     16     password = request.data.get('password')

ipdb> username        # Подивитись значення
'admin'
ipdb> n              # Next line
ipdb> c              # Continue
ipdb> q              # Quit
```

#### Browser DevTools (Frontend)

```javascript
// src/App.jsx
function App() {
  console.log('🔍 App component rendered');
  debugger;  // 🔴 Breakpoint у Chrome DevTools

  return <div>...</div>;
}
```

Відкрити Chrome DevTools (F12) → Sources → встановити breakpoint

---

## 🚀 Production Deployment

### Підготовка

#### Крок 1: Створити .env.production

```bash
# backend/.env.production
DEBUG=False
SECRET_KEY=GENERATE_NEW_RANDOM_SECRET_KEY_MIN_50_CHARS_HERE
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database (використовуйте керовану БД!)
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=saas_platform_prod
DB_USER=saas_admin
DB_PASSWORD=STRONG_PASSWORD_HERE

# Redis (використовуйте керований Redis!)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=REDIS_PASSWORD_HERE
REDIS_URL=redis://:REDIS_PASSWORD_HERE@your-redis-host.com:6379/0

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Sentry (опціонально)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# AWS S3 (опціонально, для статики/медіа)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_STORAGE_BUCKET_NAME=your-bucket
AWS_S3_REGION_NAME=eu-central-1
```

#### Крок 2: Збірка production images

```bash
# Зібрати production images
docker-compose -f docker-compose.prod.yml build --no-cache

# Займе 5-10 хвилин
```

#### Крок 3: Запуск production

```bash
# Запустити у фоні
docker-compose -f docker-compose.prod.yml up -d

# Перевірити статус
docker-compose -f docker-compose.prod.yml ps

# Подивитись логи
docker-compose -f docker-compose.prod.yml logs -f
```

### SSL/HTTPS Setup

Детальні інструкції дивіться у [DEPLOYMENT.md](DEPLOYMENT.md#ssl-сертифікати)

**Коротка версія з Let's Encrypt**:

```bash
# На хості (не в Docker)
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your-email@example.com

# Скопіювати сертифікати
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Перезапустити Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

---

## 🔧 Docker команди

### Базові команди

```bash
# 📦 IMAGES
docker images                              # Список images
docker image ls                            # Те саме
docker image rm IMAGE_ID                   # Видалити image
docker image prune                         # Видалити невикористані
docker image inspect IMAGE_ID              # Детальна інформація

# 📦 CONTAINERS
docker ps                                  # Запущені контейнери
docker ps -a                               # Всі контейнери
docker rm CONTAINER_ID                     # Видалити контейнер
docker container prune                     # Видалити зупинені

# 📊 LOGS
docker logs CONTAINER_ID                   # Логи
docker logs -f CONTAINER_ID                # Follow логи
docker logs --tail=50 CONTAINER_ID         # Останні 50 рядків
docker logs --since=1h CONTAINER_ID        # За останню годину

# 🔧 EXEC
docker exec -it CONTAINER_ID bash          # Зайти в контейнер
docker exec CONTAINER_ID ls -la            # Виконати команду

# 📊 STATS
docker stats                               # CPU/RAM в реальному часі
docker system df                           # Використання диску

# 💾 VOLUMES
docker volume ls                           # Список volumes
docker volume rm VOLUME_NAME               # Видалити volume
docker volume prune                        # Видалити невикористані

# 🌐 NETWORKS
docker network ls                          # Список мереж
docker network inspect NETWORK_NAME        # Детальна інформація
docker network prune                       # Видалити невикористані

# 🧹 CLEANUP
docker system prune                        # Очистити невикористане
docker system prune -a                     # Агресивна очистка
docker system prune -a --volumes           # Також видалити volumes
```

### Docker Compose команди

```bash
# 🏗️ BUILD
docker-compose build                       # Зібрати всі
docker-compose build backend               # Зібрати один сервіс
docker-compose build --no-cache            # Без кешу
docker-compose build --pull                # Оновити base images

# 🚀 START/STOP
docker-compose up                          # Запустити (foreground)
docker-compose up -d                       # Запустити (background)
docker-compose up --build                  # Зібрати та запустити
docker-compose down                        # Зупинити та видалити
docker-compose down -v                     # Також видалити volumes
docker-compose stop                        # Зупинити (контейнери залишаються)
docker-compose start                       # Продовжити зупинені
docker-compose restart                     # Перезапустити

# 📊 INFO
docker-compose ps                          # Статус сервісів
docker-compose ps -a                       # Всі контейнери
docker-compose top                         # Процеси
docker-compose logs                        # Логи всіх
docker-compose logs -f backend             # Follow логи
docker-compose logs --tail=100 backend     # Останні 100

# 🔧 EXEC
docker-compose exec backend bash           # Зайти в bash
docker-compose exec backend python manage.py shell
docker-compose run --rm backend pytest     # Нова команда

# ⚖️ SCALE
docker-compose up -d --scale celery-worker=4  # 4 workers
```

---

## 🐛 Troubleshooting

### Проблема 1: Port already in use

**Помилка**:
```
Error starting userland proxy: listen tcp4 0.0.0.0:8000: bind: address already in use
```

**Рішення**:

```bash
# Windows - знайти процес
netstat -ano | findstr :8000

# Вбити процес
taskkill /PID <PID> /F

# Linux/macOS - знайти процес
lsof -i :8000

# Вбити процес
kill -9 <PID>

# АБО змінити порт у docker-compose.yml
ports:
  - "8001:8000"  # Використати 8001 замість 8000
```

### Проблема 2: Container exits immediately

**Діагностика**:

```bash
# Подивитись логи
docker-compose logs backend

# Запустити вручну з bash
docker-compose run --rm backend bash
```

**Поширені причини**:

1. **Синтаксична помилка в entrypoint.sh**
   ```bash
   # Перевірити line endings (має бути LF)
   dos2unix backend/docker-entrypoint.sh
   ```

2. **PostgreSQL не доступний**
   ```bash
   # Збільшити timeout у entrypoint.sh
   TIMEOUT=60
   ```

3. **Відсутні environment variables**
   ```bash
   # Перевірити .env файл
   cat backend/.env
   ```

### Проблема 3: Out of disk space

**Діагностика**:

```bash
docker system df
```

**Очистка**:

```bash
# Видалити build cache
docker builder prune

# Видалити невикористані images
docker image prune -a

# Повна очистка (⚠️ обережно!)
docker system prune -a --volumes
```

### Проблема 4: Slow build times

**Оптимізація**:

1. Використати BuildKit:
   ```bash
   # У .env файлі
   COMPOSE_DOCKER_CLI_BUILD=1
   DOCKER_BUILDKIT=1
   ```

2. Перевірити .dockerignore файли

3. Правильний порядок COPY у Dockerfile

### Проблема 5: Changes not reflecting

**Backend не бачить зміни коду**:

```bash
# Перевірити volume mounting
docker inspect saas_backend | grep Mounts

# Має бути:
"Source": "/host/path/backend"
"Destination": "/app"

# На Windows - перевірити File Sharing у Docker Desktop
```

---

## 📊 Monitoring та Logs

### Логи

```bash
# Всі логи
docker-compose logs

# Конкретний сервіс
docker-compose logs backend

# Follow режим (real-time)
docker-compose logs -f

# Останні N рядків
docker-compose logs --tail=100 backend

# З timestamp
docker-compose logs -t backend

# Фільтрація
docker-compose logs | grep ERROR
docker-compose logs backend | grep "POST /api"
```

### Ресурси

```bash
# CPU/RAM monitoring
docker stats

# Disk usage
docker system df
```

---

## 💾 Backup та Restore

### Backup Database

```bash
# Створити backup
docker-compose exec db pg_dump -U postgres saas_platform > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker-compose exec db pg_dump -U postgres saas_platform | gzip > backup.sql.gz
```

### Restore Database

```bash
# Зупинити backend
docker-compose stop backend celery-worker celery-beat

# Restore
docker-compose exec -T db psql -U postgres saas_platform < backup.sql

# Або з compressed
gunzip < backup.sql.gz | docker-compose exec -T db psql -U postgres saas_platform

# Запустити backend
docker-compose start backend celery-worker celery-beat
```

### Backup Volumes

```bash
# Media files
docker run --rm \
  -v saas_media_volume:/source:ro \
  -v $(pwd)/backups:/backup \
  alpine \
  tar czf /backup/media_$(date +%Y%m%d).tar.gz -C /source .
```

---

## ✅ Best Practices

### Security

✅ Non-root users у контейнерах
✅ Secrets через .env (не в Dockerfile)
✅ Не expose БД порти назовні в production
✅ Регулярно оновлювати base images

### Performance

✅ Multi-stage builds (frontend)
✅ .dockerignore файли
✅ Правильний порядок COPY
✅ Resource limits у production

### Development

✅ Hot reload для швидкої розробки
✅ Однакові версії пакетів (lock files)
✅ Health checks для всіх сервісів

### Production

✅ Health checks обов'язкові
✅ Logging з ротацією
✅ Restart policies (always)
✅ Graceful shutdown

---

## ❓ FAQ

**Q: Як оновити Python версію?**
A: Змінити `FROM python:3.12-slim` у Dockerfile та rebuild.

**Q: Як додати новий Python пакет?**
A: Додати в requirements.txt → `docker-compose build backend`

**Q: Як під'єднатись до БД ззовні?**
A: Expose порт 5432 (тільки dev!) та використати DBeaver/pgAdmin.

**Q: Як запустити Django command?**
A: `docker-compose exec backend python manage.py <command>`

**Q: Як очистити Docker повністю?**
A: `docker system prune -a --volumes` (⚠️ видалить всі дані!)

**Q: Чому backend не бачить зміни?**
A: Перевірити volume mounting та File Sharing (Windows).

**Q: Як дебажити?**
A: Використати ipdb для Python, DevTools для frontend.

---

## 📚 Додаткові ресурси

- 📖 [Docker Documentation](https://docs.docker.com/)
- 📖 [Docker Compose Documentation](https://docs.docker.com/compose/)
- 📖 [Django Deployment Checklist](https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/)
- 📖 [Deployment Guide](DEPLOYMENT.md) - Детальна інструкція по deployment

---

## 🎉 Готово!

```
┌──────────────────────────────────────────────┐
│  ✅ Docker Setup Complete!                   │
├──────────────────────────────────────────────┤
│  📍 Frontend:    http://localhost:3000       │
│  📍 Backend:     http://localhost:8000       │
│  📍 Admin:       http://localhost:8000/admin │
│  📍 API Docs:    http://localhost:8000/api/docs │
│  📍 Flower:      http://localhost:5555       │
│                                              │
│  🔐 Admin Login: admin / admin               │
└──────────────────────────────────────────────┘
```

**Команди для швидкого старту**:

```bash
# Перший запуск
docker-compose build
docker-compose up -d

# Щоденна робота
docker-compose up -d              # Запустити
docker-compose logs -f backend    # Дивитись логи
docker-compose exec backend bash  # Зайти в контейнер
docker-compose down               # Зупинити

# Production
docker-compose -f docker-compose.prod.yml up -d
```

**🚀 Happy coding with Docker!**
