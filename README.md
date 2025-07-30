# SaaS Mini-Store Platform

Повноцінна SaaS платформа для створення міні-магазинів з інтеграцією Telegram та Instagram.

## 🚀 Швидкий старт

### Вимоги
- Docker та Docker Compose
- Node.js 18+ (для локальної розробки)
- Python 3.11+ (для локальної розробки)

### Запуск з Docker (рекомендовано)

1. Клонуйте репозиторій:
```bash
git clone <repository-url>
cd saas-platform
```

2. Запустіть проект:
```bash
chmod +x start.sh
./start.sh
```

3. Відкрийте браузер:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin

### Локальний запуск

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# або venv\Scripts\activate  # Windows

pip install -r requirements.txt
cp env.example .env
# Налаштуйте .env файл

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 🏗️ Архітектура

### Backend (Django)
- **Django 4.2** - основний фреймворк
- **Django REST Framework** - API
- **PostgreSQL** - база даних
- **Redis** - кеш та черги
- **Celery** - фонові завдання
- **JWT** - аутентифікація

### Frontend (React)
- **React 18** - UI фреймворк
- **Tailwind CSS** - стилізація
- **React Router** - навігація
- **React Query** - управління станом
- **Zustand** - глобальний стан

## 📁 Структура проекту

```
saas-platform/
├── backend/                 # Django backend
│   ├── core/               # Основні налаштування
│   ├── accounts/           # Аутентифікація та користувачі
│   ├── stores/             # Управління магазинами
│   ├── products/           # Управління товарами
│   ├── orders/             # Управління замовленнями
│   ├── payments/           # Платежі
│   ├── notifications/      # Сповіщення
│   └── telegram_bot/       # Telegram бот
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React компоненти
│   │   ├── pages/          # Сторінки
│   │   ├── stores/         # Zustand stores
│   │   ├── services/       # API сервіси
│   │   └── utils/          # Утиліти
│   └── public/
└── docker-compose.yml      # Docker конфігурація
```

## 🔧 Основні функції

### 🔐 Аутентифікація
- JWT токени
- Реєстрація/вхід користувачів
- Профіль користувача
- Зміна пароля

### 🏪 Управління магазинами
- Створення та налаштування магазинів
- Кастомний дизайн (кольори, логотип)
- SEO налаштування
- Блоки контенту
- Соціальні мережі

### 📦 Управління товарами
- CRUD операції з товарами
- Категорії товарів
- Зображення товарів
- Варіанти товарів (розмір, колір)
- Ціни та знижки
- Наявність на складі

### 📋 Управління замовленнями
- Створення замовлень
- Статуси замовлень
- Історія змін статусів
- Кошик покупця
- Гостеві замовлення

### 🤖 Telegram інтеграція
- Telegram бот для кожного магазину
- Отримання замовлень через бота
- Сповіщення про нові замовлення
- Каталог товарів в боті

### 📱 Адаптивний UI
- Responsive дизайн
- Tailwind CSS
- Сучасний інтерфейс
- Мобільна версія

## 🎨 Лендинг-сторінки

Кожен магазин має унікальну лендинг-сторінку:
- Кастомний дизайн
- Каталог товарів
- Кошик покупця
- Форма замовлення
- Інтеграція з Instagram
- Telegram кнопка

## 💳 Платежі

Підтримка різних платіжних систем:
- Stripe
- PayPal
- ЮKassa
- Накладений платіж

## 📊 Адмін-панель

Повноцінна адмін-панель Django з:
- Управління користувачами
- Управління магазинами
- Управління товарами
- Управління замовленнями
- Статистика та аналітика

## 🔧 API Endpoints

### Аутентифікація
- `POST /api/auth/register/` - реєстрація
- `POST /api/auth/login/` - вхід
- `POST /api/auth/token/refresh/` - оновлення токена

### Магазини
- `GET /api/stores/` - список магазинів
- `POST /api/stores/` - створення магазину
- `GET /api/stores/{id}/` - деталі магазину
- `PUT /api/stores/{id}/` - оновлення магазину

### Товари
- `GET /api/stores/{store_id}/products/` - товари магазину
- `POST /api/stores/{store_id}/products/` - створення товару
- `GET /api/stores/{store_id}/products/{id}/` - деталі товару

### Замовлення
- `GET /api/stores/{store_id}/orders/` - замовлення магазину
- `POST /api/stores/{store_id}/orders/` - створення замовлення
- `GET /api/stores/{store_id}/orders/{id}/` - деталі замовлення

### Публічні API
- `GET /api/public/stores/{slug}/products/` - товари для публічного доступу
- `GET /api/public/stores/{slug}/cart/` - кошик
- `POST /api/public/stores/{slug}/checkout/` - оформлення замовлення

## 🚀 Розгортання

### Production
```bash
# Налаштуйте змінні середовища
cp backend/env.example backend/.env
# Відредагуйте .env файл

# Запустіть з production налаштуваннями
docker-compose -f docker-compose.prod.yml up -d
```

### Heroku
```bash
# Створіть Heroku додаток
heroku create your-app-name

# Додайте PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Додайте Redis
heroku addons:create heroku-redis:hobby-dev

# Розгорніть
git push heroku main
```

## 🔒 Безпека

- JWT токени з автоматичним оновленням
- CORS налаштування
- Валідація даних
- Захист від CSRF
- Безпечне зберігання паролів

## 📈 Монетизація

Платформа підтримує різні моделі монетизації:
- Абонентська плата
- Комісія з продажів
- Преміум функції
- Реклама

## 🤝 Розробка

### Додавання нових функцій
1. Створіть нову Django app
2. Додайте моделі та міграції
3. Створіть API endpoints
4. Додайте React компоненти
5. Оновіть навігацію

### Тестування
```bash
# Backend тести
cd backend
python manage.py test

# Frontend тести
cd frontend
npm test
```

## 📝 Ліцензія

MIT License

## 🤝 Внесок

1. Fork проект
2. Створіть feature branch
3. Зробіть коміт змін
4. Push до branch
5. Створіть Pull Request

## 📞 Підтримка

Для питань та підтримки:
- Створіть Issue в GitHub
- Email: support@saasplatform.com
- Telegram: @saasplatform_support

---

**SaaS Mini-Store Platform** - створено з ❤️ для малих бізнесів 