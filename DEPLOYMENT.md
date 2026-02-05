# 🚀 Інструкція з розгортування StoreHub

## 📋 Вміст

1. [Вимоги](#-вимоги)
2. [Встановлення](#-встановлення)
3. [Конфігурація](#️-конфігурація)
4. [Запуск](#-запуск)
5. [Тестування](#-тестування)
6. [Production Deployment](#-production-deployment)

---

## ✅ Вимоги

### 🖥️ Системні вимоги

```
✓ Windows 10+, macOS 10.15+ або Linux (Ubuntu 20.04+)
✓ RAM: 8GB мінімум
✓ Дисковий простір: 20GB
✓ Інтернет з'єднання
```

### 📦 Встановлений софт

```
✓ Python 3.10+ (https://www.python.org)
✓ PostgreSQL 12+ (https://www.postgresql.org)
✓ Redis (https://redis.io)
✓ Node.js 16+ (https://nodejs.org)
✓ npm або yarn (йде з Node.js)
✓ Git (https://git-scm.com)
```

### 🔑 API ключі (потрібні для інтеграцій)

| Сервіс       | Ключ                                       | Статус      |
| ------------ | ------------------------------------------ | ----------- |
| 💳 Stripe    | `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`  | Обов'язково |
| 🏦 PayPal    | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Обов'язково |
| 🇷🇺 ЮKassa    | `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`  | Обов'язково |
| 🤖 Telegram  | `TELEGRAM_BOT_TOKEN`                       | Обов'язково |
| 📸 Instagram | `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET` | Опціонально |
| 📧 Email     | `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`   | Обов'язково |

---

## 🔧 Встановлення

### Крок 1️⃣: Клонування репозиторія

```bash
# Відкрити terminal/PowerShell
cd path/to/projects

# Клонувати проект
git clone https://github.com/Juleanna/SaaS.git
cd SaaS
```

### Крок 2️⃣: Встановлення PostgreSQL

#### 🪟 Windows

```bash
# Завантажити інсталятор з https://www.postgresql.org/download/windows/
# Запустити інсталятор та дотримуватися інструкцій
# Запам'ятати пароль суперкористувача (postgres)

# Перевірити встановлення
psql --version
```

#### 🍎 macOS

```bash
# Встановити через Homebrew
brew install postgresql@15

# Запустити сервіс
brew services start postgresql@15

# Перевірити
psql --version
```

#### 🐧 Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Перевірити
psql --version
```

### Крок 3️⃣: Встановлення Redis

#### 🪟 Windows

```bash
# Завантажити з https://github.com/microsoftarchive/redis/releases
# Запустити .msi інсталятор
# Або використати WSL2: wsl --install
```

#### 🍎 macOS

```bash
brew install redis
brew services start redis
```

#### 🐧 Linux

```bash
sudo apt install redis-server
sudo systemctl start redis-server
```

### Крок 4️⃣: Встановлення Backend

```bash
# Перейти в папку backend
cd backend

# Створити віртуальне середовище
python -m venv venv

# Активувати віртуальне середовище
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Встановити залежності
pip install --upgrade pip
pip install -r requirements.txt

# Перевірити встановлення
pip list
```

### Крок 5️⃣: Встановлення Frontend

```bash
# Перейти в папку frontend
cd ../frontend-vite

# Встановити залежності
npm install

# Перевірити
npm --version
```

---

## ⚙️ Конфігурація

### Крок 1️⃣: Налаштування базі даних

```bash
# Підключитися до PostgreSQL
psql -U postgres

# Створити базу даних
CREATE DATABASE saas_platform;
CREATE USER saas_user WITH PASSWORD 'your-strong-password-here';

-- Надати дозволи
ALTER ROLE saas_user SET client_encoding TO 'utf8';
ALTER ROLE saas_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE saas_user SET default_transaction_deferrable TO on;
ALTER ROLE saas_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE saas_platform TO saas_user;

-- Вихід
\q
```

### Крок 2️⃣: Налаштування环境

```bash
# Перейти у backend папку
cd backend

# Копіювати шаблон
cp env.example .env

# Редагувати .env файл (відкрити у текстовому редакторі)
```

#### 📝 Приклад .env файлу:

```ini
# 🔐 Django Налаштування
SECRET_KEY=your-super-secret-key-change-this-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 📊 База даних
DB_NAME=saas_platform
DB_USER=saas_user
DB_PASSWORD=your-strong-password-here
DB_HOST=localhost
DB_PORT=5432

# 🔴 Redis
REDIS_URL=redis://localhost:6379/0

# 📧 Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@storeHub.com

# 🤖 Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# 💳 Stripe
STRIPE_API_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
STRIPE_PUBLISHABLE_KEY=pk_test_your-key

# 🏦 PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret

# 🇷🇺 ЮKassa
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key

# 📸 Instagram (опціонально)
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token

# 🌐 Site URL
SITE_URL=http://localhost:8000
```

### Крок 3️⃣: Налаштування Google Email

Для використання Gmail як поштового сервера:

1. **Включити 2-Step Verification**:
   - Перейти на [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification → ON

2. **Створити App Password**:
   - Перейти на [Security Settings](https://myaccount.google.com/apppasswords)
   - Вибрати "Mail" та "Windows Computer" (або ваше)
   - Скопіювати 16-символьний пароль
   - Вставити в `EMAIL_HOST_PASSWORD`

### Крок 4️⃣: Налаштування Stripe

```bash
# 1. Перейти на https://dashboard.stripe.com
# 2. Отримати тестові ключі
# 3. Вставити в .env файл
```

### Крок 5️⃣: Налаштування Telegram Bot

```bash
# 1. Відкрити Telegram та знайти @BotFather
# 2. Написати /newbot
# 3. Дотримуватися інструкцій
# 4. Скопіювати токен в TELEGRAM_BOT_TOKEN
```

---

## 🚀 Запуск

### Крок 1️⃣: Миграції БД

```bash
# Перейти у backend
cd backend

# Активувати venv (якщо не активовано)
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Запустити міграції
python manage.py migrate

# Створити суперкористувача (адміністратор)
python manage.py createsuperuser
# Запам'ятати username та password

# Зібрати статичні файли
python manage.py collectstatic --noinput
```

### Крок 2️⃣: Запуск Backend

**Terminal 1** - Django Server:

```bash
cd backend
venv\Scripts\activate  # або: source venv/bin/activate
python manage.py runserver 0.0.0.0:8000
```

**Terminal 2** - Celery Worker:

```bash
cd backend
venv\Scripts\activate  # або: source venv/bin/activate
celery -A core worker -l info
```

**Terminal 3** - Celery Beat (Scheduler):

```bash
cd backend
venv\Scripts\activate  # або: source venv/bin/activate
celery -A core beat -l info
```

### Крок 3️⃣: Запуск Frontend

**Terminal 4** - React Dev Server:

```bash
cd frontend-vite
npm run dev
```

### ✅ Результат

Тепер дозволено отримати доступ:

| Компонент       | URL                           | Статус |
| --------------- | ----------------------------- | ------ |
| 🏠 Frontend     | `http://localhost:5173`       | ✅     |
| 🔌 API          | `http://localhost:8000/api`   | ✅     |
| 👨‍💼 Admin        | `http://localhost:8000/admin` | ✅     |
| 📊 Django Shell | `http://localhost:8000/shell` | ✅     |

---

## 🧪 Тестування

### 1️⃣ Перевірити Backend API

```bash
# Отримати список магазинів
curl http://localhost:8000/api/stores/

# Отримати інформацію про користувача (потребує токена)
curl -H "Authorization: Bearer your-token" \
  http://localhost:8000/api/accounts/profile/
```

### 2️⃣ Перевірити Frontend

```bash
# Відкрити браузер
http://localhost:5173

# Реєстрація
- Натиснути "Реєстрація"
- Заповнити дані
- Натиснути "Створити акаунт"

# Вхід
- Натиснути "Вхід"
- Ім'я користувача: demo
- Пароль: demo1234
```

### 3️⃣ Перевірити Celery Tasks

```bash
# У терміналі з Celery Worker повинні з'являтися повідомлення
# про виконання задач

# Тестова задача
python manage.py shell
>>> from core.tasks import send_order_confirmation_email
>>> send_order_confirmation_email.delay(order_id=1)
```

### 4️⃣ Перевірити Redis

```bash
redis-cli ping
# Повинен повернути: PONG
```

---

## 🌐 Production Deployment

### 1️⃣ Підготовка

```bash
# Оновити .env для production
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
SECRET_KEY=your-new-very-secret-key

# Мінімізувати assets
npm run build  # у frontend-vite
```

### 2️⃣ Використання Gunicorn + Nginx

```bash
# Встановити Gunicorn
pip install gunicorn

# Запустити Django з Gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### 3️⃣ Nginx конфігурація

Створити файл `/etc/nginx/sites-available/storeHub`:

```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location /static/ {
        alias /path/to/SaaS/backend/staticfiles/;
    }

    location /media/ {
        alias /path/to/SaaS/backend/media/;
    }

    location / {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4️⃣ SSL сертифікат (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5️⃣ Systemd Services

Crear `/etc/systemd/system/storeHub.service`:

```ini
[Unit]
Description=StoreHub Django App
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/path/to/SaaS/backend
ExecStart=/path/to/SaaS/backend/venv/bin/gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Активувати сервіс
sudo systemctl daemon-reload
sudo systemctl enable storeHub
sudo systemctl start storeHub
```

### 6️⃣ Celery Production Setup

Crear `/etc/systemd/system/storeHub-celery.service`:

```ini
[Unit]
Description=StoreHub Celery Worker
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=/path/to/SaaS/backend
ExecStart=/path/to/SaaS/backend/venv/bin/celery -A core worker -l info --logfile=/var/log/storeHub/celery.log
Restart=always

[Install]
WantedBy=multi-user.target
```

### 7️⃣ Мониторинг

```bash
# Встановити監視
pip install django-extensions

# Перевірити здоров'я сервера
curl http://localhost:8000/health
```

---

## 🐛 Решение проблем

### ❌ Помилка: "psycopg2: could not connect to database"

```bash
# Перевірити з'єднання
psql -U saas_user -d saas_platform -h localhost

# Перевірити вірний пароль в .env
```

### ❌ Помилка: "Redis connection refused"

```bash
# Перевірити чи Redis запущен
redis-cli ping

# Якщо не запущен:
# Windows: redis-server
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server
```

### ❌ Помилка: "ModuleNotFoundError: No module named 'xxx'"

```bash
# Переустановити залежності
pip install --upgrade pip
pip install -r requirements.txt
```

### ❌ Помилка міграцій

```bash
# Скинути міграції (тільки для розробки!)
python manage.py migrate core zero

# Переробити міграції
python manage.py migrate
```

### ❌ Проблема зі CORS

```bash
# Переконатися що Frontend URL в CORS_ALLOWED_ORIGINS
# В settings.py

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
]
```

---

## 📚 Додаткові ресурси

- [Django документація](https://docs.djangoproject.com)
- [Django REST Framework](https://www.django-rest-framework.org)
- [Celery документація](https://docs.celeryproject.org)
- [React документація](https://react.dev)
- [PostgreSQL документація](https://www.postgresql.org/docs)

---

## ✨ Все готово!

Поздравляем! Ваша StoreHub інстанція встановлена і готова до використання 🎉

**Наступні кроки**:

1. ✅ Перейти на `http://localhost:5173`
2. ✅ Зареєструватися
3. ✅ Створити магазин
4. ✅ Додати товари
5. ✅ Налаштувати платіжні системи
6. ✅ Запустити продажи!

---

_Потребуєте допомоги? Дивіться [документацію](./docs) або створіть issue на GitHub_ 📖
